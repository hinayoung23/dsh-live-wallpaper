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
