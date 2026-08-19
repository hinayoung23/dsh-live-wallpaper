const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')

function loadClientExports() {
  const filename = path.join(__dirname, '..', 'client.js')
  const source = fs.readFileSync(filename, 'utf8')
  let handoff
  const window = {
    __ModuleLoader__: {
      load(value) {
        handoff = value
      },
    },
  }
  vm.runInNewContext(source, { window, globalThis: window, URL }, { filename })
  assert.equal(handoff.id, 'dsh-live-wallpaper')
  return handoff.factory(() => {
    throw new Error('The dependency-free client bundle must not require other modules.')
  })
}

test('client bundle registers a DSH lazy-CJS factory', () => {
  const exports = loadClientExports()
  assert.equal(typeof exports.apply, 'function')
})

test('ShaderToy ids are accepted from ids and official URLs', () => {
  const { parseShaderId } = loadClientExports()
  assert.equal(parseShaderId('NsyGWh'), 'NsyGWh')
  assert.equal(parseShaderId('https://www.shadertoy.com/view/NsyGWh'), 'NsyGWh')
  assert.equal(parseShaderId('https://www.shadertoy.com/embed/NsyGWh?gui=true'), 'NsyGWh')
  assert.equal(parseShaderId('https://example.com/view/NsyGWh'), undefined)
  assert.equal(parseShaderId('not a shader'), undefined)
})

test('remote media validation only permits HTTP(S)', () => {
  const { parseRemoteUrl } = loadClientExports()
  assert.equal(parseRemoteUrl('https://cdn.example.com/wallpaper.webm'), 'https://cdn.example.com/wallpaper.webm')
  assert.equal(parseRemoteUrl('http://127.0.0.1:8000/wallpaper.mp4'), 'http://127.0.0.1:8000/wallpaper.mp4')
  assert.equal(parseRemoteUrl('file:///tmp/wallpaper.mp4'), undefined)
  assert.equal(parseRemoteUrl('javascript:alert(1)'), undefined)
})

test('persisted state is bounded and stale local URLs fall back safely', () => {
  const { normalizeState } = loadClientExports()
  const state = normalizeState({
    enabled: true,
    source: { type: 'local-video', url: 'blob:stale' },
    dim: 99,
    blur: -20,
    surface: 3,
    speed: 9,
  })
  assert.equal(state.enabled, false)
  assert.equal(state.source.type, 'preset')
  assert.equal(state.source.id, 'aurora')
  assert.equal(state.dim, 0.8)
  assert.equal(state.blur, 0)
  assert.equal(state.surface, 0.94)
  assert.equal(state.speed, 2)
})

test('theme settings accept presets and reject unsafe persisted values', () => {
  const { normalizeState } = loadClientExports()
  const preset = normalizeState({
    themePreset: 'violet',
    buttonStyle: 'pill',
    fontStyle: 'mono',
    fontScale: 1.1,
  })
  assert.equal(preset.themeColor, '#160c2e')
  assert.equal(preset.accentColor, '#a78bfa')
  assert.equal(preset.buttonColor, '#c084fc')
  assert.equal(preset.buttonStyle, 'pill')
  assert.equal(preset.fontStyle, 'mono')
  assert.equal(preset.fontScale, 1.1)

  const invalid = normalizeState({
    themePreset: 'unknown',
    themeColor: 'red; background: url(javascript:alert(1))',
    accentColor: '#123',
    buttonColor: 'transparent',
    buttonStyle: 'floating',
    fontStyle: 'remote-font',
    fontScale: 4,
  })
  assert.equal(invalid.themePreset, 'ocean')
  assert.equal(invalid.themeColor, '#071326')
  assert.equal(invalid.accentColor, '#64e0c8')
  assert.equal(invalid.buttonColor, '#5eead4')
  assert.equal(invalid.buttonStyle, 'rounded')
  assert.equal(invalid.fontStyle, 'system')
  assert.equal(invalid.fontScale, 1.15)
})

test('button labels keep readable contrast against custom colors', () => {
  const { contrastText } = loadClientExports()
  assert.equal(contrastText('#f8fafc'), '#07111d')
  assert.equal(contrastText('#111827'), '#ffffff')
})

test('resource guidance provides an actionable shader example and downloadable videos', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'client.js'), 'utf8')
  assert.match(source, /shadertoy\.com\/view\/XXcyRn/)
  assert.match(source, /直接试用示例 XXcyRn/)
  assert.match(source, /pexels\.com\/search\/videos\/animated%20wallpaper/)
  assert.match(source, /pixabay\.com\/videos\/search\/animated%20background/)
  assert.doesNotMatch(source, /desktophut\.com/)
  assert.doesNotMatch(source, /github\.com\/rocksdanister\/lively/)
})
