window.__ModuleLoader__.load({
  id: 'dsh-live-wallpaper',
  factory: () => {
    const module = { exports: {} }
    const exports = module.exports

    const PLUGIN_ID = 'dsh-live-wallpaper'
    const STORAGE_KEY = 'dsh-live-wallpaper:settings:v1'
    const PRESET_IDS = new Set(['aurora', 'nebula', 'sunset', 'grid'])
    const LOCAL_TYPES = new Set(['local-video', 'local-image'])
    const DEFAULT_SOURCE = Object.freeze({ type: 'preset', id: 'aurora' })
    const DEFAULT_STATE = Object.freeze({
      enabled: true,
      source: DEFAULT_SOURCE,
      dim: 0.14,
      blur: 0,
      surface: 0.64,
      speed: 1,
      respectMotion: true,
    })

    function clamp(value, minimum, maximum, fallback) {
      const number = Number(value)
      if (!Number.isFinite(number)) return fallback
      return Math.min(maximum, Math.max(minimum, number))
    }

    function parseRemoteUrl(input) {
      if (typeof input !== 'string') return undefined
      try {
        const url = new URL(input.trim())
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
        return url.href
      } catch {
        return undefined
      }
    }

    function parseShaderId(input) {
      if (typeof input !== 'string') return undefined
      const value = input.trim()
      if (/^[A-Za-z0-9]{6,12}$/.test(value)) return value
      try {
        const url = new URL(value)
        if (url.hostname !== 'www.shadertoy.com' && url.hostname !== 'shadertoy.com') return undefined
        const match = url.pathname.match(/^\/(?:view|embed)\/([A-Za-z0-9]{6,12})\/?$/)
        return match?.[1]
      } catch {
        return undefined
      }
    }

    function normalizeSource(value) {
      if (typeof value !== 'object' || value === null) return { ...DEFAULT_SOURCE }
      if (value.type === 'preset' && PRESET_IDS.has(value.id)) {
        return { type: 'preset', id: value.id }
      }
      if (value.type === 'shader') {
        const id = parseShaderId(value.id)
        if (id !== undefined) return { type: 'shader', id }
      }
      if (value.type === 'video' || value.type === 'image' || value.type === 'webpage') {
        const url = parseRemoteUrl(value.url)
        if (url !== undefined) return { type: value.type, url }
      }
      return { ...DEFAULT_SOURCE }
    }

    function normalizeState(value) {
      const input = typeof value === 'object' && value !== null ? value : {}
      const staleLocalSource = typeof input.source === 'object'
        && input.source !== null
        && LOCAL_TYPES.has(input.source.type)
      return {
        enabled: staleLocalSource ? false : input.enabled === undefined ? DEFAULT_STATE.enabled : input.enabled === true,
        source: staleLocalSource ? { ...DEFAULT_SOURCE } : normalizeSource(input.source),
        dim: clamp(input.dim, 0, 0.8, DEFAULT_STATE.dim),
        blur: clamp(input.blur, 0, 24, DEFAULT_STATE.blur),
        surface: clamp(input.surface, 0.45, 0.94, DEFAULT_STATE.surface),
        speed: clamp(input.speed, 0.25, 2, DEFAULT_STATE.speed),
        respectMotion: input.respectMotion === undefined ? DEFAULT_STATE.respectMotion : input.respectMotion === true,
      }
    }

    function readState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw === null ? normalizeState(DEFAULT_STATE) : normalizeState(JSON.parse(raw))
      } catch {
        return normalizeState(DEFAULT_STATE)
      }
    }

    function writeState(state) {
      try {
        const serializable = LOCAL_TYPES.has(state.source.type)
          ? { ...state, enabled: false, source: { ...DEFAULT_SOURCE } }
          : state
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
      } catch {
        // Storage may be unavailable in hardened/private browser contexts.
      }
    }

    const GLOBAL_CSS = `
      html { --dwp-surface: .64; }
      body[data-dsh-wallpaper="active"] {
        background: transparent !important;
        --dsw-alias-bg-base: rgba(7, 12, 24, var(--dwp-surface)) !important;
        --dsw-alias-bg-layer-1: rgba(11, 18, 34, var(--dwp-surface)) !important;
        --dsw-alias-bg-layer-2: rgba(18, 27, 47, calc(var(--dwp-surface) + .04)) !important;
        --dsw-alias-bg-module-platform: rgba(16, 24, 43, calc(var(--dwp-surface) + .02)) !important;
        --dsw-alias-bg-overlay: rgba(10, 16, 30, .94) !important;
        --dsw-specific-sidebar-fill: rgba(8, 14, 27, calc(var(--dwp-surface) + .04)) !important;
        --dsw-specific-input-major: rgba(17, 25, 45, calc(var(--dwp-surface) + .22)) !important;
        --dsw-alias-button-elevated-fill: rgba(20, 29, 50, calc(var(--dwp-surface) + .18)) !important;
        --dsw-alias-button-floating-hover: rgba(36, 48, 73, calc(var(--dwp-surface) + .18)) !important;
        --dsw-alias-label-primary: rgba(250, 252, 255, .96) !important;
        --dsw-alias-label-secondary: rgba(224, 231, 244, .78) !important;
        --dsw-alias-border-l1: rgba(255, 255, 255, .09) !important;
        --dsw-alias-border-l2: rgba(255, 255, 255, .14) !important;
      }
      body[data-dsh-wallpaper="active"] #root {
        background: transparent !important;
      }
      #root { position: relative; z-index: 1; }
      #dsh-live-wallpaper-layer {
        position: fixed;
        inset: 0;
        z-index: 0;
        overflow: hidden;
        pointer-events: none;
        background: #070c18;
      }
      #dsh-live-wallpaper-layer .dwp-content,
      #dsh-live-wallpaper-layer .dwp-scene,
      #dsh-live-wallpaper-layer video,
      #dsh-live-wallpaper-layer img,
      #dsh-live-wallpaper-layer iframe {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        border: 0;
      }
      #dsh-live-wallpaper-layer video,
      #dsh-live-wallpaper-layer img { object-fit: cover; }
      #dsh-live-wallpaper-layer .dwp-content {
        overflow: hidden;
        will-change: filter, transform;
      }
      #dsh-live-wallpaper-layer .dwp-scrim {
        position: absolute;
        inset: 0;
        background: #02050d;
        pointer-events: none;
      }
      #dsh-live-wallpaper-layer[data-paused="true"] *,
      #dsh-live-wallpaper-layer[data-paused="true"] *::before,
      #dsh-live-wallpaper-layer[data-paused="true"] *::after {
        animation-play-state: paused !important;
      }
      .dwp-preset-aurora {
        overflow: hidden;
        background:
          radial-gradient(circle at 72% 18%, rgba(33, 226, 191, .23), transparent 28%),
          radial-gradient(circle at 18% 78%, rgba(61, 111, 255, .28), transparent 34%),
          linear-gradient(145deg, #030817 0%, #0b1632 48%, #100a2d 100%);
      }
      .dwp-preset-aurora span {
        position: absolute;
        width: 62vmax;
        height: 26vmax;
        left: 12%;
        top: 10%;
        border-radius: 50%;
        filter: blur(48px);
        opacity: .72;
        transform: rotate(-14deg);
        background: linear-gradient(90deg, transparent, #30d8b4, #4077ff, transparent);
        animation: dwp-aurora 13s ease-in-out infinite alternate;
      }
      .dwp-preset-aurora span:nth-child(2) {
        left: -12%;
        top: 52%;
        opacity: .38;
        animation-duration: 18s;
        animation-delay: -6s;
        background: linear-gradient(90deg, transparent, #6a4cff, #ff4fd8, transparent);
      }
      .dwp-preset-nebula {
        overflow: hidden;
        background:
          radial-gradient(circle at 50% 50%, transparent 0 15%, rgba(255,255,255,.025) 16% 17%, transparent 18%),
          radial-gradient(circle at 15% 35%, #402a81 0, transparent 35%),
          radial-gradient(circle at 82% 63%, #075f7b 0, transparent 38%),
          #050713;
        background-size: 100% 100%, 130% 130%, 140% 140%, auto;
        animation: dwp-nebula 20s ease-in-out infinite alternate;
      }
      .dwp-preset-nebula::before,
      .dwp-preset-nebula::after {
        content: '';
        position: absolute;
        inset: -30%;
        background-image:
          radial-gradient(circle, rgba(255,255,255,.88) 0 1px, transparent 1.7px),
          radial-gradient(circle, rgba(137,198,255,.62) 0 1px, transparent 1.6px);
        background-position: 0 0, 28px 43px;
        background-size: 83px 83px, 127px 127px;
        animation: dwp-stars 42s linear infinite;
      }
      .dwp-preset-nebula::after {
        opacity: .42;
        transform: scale(1.25);
        animation-duration: 62s;
        animation-direction: reverse;
      }
      .dwp-preset-sunset {
        overflow: hidden;
        background:
          radial-gradient(circle at 50% 63%, rgba(255, 232, 171, .95) 0 4%, rgba(255, 117, 90, .72) 8%, transparent 26%),
          linear-gradient(180deg, #271c59 0%, #ad3f77 48%, #f08a67 68%, #10152b 69%);
        animation: dwp-sunset 16s ease-in-out infinite alternate;
      }
      .dwp-preset-sunset::after {
        content: '';
        position: absolute;
        left: -15%;
        right: -15%;
        bottom: -28%;
        height: 56%;
        border-radius: 50% 50% 0 0;
        background:
          repeating-radial-gradient(ellipse at 50% 0, rgba(245,155,126,.22) 0 2px, transparent 3px 20px),
          linear-gradient(#11182d, #050914);
        animation: dwp-water 9s ease-in-out infinite alternate;
      }
      .dwp-preset-grid {
        overflow: hidden;
        background:
          radial-gradient(circle at 50% 45%, rgba(90, 53, 255, .42), transparent 36%),
          linear-gradient(#08091c 0 56%, #15072a 57%, #04050d 100%);
      }
      .dwp-preset-grid::before {
        content: '';
        position: absolute;
        left: -45%;
        right: -45%;
        top: 54%;
        bottom: -58%;
        transform: perspective(420px) rotateX(61deg);
        transform-origin: 50% 0;
        background-image:
          linear-gradient(rgba(62, 222, 255, .55) 1px, transparent 1px),
          linear-gradient(90deg, rgba(235, 64, 255, .55) 1px, transparent 1px);
        background-size: 54px 35px;
        animation: dwp-grid 2.8s linear infinite;
        mask-image: linear-gradient(to bottom, transparent, #000 24%);
      }
      .dwp-preset-grid::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 56%;
        height: 2px;
        background: #ff56f6;
        box-shadow: 0 0 22px 8px rgba(255, 54, 234, .5);
        animation: dwp-horizon 5s ease-in-out infinite alternate;
      }
      @keyframes dwp-aurora {
        0% { transform: translate3d(-8%, -5%, 0) rotate(-16deg) scale(.92); }
        50% { transform: translate3d(12%, 18%, 0) rotate(-2deg) scale(1.08); }
        100% { transform: translate3d(-2%, 35%, 0) rotate(11deg) scale(.96); }
      }
      @keyframes dwp-nebula {
        from { background-position: 0 0, 0 0, 0 0, 0 0; filter: hue-rotate(0deg); }
        to { background-position: 0 0, 12% 8%, -10% -6%, 0 0; filter: hue-rotate(24deg); }
      }
      @keyframes dwp-stars { to { transform: translate3d(7%, 9%, 0) rotate(3deg); } }
      @keyframes dwp-sunset { to { filter: hue-rotate(-13deg) saturate(1.15); } }
      @keyframes dwp-water { to { transform: translateY(3%) scaleX(1.04); } }
      @keyframes dwp-grid { to { background-position: 0 35px, 54px 0; } }
      @keyframes dwp-horizon { to { opacity: .62; box-shadow: 0 0 42px 13px rgba(255, 54, 234, .64); } }
    `

    const PANEL_CSS = `
      :host { all: initial; color-scheme: dark; }
      * { box-sizing: border-box; }
      .launcher {
        position: fixed;
        right: 22px;
        bottom: 22px;
        z-index: 2147483647;
        width: 46px;
        height: 46px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(255,255,255,.2);
        border-radius: 50%;
        color: white;
        background: linear-gradient(145deg, rgba(37,49,84,.96), rgba(15,21,39,.96));
        box-shadow: 0 12px 34px rgba(0,0,0,.42), inset 0 1px rgba(255,255,255,.11);
        cursor: pointer;
        transition: transform .18s ease, border-color .18s ease;
      }
      .launcher:hover { transform: translateY(-2px); border-color: rgba(125,211,252,.68); }
      .launcher svg { width: 22px; height: 22px; }
      .panel {
        position: fixed;
        right: 20px;
        bottom: 80px;
        z-index: 2147483647;
        width: min(390px, calc(100vw - 28px));
        max-height: calc(100vh - 104px);
        overflow: auto;
        padding: 0 18px 18px;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 20px;
        color: #f5f7fb;
        background: rgba(8, 13, 26, .94);
        box-shadow: 0 24px 70px rgba(0,0,0,.52);
        backdrop-filter: blur(24px) saturate(1.25);
        font: 13px/1.45 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        scrollbar-width: thin;
      }
      .panel[hidden] { display: none; }
      .header {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 0 -18px;
        padding: 16px 18px 13px;
        border-bottom: 1px solid rgba(255,255,255,.08);
        background: rgba(8,13,26,.94);
        backdrop-filter: blur(20px);
      }
      h2 { margin: 0; font-size: 16px; letter-spacing: .01em; }
      h3 { margin: 18px 0 9px; color: #dce5f7; font-size: 12px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; }
      p { margin: 7px 0; color: #aebbd1; }
      button, input, select { font: inherit; }
      button { color: inherit; }
      .icon-button {
        width: 30px;
        height: 30px;
        border: 0;
        border-radius: 9px;
        color: #c9d4e8;
        background: transparent;
        cursor: pointer;
      }
      .icon-button:hover { background: rgba(255,255,255,.08); }
      .switch-row, .control-row, .source-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .switch-row {
        justify-content: space-between;
        margin-top: 15px;
        padding: 11px 12px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 13px;
        background: rgba(255,255,255,.035);
      }
      .switch-row input { width: 18px; height: 18px; accent-color: #55d6be; }
      .presets { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
      .preset {
        position: relative;
        min-height: 74px;
        overflow: hidden;
        padding: 9px;
        border: 1px solid rgba(255,255,255,.11);
        border-radius: 13px;
        text-align: left;
        cursor: pointer;
        background: var(--preview);
      }
      .preset::after { content: ''; position: absolute; inset: 0; background: linear-gradient(transparent 20%, rgba(0,0,0,.6)); }
      .preset span { position: absolute; z-index: 1; left: 10px; bottom: 8px; font-size: 12px; font-weight: 650; text-shadow: 0 1px 6px #000; }
      .preset[aria-pressed="true"] { outline: 2px solid #5eead4; outline-offset: -2px; }
      .field { display: grid; gap: 7px; margin-top: 9px; }
      .field > span, .range-head { color: #c7d2e5; font-size: 12px; }
      input[type="url"], input[type="text"], select {
        min-width: 0;
        height: 36px;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 10px;
        outline: none;
        color: #eef4ff;
        background: rgba(255,255,255,.055);
        padding: 0 10px;
      }
      input[type="url"]:focus, input[type="text"]:focus, select:focus { border-color: #4fd1c5; box-shadow: 0 0 0 2px rgba(79,209,197,.14); }
      .source-row input { flex: 1; }
      .source-row select { width: 88px; }
      .primary, .secondary, .file-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 36px;
        border-radius: 10px;
        padding: 0 13px;
        cursor: pointer;
      }
      .primary { border: 0; color: #06111c; background: #64e0c8; font-weight: 700; }
      .primary:hover { background: #81ead5; }
      .secondary, .file-button { border: 1px solid rgba(255,255,255,.13); background: rgba(255,255,255,.055); }
      .secondary:hover, .file-button:hover { background: rgba(255,255,255,.09); }
      .file-button input { display: none; }
      .range { margin-top: 11px; }
      .range-head { display: flex; justify-content: space-between; margin-bottom: 3px; }
      input[type="range"] { width: 100%; accent-color: #56d9c0; }
      .control-row { justify-content: space-between; margin-top: 11px; }
      .control-row select { width: 100px; }
      .resource-links { display: flex; flex-wrap: wrap; gap: 7px; }
      .resource-links a {
        color: #bfe9ff;
        text-decoration: none;
        border: 1px solid rgba(125,211,252,.18);
        border-radius: 999px;
        padding: 5px 9px;
        background: rgba(56,189,248,.07);
      }
      .resource-links a:hover { background: rgba(56,189,248,.14); }
      .hint { font-size: 11px; color: #8796af; }
      .status { min-height: 19px; margin-top: 9px; color: #9ee7d8; font-size: 12px; }
      .status[data-kind="error"] { color: #fca5a5; }
      .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 13px; border-top: 1px solid rgba(255,255,255,.08); }
      .footer .secondary { min-height: 32px; }
    `

    function makeElement(tag, className) {
      const element = document.createElement(tag)
      if (className !== undefined) element.className = className
      return element
    }

    function createController() {
      document.getElementById(`${PLUGIN_ID}-layer`)?.remove()
      document.getElementById(`${PLUGIN_ID}-controls`)?.remove()
      document.querySelector(`style[data-plugin-css="${PLUGIN_ID}"]`)?.remove()

      let state = readState()
      let objectUrl
      let currentMedia
      let panelOpen = false

      const globalStyle = makeElement('style')
      globalStyle.dataset.plugin = PLUGIN_ID
      globalStyle.dataset.pluginCss = PLUGIN_ID
      globalStyle.textContent = GLOBAL_CSS
      document.head.append(globalStyle)

      const layer = makeElement('div')
      layer.id = `${PLUGIN_ID}-layer`
      layer.setAttribute('aria-hidden', 'true')
      const content = makeElement('div', 'dwp-content')
      const scrim = makeElement('div', 'dwp-scrim')
      layer.append(content, scrim)
      document.body.insertBefore(layer, document.body.firstChild)

      const controls = makeElement('div')
      controls.id = `${PLUGIN_ID}-controls`
      const shadow = controls.attachShadow({ mode: 'open' })
      shadow.innerHTML = `
        <style>${PANEL_CSS}</style>
        <button class="launcher" type="button" aria-label="打开动态壁纸中心" aria-expanded="false">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9a2.5 2.5 0 0 1-2.5 2.5H13v2h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2H6.5A2.5 2.5 0 0 1 4 14.5v-9Z" stroke="currentColor" stroke-width="1.7"/><path d="m7 12 2.2-2.2a1 1 0 0 1 1.4 0l1.3 1.3 2.4-3a1 1 0 0 1 1.5-.08L18 10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <section class="panel" hidden aria-label="动态壁纸中心">
          <header class="header">
            <h2>动态壁纸中心</h2>
            <button class="icon-button close" type="button" aria-label="关闭">✕</button>
          </header>

          <label class="switch-row">
            <span>启用当前壁纸</span>
            <input class="enabled" type="checkbox">
          </label>

          <h3>内置动态</h3>
          <div class="presets">
            <button class="preset" type="button" data-preset="aurora" style="--preview:radial-gradient(circle at 75% 15%,#2dd4bf,transparent 43%),linear-gradient(145deg,#08112d,#33206d)"><span>极光</span></button>
            <button class="preset" type="button" data-preset="nebula" style="--preview:radial-gradient(circle at 25% 30%,#6842a8,transparent 48%),radial-gradient(circle at 80% 70%,#087c91,transparent 48%),#070917"><span>星云</span></button>
            <button class="preset" type="button" data-preset="sunset" style="--preview:radial-gradient(circle at 50% 63%,#ffe3b0 0 8%,transparent 24%),linear-gradient(#342268,#d84e7f 62%,#0b1022 63%)"><span>落日流光</span></button>
            <button class="preset" type="button" data-preset="grid" style="--preview:linear-gradient(160deg,#100c35,#4a155f 55%,#050714)"><span>霓虹网格</span></button>
          </div>

          <h3>视频 / 图片 / 网页 URL</h3>
          <div class="source-row">
            <select class="remote-type" aria-label="URL 类型">
              <option value="video">视频</option>
              <option value="image">图片</option>
              <option value="webpage">网页</option>
            </select>
            <input class="remote-url" type="url" placeholder="https://…/wallpaper.mp4" aria-label="远程壁纸 URL">
            <button class="primary apply-remote" type="button">应用</button>
          </div>
          <p class="hint">支持 HTTP(S)。远程站点可能禁止嵌入，视频推荐 MP4/WebM。</p>

          <h3>ShaderToy</h3>
          <div class="source-row">
            <input class="shader-id" type="text" placeholder="Shader ID 或官方链接" aria-label="ShaderToy ID 或链接">
            <button class="primary apply-shader" type="button">应用</button>
          </div>
          <p class="hint">通过官方嵌入页播放；请遵守作品作者标注的许可。</p>

          <h3>本地文件</h3>
          <label class="file-button">选择视频、GIF 或图片<input class="local-file" type="file" accept="video/*,image/*,.gif"></label>
          <p class="hint">文件不会上传；浏览器刷新后需重新选择。</p>

          <h3>显示效果</h3>
          <label class="range">
            <span class="range-head"><span>背景暗度</span><output class="dim-value"></output></span>
            <input class="dim" type="range" min="0" max="0.8" step="0.01">
          </label>
          <label class="range">
            <span class="range-head"><span>背景模糊</span><output class="blur-value"></output></span>
            <input class="blur" type="range" min="0" max="24" step="1">
          </label>
          <label class="range">
            <span class="range-head"><span>界面遮罩</span><output class="surface-value"></output></span>
            <input class="surface" type="range" min="0.45" max="0.94" step="0.01">
          </label>
          <label class="control-row"><span>视频速度</span><select class="speed"><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
          <label class="switch-row"><span>跟随系统“减少动态效果”</span><input class="respect-motion" type="checkbox"></label>

          <h3>发现资源</h3>
          <div class="resource-links">
            <a href="https://www.shadertoy.com/results?query=" target="_blank" rel="noopener noreferrer">ShaderToy</a>
            <a href="https://www.desktophut.com/" target="_blank" rel="noopener noreferrer">DesktopHut</a>
            <a href="https://github.com/rocksdanister/lively" target="_blank" rel="noopener noreferrer">Lively</a>
          </div>
          <p class="hint">插件不抓取第三方市场；可下载文件后本地应用，或粘贴有权使用的直链。</p>

          <div class="status" role="status" aria-live="polite"></div>
          <footer class="footer"><span class="hint">设置自动保存在此浏览器</span><button class="secondary reset" type="button">恢复默认</button></footer>
        </section>
      `
      document.body.append(controls)

      const $ = selector => shadow.querySelector(selector)
      const panel = $('.panel')
      const launcher = $('.launcher')
      const status = $('.status')
      const reducedMotion = typeof matchMedia === 'function'
        ? matchMedia('(prefers-reduced-motion: reduce)')
        : undefined

      function motionPaused() {
        return document.hidden || (state.respectMotion && reducedMotion?.matches === true)
      }

      function showStatus(message, kind = 'ok') {
        status.textContent = message
        status.dataset.kind = kind
      }

      function clearContent() {
        currentMedia = undefined
        content.replaceChildren()
      }

      function makePreset(id) {
        const scene = makeElement('div', `dwp-scene dwp-preset-${id}`)
        if (id === 'aurora') scene.append(makeElement('span'), makeElement('span'))
        return scene
      }

      function makeShader(id) {
        const iframe = makeElement('iframe')
        const paused = motionPaused() ? 'true' : 'false'
        iframe.src = `https://www.shadertoy.com/embed/${encodeURIComponent(id)}?gui=false&t=10&paused=${paused}&muted=true`
        iframe.title = `ShaderToy ${id}`
        iframe.loading = 'eager'
        iframe.referrerPolicy = 'strict-origin-when-cross-origin'
        iframe.setAttribute('sandbox', 'allow-scripts allow-pointer-lock')
        iframe.setAttribute('allow', 'autoplay; fullscreen')
        return iframe
      }

      function makeWebpage(url) {
        const iframe = makeElement('iframe')
        iframe.src = url
        iframe.title = '动态壁纸网页'
        iframe.referrerPolicy = 'strict-origin-when-cross-origin'
        iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-pointer-lock')
        iframe.setAttribute('allow', 'autoplay; fullscreen')
        return iframe
      }

      function renderSource() {
        clearContent()
        const source = state.source
        let media
        if (source.type === 'preset') {
          media = makePreset(source.id)
        } else if (source.type === 'shader') {
          media = makeShader(source.id)
        } else if (source.type === 'video' || source.type === 'local-video') {
          media = makeElement('video')
          media.src = source.url
          media.autoplay = true
          media.muted = true
          media.loop = true
          media.playsInline = true
          media.preload = 'auto'
          media.playbackRate = state.speed
          media.addEventListener('error', () => showStatus('视频加载失败，请检查直链或改用本地文件。', 'error'))
          media.addEventListener('canplay', () => showStatus('视频壁纸已就绪。'))
        } else if (source.type === 'image' || source.type === 'local-image') {
          media = makeElement('img')
          media.src = source.url
          media.alt = ''
          media.addEventListener('error', () => showStatus('图片加载失败，请检查地址。', 'error'))
        } else if (source.type === 'webpage') {
          media = makeWebpage(source.url)
        }
        if (media !== undefined) {
          currentMedia = media
          content.append(media)
        }
      }

      function syncPlayback() {
        const paused = motionPaused()
        layer.dataset.paused = String(paused)
        if (currentMedia?.tagName === 'VIDEO') {
          currentMedia.playbackRate = state.speed
          if (paused || !state.enabled) {
            currentMedia.pause()
          } else {
            void currentMedia.play().catch(() => {
              showStatus('浏览器阻止了自动播放；请在页面上完成一次交互后重试。', 'error')
            })
          }
        }
      }

      function syncAppearance() {
        layer.hidden = !state.enabled
        document.body.dataset.dshWallpaper = state.enabled ? 'active' : 'inactive'
        document.documentElement.style.setProperty('--dwp-surface', String(state.surface))
        scrim.style.opacity = String(state.dim)
        content.style.filter = state.blur > 0 ? `blur(${state.blur}px)` : ''
        content.style.transform = state.blur > 0 ? `scale(${1 + state.blur / 500})` : ''
        syncPlayback()
      }

      function refreshPanel() {
        $('.enabled').checked = state.enabled
        $('.dim').value = String(state.dim)
        $('.blur').value = String(state.blur)
        $('.surface').value = String(state.surface)
        $('.speed').value = String(state.speed)
        $('.respect-motion').checked = state.respectMotion
        $('.dim-value').textContent = `${Math.round(state.dim * 100)}%`
        $('.blur-value').textContent = `${Math.round(state.blur)}px`
        $('.surface-value').textContent = `${Math.round(state.surface * 100)}%`
        for (const button of shadow.querySelectorAll('[data-preset]')) {
          button.setAttribute('aria-pressed', String(state.source.type === 'preset' && state.source.id === button.dataset.preset))
        }
      }

      function commit({ rerender = false } = {}) {
        writeState(state)
        if (rerender) renderSource()
        syncAppearance()
        refreshPanel()
      }

      function setSource(source, message) {
        if (objectUrl !== undefined && source.url !== objectUrl) {
          URL.revokeObjectURL(objectUrl)
          objectUrl = undefined
        }
        state = { ...state, enabled: true, source }
        commit({ rerender: true })
        showStatus(message)
      }

      function setPanelOpen(open) {
        panelOpen = open
        panel.hidden = !open
        launcher.setAttribute('aria-expanded', String(open))
        if (open) refreshPanel()
      }

      launcher.addEventListener('click', () => setPanelOpen(!panelOpen))
      $('.close').addEventListener('click', () => setPanelOpen(false))
      $('.enabled').addEventListener('change', event => {
        state = { ...state, enabled: event.currentTarget.checked }
        commit()
        showStatus(state.enabled ? '壁纸已启用。' : '壁纸已暂停显示。')
      })
      for (const button of shadow.querySelectorAll('[data-preset]')) {
        button.addEventListener('click', () => setSource(
          { type: 'preset', id: button.dataset.preset },
          `已应用“${button.textContent.trim()}”。`,
        ))
      }
      $('.apply-remote').addEventListener('click', () => {
        const url = parseRemoteUrl($('.remote-url').value)
        if (url === undefined) {
          showStatus('请输入有效的 HTTP(S) 地址。', 'error')
          return
        }
        const type = $('.remote-type').value
        setSource({ type, url }, '远程壁纸已应用。')
      })
      $('.apply-shader').addEventListener('click', () => {
        const id = parseShaderId($('.shader-id').value)
        if (id === undefined) {
          showStatus('请输入有效的 ShaderToy ID 或官方链接。', 'error')
          return
        }
        setSource({ type: 'shader', id }, `ShaderToy ${id} 已应用。`)
      })
      $('.local-file').addEventListener('change', event => {
        const file = event.currentTarget.files?.[0]
        if (file === undefined) return
        const type = file.type.startsWith('video/')
          ? 'local-video'
          : file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.gif')
            ? 'local-image'
            : undefined
        if (type === undefined) {
          showStatus('暂不支持此文件类型。', 'error')
          return
        }
        if (objectUrl !== undefined) URL.revokeObjectURL(objectUrl)
        objectUrl = URL.createObjectURL(file)
        setSource({ type, url: objectUrl }, `已应用本地文件：${file.name}`)
      })
      for (const key of ['dim', 'blur', 'surface']) {
        $("." + key).addEventListener('input', event => {
          state = { ...state, [key]: Number(event.currentTarget.value) }
          commit()
        })
      }
      $('.speed').addEventListener('change', event => {
        state = { ...state, speed: Number(event.currentTarget.value) }
        commit()
      })
      $('.respect-motion').addEventListener('change', event => {
        state = { ...state, respectMotion: event.currentTarget.checked }
        commit({ rerender: state.source.type === 'shader' })
      })
      $('.reset').addEventListener('click', () => {
        state = normalizeState(DEFAULT_STATE)
        $('.remote-url').value = ''
        $('.shader-id').value = ''
        commit({ rerender: true })
        showStatus('已恢复默认设置。')
      })

      const onVisibilityChange = () => syncPlayback()
      const onReducedMotionChange = () => {
        if (state.source.type === 'shader') renderSource()
        syncPlayback()
      }
      const onKeyDown = event => {
        if (event.key === 'Escape' && panelOpen) setPanelOpen(false)
      }
      document.addEventListener('visibilitychange', onVisibilityChange)
      document.addEventListener('keydown', onKeyDown)
      reducedMotion?.addEventListener?.('change', onReducedMotionChange)

      renderSource()
      syncAppearance()
      refreshPanel()

      return {
        dispose() {
          document.removeEventListener('visibilitychange', onVisibilityChange)
          document.removeEventListener('keydown', onKeyDown)
          reducedMotion?.removeEventListener?.('change', onReducedMotionChange)
          if (objectUrl !== undefined) URL.revokeObjectURL(objectUrl)
          layer.remove()
          controls.remove()
          globalStyle.remove()
          delete document.body.dataset.dshWallpaper
          document.documentElement.style.removeProperty('--dwp-surface')
        },
      }
    }

    function apply(ctx) {
      if (typeof document === 'undefined' || document.body === null) return
      const controller = createController()
      ctx.effect(() => () => controller.dispose(), 'dsh-live-wallpaper: browser presentation')
    }

    exports.apply = apply
    exports.normalizeState = normalizeState
    exports.parseRemoteUrl = parseRemoteUrl
    exports.parseShaderId = parseShaderId
    return module.exports
  },
})
