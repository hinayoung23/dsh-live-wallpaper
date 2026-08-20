window.__ModuleLoader__.load({
  id: 'dsh-live-wallpaper',
  factory: () => {
    const module = { exports: {} }
    const exports = module.exports

    const PLUGIN_ID = 'dsh-live-wallpaper'
    const STORAGE_KEY = 'dsh-live-wallpaper:settings:v1'
    const PRESET_IDS = new Set(['aurora', 'nebula', 'sunset', 'grid'])
    const LOCAL_TYPES = new Set(['local-video', 'local-image', 'shader-capture'])
    const BUTTON_STYLES = new Set(['native', 'rounded', 'pill', 'square', 'glass'])
    const FONT_STYLES = new Set(['system', 'rounded', 'serif', 'mono'])
    const THEME_PRESETS = Object.freeze({
      ocean: Object.freeze({ base: '#071326', accent: '#64e0c8', button: '#5eead4' }),
      violet: Object.freeze({ base: '#160c2e', accent: '#a78bfa', button: '#c084fc' }),
      forest: Object.freeze({ base: '#071d18', accent: '#5ee0a0', button: '#4ade80' }),
      sunset: Object.freeze({ base: '#2a1118', accent: '#fb7185', button: '#fb923c' }),
      graphite: Object.freeze({ base: '#12151b', accent: '#8ea4c8', button: '#93c5fd' }),
    })
    const FONT_STACKS = Object.freeze({
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      rounded: '"SF Pro Rounded", "Arial Rounded MT Bold", "Hiragino Sans GB", "PingFang SC", sans-serif',
      serif: '"Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", Georgia, serif',
      mono: '"SFMono-Regular", "JetBrains Mono", "Cascadia Code", "Roboto Mono", monospace',
    })
    const DEFAULT_SOURCE = Object.freeze({ type: 'preset', id: 'aurora' })
    const DEFAULT_STATE = Object.freeze({
      enabled: true,
      source: DEFAULT_SOURCE,
      dim: 0.14,
      blur: 0,
      surface: 0.64,
      speed: 1,
      respectMotion: true,
      themeEnabled: true,
      themePreset: 'ocean',
      themeColor: THEME_PRESETS.ocean.base,
      accentColor: THEME_PRESETS.ocean.accent,
      buttonColor: THEME_PRESETS.ocean.button,
      buttonStyle: 'rounded',
      fontStyle: 'system',
      fontScale: 1,
    })

    function clamp(value, minimum, maximum, fallback) {
      const number = Number(value)
      if (!Number.isFinite(number)) return fallback
      return Math.min(maximum, Math.max(minimum, number))
    }

    function normalizeHex(value, fallback) {
      if (typeof value !== 'string' || !/^#[\da-f]{6}$/i.test(value.trim())) return fallback
      return value.trim().toLowerCase()
    }

    function hexToRgb(value) {
      const hex = normalizeHex(value, '#000000').slice(1)
      return [0, 2, 4].map(index => Number.parseInt(hex.slice(index, index + 2), 16))
    }

    function shadeHex(value, amount) {
      const channels = hexToRgb(value).map(channel => Math.round(channel + (255 - channel) * amount))
      return `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`
    }

    function contrastText(value) {
      const [red, green, blue] = hexToRgb(value).map(channel => {
        const normalized = channel / 255
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue > 0.42 ? '#07111d' : '#ffffff'
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
      const themePreset = Object.hasOwn(THEME_PRESETS, input.themePreset) || input.themePreset === 'custom'
        ? input.themePreset
        : DEFAULT_STATE.themePreset
      const themeDefaults = THEME_PRESETS[themePreset] ?? THEME_PRESETS[DEFAULT_STATE.themePreset]
      return {
        enabled: staleLocalSource ? false : input.enabled === undefined ? DEFAULT_STATE.enabled : input.enabled === true,
        source: staleLocalSource ? { ...DEFAULT_SOURCE } : normalizeSource(input.source),
        dim: clamp(input.dim, 0, 0.8, DEFAULT_STATE.dim),
        blur: clamp(input.blur, 0, 24, DEFAULT_STATE.blur),
        surface: clamp(input.surface, 0.45, 0.94, DEFAULT_STATE.surface),
        speed: clamp(input.speed, 0.25, 2, DEFAULT_STATE.speed),
        respectMotion: input.respectMotion === undefined ? DEFAULT_STATE.respectMotion : input.respectMotion === true,
        themeEnabled: input.themeEnabled === undefined ? DEFAULT_STATE.themeEnabled : input.themeEnabled === true,
        themePreset,
        themeColor: normalizeHex(input.themeColor, themeDefaults.base),
        accentColor: normalizeHex(input.accentColor, themeDefaults.accent),
        buttonColor: normalizeHex(input.buttonColor, themeDefaults.button),
        buttonStyle: BUTTON_STYLES.has(input.buttonStyle) ? input.buttonStyle : DEFAULT_STATE.buttonStyle,
        fontStyle: FONT_STYLES.has(input.fontStyle) ? input.fontStyle : DEFAULT_STATE.fontStyle,
        fontScale: clamp(input.fontScale, 0.9, 1.15, DEFAULT_STATE.fontScale),
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
      html {
        --dwp-surface: .64;
        --dwp-theme-rgb: 7, 19, 38;
        --dwp-theme-layer-1-rgb: 17, 31, 53;
        --dwp-theme-layer-2-rgb: 29, 44, 69;
        --dwp-accent: #64e0c8;
        --dwp-button: #5eead4;
        --dwp-button-hover: #76eddb;
        --dwp-button-text: #07111d;
        --dwp-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif;
        --dwp-font-scale: 1;
      }
      body:is([data-dsh-wallpaper="active"], [data-dsh-theme="active"]) {
        --dwp-active-surface: 1;
        background: rgb(var(--dwp-theme-rgb)) !important;
        --dsw-alias-bg-base: rgba(var(--dwp-theme-rgb), var(--dwp-active-surface)) !important;
        --dsw-alias-bg-layer-1: rgba(var(--dwp-theme-layer-1-rgb), var(--dwp-active-surface)) !important;
        --dsw-alias-bg-layer-2: rgba(var(--dwp-theme-layer-2-rgb), calc(var(--dwp-active-surface) + .04)) !important;
        --dsw-alias-bg-module-platform: rgba(var(--dwp-theme-layer-1-rgb), calc(var(--dwp-active-surface) + .02)) !important;
        --dsw-alias-bg-overlay: rgba(var(--dwp-theme-rgb), .94) !important;
        --dsw-specific-sidebar-fill: rgba(var(--dwp-theme-rgb), calc(var(--dwp-active-surface) + .04)) !important;
        --dsw-specific-input-major: rgba(var(--dwp-theme-layer-1-rgb), calc(var(--dwp-active-surface) + .22)) !important;
        --dsw-alias-button-elevated-fill: rgba(var(--dwp-theme-layer-2-rgb), calc(var(--dwp-active-surface) + .18)) !important;
        --dsw-alias-button-floating-fill: rgba(var(--dwp-theme-layer-1-rgb), calc(var(--dwp-active-surface) + .14)) !important;
        --dsw-alias-button-floating-hover: rgba(var(--dwp-theme-layer-2-rgb), calc(var(--dwp-active-surface) + .18)) !important;
        --dsw-alias-label-primary: rgba(250, 252, 255, .96) !important;
        --dsw-alias-label-secondary: rgba(224, 231, 244, .78) !important;
        --dsw-alias-border-l1: rgba(255, 255, 255, .09) !important;
        --dsw-alias-border-l2: rgba(255, 255, 255, .14) !important;
      }
      body[data-dsh-wallpaper="active"] {
        --dwp-active-surface: var(--dwp-surface);
        background: transparent !important;
      }
      body[data-dsh-wallpaper="active"] #root {
        background: transparent !important;
      }
      body[data-dsh-theme="active"] {
        --dsw-alias-brand-primary: var(--dwp-accent) !important;
        --dsw-alias-brand-text: var(--dwp-accent) !important;
        --dsw-alias-button-primary-fill: var(--dwp-button) !important;
        --dsw-alias-button-primary-hover: var(--dwp-button-hover) !important;
        --dsw-alias-button-info-fill: var(--dwp-button) !important;
        --dsw-alias-button-info-hover: var(--dwp-button-hover) !important;
        --dsw-alias-label-primary-inverted: var(--dwp-button-text) !important;
        --dsw-alias-label-primary-foreground: var(--dwp-button-text) !important;
        --dsw-alias-state-business-primary: var(--dwp-accent) !important;
        --dsw-alias-state-business-tertiary: color-mix(in srgb, var(--dwp-accent) 18%, transparent) !important;
        --dsw-font-family: var(--dwp-font-family) !important;
        --dsw-font-xl-24: 600 calc(24px * var(--dwp-font-scale))/calc(32px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-l-20: 500 calc(20px * var(--dwp-font-scale))/calc(28px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-m-18: 500 calc(16px * var(--dwp-font-scale))/calc(28px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-base-16: calc(16px * var(--dwp-font-scale))/calc(24px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-base-strong-16: 500 calc(16px * var(--dwp-font-scale))/calc(24px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-s-14: calc(14px * var(--dwp-font-scale))/calc(22px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-s-strong-14: 500 calc(14px * var(--dwp-font-scale))/calc(22px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-xs-13: calc(13px * var(--dwp-font-scale))/calc(20px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-xs-strong-13: 500 calc(13px * var(--dwp-font-scale))/calc(20px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-xxs-12: calc(12px * var(--dwp-font-scale))/calc(18px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-xxs-strong-12: 500 calc(12px * var(--dwp-font-scale))/calc(18px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-xxxs-11: calc(11px * var(--dwp-font-scale))/calc(14px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-xxxs-strong-11: 500 calc(11px * var(--dwp-font-scale))/calc(14px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-markdown-h1: 700 calc(24px * var(--dwp-font-scale))/calc(34px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-markdown-h2: 700 calc(22px * var(--dwp-font-scale))/calc(32px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-markdown-h3: 700 calc(20px * var(--dwp-font-scale))/calc(30px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-markdown-h4: 600 calc(16px * var(--dwp-font-scale))/calc(28px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-markdown-base: calc(16px * var(--dwp-font-scale))/calc(28px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        --dsw-font-markdown-small: calc(14px * var(--dwp-font-scale))/calc(24px * var(--dwp-font-scale)) var(--dwp-font-family) !important;
        accent-color: var(--dwp-accent);
      }
      body[data-dsh-theme="active"][data-dwp-button-style="rounded"] #root button { border-radius: 12px !important; }
      body[data-dsh-theme="active"][data-dwp-button-style="pill"] #root button { border-radius: 999px !important; }
      body[data-dsh-theme="active"][data-dwp-button-style="square"] #root button { border-radius: 4px !important; }
      body[data-dsh-theme="active"][data-dwp-button-style="glass"] #root button {
        border-radius: 14px !important;
        border-color: color-mix(in srgb, var(--dwp-accent) 28%, rgba(255,255,255,.14)) !important;
        box-shadow: inset 0 1px rgba(255,255,255,.12), 0 7px 20px rgba(0,0,0,.12);
        backdrop-filter: blur(14px) saturate(1.25);
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
      .theme-presets { display: grid; grid-template-columns: repeat(5, 1fr); gap: 7px; }
      .theme-preset {
        display: grid;
        place-items: end center;
        height: 50px;
        padding: 6px 3px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 11px;
        color: #fff;
        background:
          radial-gradient(circle at 72% 25%, var(--accent) 0 13%, transparent 14%),
          linear-gradient(145deg, var(--base), color-mix(in srgb, var(--base) 62%, var(--accent)));
        box-shadow: inset 0 1px rgba(255,255,255,.08);
        cursor: pointer;
        font-size: 10px;
        text-shadow: 0 1px 4px #000;
      }
      .theme-preset[aria-pressed="true"] { outline: 2px solid var(--accent); outline-offset: -2px; }
      .color-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
      .color-field { display: grid; gap: 5px; color: #aebbd1; font-size: 11px; }
      input[type="color"] {
        width: 100%;
        height: 34px;
        padding: 3px;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 9px;
        background: rgba(255,255,255,.055);
        cursor: pointer;
      }
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
      .control-row select { width: 132px; }
      .resource-links { display: flex; flex-wrap: wrap; gap: 7px; }
      .resource-links a, .resource-links button {
        appearance: none;
        font: inherit;
        color: #bfe9ff;
        text-decoration: none;
        border: 1px solid rgba(125,211,252,.18);
        border-radius: 999px;
        padding: 5px 9px;
        background: rgba(56,189,248,.07);
        cursor: pointer;
      }
      .resource-links a:hover, .resource-links button:hover { background: rgba(56,189,248,.14); }
      .hint code { color: #c8f1ff; }
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
        <button class="launcher" type="button" aria-label="打开壁纸与主题中心" aria-expanded="false">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9a2.5 2.5 0 0 1-2.5 2.5H13v2h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2H6.5A2.5 2.5 0 0 1 4 14.5v-9Z" stroke="currentColor" stroke-width="1.7"/><path d="m7 12 2.2-2.2a1 1 0 0 1 1.4 0l1.3 1.3 2.4-3a1 1 0 0 1 1.5-.08L18 10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <section class="panel" hidden aria-label="壁纸与主题中心">
          <header class="header">
            <h2>壁纸与主题中心</h2>
            <button class="icon-button close" type="button" aria-label="关闭">✕</button>
          </header>

          <label class="switch-row">
            <span>启用当前壁纸</span>
            <input class="enabled" type="checkbox">
          </label>

          <h3>页面主题</h3>
          <label class="switch-row">
            <span>启用主题外观</span>
            <input class="theme-enabled" type="checkbox">
          </label>
          <div class="theme-presets" aria-label="主题预设">
            <button class="theme-preset" type="button" data-theme-preset="ocean" style="--base:#071326;--accent:#64e0c8">深海</button>
            <button class="theme-preset" type="button" data-theme-preset="violet" style="--base:#160c2e;--accent:#a78bfa">紫晶</button>
            <button class="theme-preset" type="button" data-theme-preset="forest" style="--base:#071d18;--accent:#5ee0a0">森林</button>
            <button class="theme-preset" type="button" data-theme-preset="sunset" style="--base:#2a1118;--accent:#fb7185">落日</button>
            <button class="theme-preset" type="button" data-theme-preset="graphite" style="--base:#12151b;--accent:#8ea4c8">石墨</button>
          </div>
          <div class="color-grid">
            <label class="color-field"><span>主题底色</span><input class="theme-color" type="color" aria-label="主题底色"></label>
            <label class="color-field"><span>强调色</span><input class="accent-color" type="color" aria-label="强调色"></label>
            <label class="color-field"><span>按钮色</span><input class="button-color" type="color" aria-label="按钮颜色"></label>
          </div>
          <label class="control-row"><span>按钮形态</span><select class="button-style"><option value="native">DSH 原生</option><option value="rounded">圆角</option><option value="pill">胶囊</option><option value="square">直角</option><option value="glass">玻璃</option></select></label>
          <label class="control-row"><span>字体风格</span><select class="font-style"><option value="system">系统无衬线</option><option value="rounded">圆体</option><option value="serif">衬线</option><option value="mono">等宽</option></select></label>
          <label class="range">
            <span class="range-head"><span>基础字号</span><output class="font-scale-value"></output></span>
            <input class="font-scale" type="range" min="0.9" max="1.15" step="0.05">
          </label>
          <p class="hint">主题设置独立于壁纸，可单独关闭；“恢复默认”会撤销全部外观覆盖。</p>

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
          <p class="hint">视频/图片需要“直接打开就是文件”的 HTTP(S) 直链，不要粘贴素材详情页。最稳妥的方式是下载后使用下方“本地文件”。</p>

          <h3>ShaderToy</h3>
          <div class="source-row">
            <input class="shader-id" type="text" placeholder="Shader ID 或官方链接" aria-label="ShaderToy ID 或链接">
            <button class="secondary open-shader" type="button">1. 打开</button>
            <button class="primary capture-shader" type="button">2. 捕获</button>
          </div>
          <p class="hint">作品地址形如 <code>shadertoy.com/view/XXcyRn</code>；<code>/view/</code> 后面的 <code>XXcyRn</code> 就是 ID。可粘贴完整链接，无需手动截取。</p>
          <div class="resource-links">
            <button class="shader-example" type="button">打开示例 XXcyRn</button>
            <a href="https://www.shadertoy.com/view/XXcyRn" target="_blank" rel="noopener noreferrer">查看示例页面</a>
          </div>
          <p class="hint">先打开官方播放器，再返回 DSH 点击“2. 捕获”，并在共享选择器中选中刚打开的 ShaderToy 标签页。浏览器要求这两次操作分别由你确认；刷新或重启后需要重新捕获。</p>

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

          <h3>下载壁纸素材</h3>
          <div class="resource-links">
            <a href="https://www.pexels.com/search/videos/animated%20wallpaper/" target="_blank" rel="noopener noreferrer">Pexels 动态视频</a>
            <a href="https://pixabay.com/videos/search/animated%20background/" target="_blank" rel="noopener noreferrer">Pixabay 动态视频</a>
          </div>
          <p class="hint">推荐流程：打开素材页 → 下载 MP4/WebM → 点击上方“选择视频、GIF 或图片”。不要把素材详情页地址填入视频 URL。</p>

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
        currentMedia?.__dwpDispose?.()
        currentMedia = undefined
        content.replaceChildren()
      }

      function makePreset(id) {
        const scene = makeElement('div', `dwp-scene dwp-preset-${id}`)
        if (id === 'aurora') scene.append(makeElement('span'), makeElement('span'))
        return scene
      }

      function makeShaderCapture(source) {
        const video = makeElement('video')
        const track = source.stream.getVideoTracks()[0]
        video.srcObject = source.stream
        video.autoplay = true
        video.muted = true
        video.playsInline = true

        const onEnded = () => {
          if (currentMedia !== video) return
          state = { ...state, enabled: false, source: { ...DEFAULT_SOURCE } }
          commit({ rerender: true })
          showStatus('ShaderToy 标签页捕获已停止；需要重新选择页面。', 'error')
        }
        track?.addEventListener('ended', onEnded, { once: true })
        video.__dwpDispose = () => {
          track?.removeEventListener('ended', onEnded)
          video.pause()
          video.srcObject = null
          for (const streamTrack of source.stream.getTracks()) streamTrack.stop()
        }
        return video
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
        } else if (source.type === 'shader-capture') {
          media = makeShaderCapture(source)
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
          if (state.source.type !== 'shader-capture') currentMedia.playbackRate = state.speed
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
        const appearance = state.themeEnabled ? state : DEFAULT_STATE
        const rootStyle = document.documentElement.style
        const themeRgb = hexToRgb(appearance.themeColor).join(', ')
        const layerOneRgb = hexToRgb(shadeHex(appearance.themeColor, 0.07)).join(', ')
        const layerTwoRgb = hexToRgb(shadeHex(appearance.themeColor, 0.14)).join(', ')
        layer.hidden = !state.enabled
        document.body.dataset.dshWallpaper = state.enabled ? 'active' : 'inactive'
        document.body.dataset.dshTheme = state.themeEnabled ? 'active' : 'inactive'
        document.body.dataset.dwpButtonStyle = state.themeEnabled ? state.buttonStyle : 'native'
        rootStyle.setProperty('--dwp-surface', String(state.surface))
        rootStyle.setProperty('--dwp-theme-rgb', themeRgb)
        rootStyle.setProperty('--dwp-theme-layer-1-rgb', layerOneRgb)
        rootStyle.setProperty('--dwp-theme-layer-2-rgb', layerTwoRgb)
        rootStyle.setProperty('--dwp-accent', appearance.accentColor)
        rootStyle.setProperty('--dwp-button', appearance.buttonColor)
        rootStyle.setProperty('--dwp-button-hover', shadeHex(appearance.buttonColor, 0.14))
        rootStyle.setProperty('--dwp-button-text', contrastText(appearance.buttonColor))
        rootStyle.setProperty('--dwp-font-family', FONT_STACKS[appearance.fontStyle])
        rootStyle.setProperty('--dwp-font-scale', String(appearance.fontScale))
        scrim.style.opacity = String(state.dim)
        content.style.filter = state.blur > 0 ? `blur(${state.blur}px)` : ''
        content.style.transform = state.blur > 0 ? `scale(${1 + state.blur / 500})` : ''
        syncPlayback()
      }

      function refreshPanel() {
        $('.enabled').checked = state.enabled
        $('.theme-enabled').checked = state.themeEnabled
        $('.theme-color').value = state.themeColor
        $('.accent-color').value = state.accentColor
        $('.button-color').value = state.buttonColor
        $('.button-style').value = state.buttonStyle
        $('.font-style').value = state.fontStyle
        $('.font-scale').value = String(state.fontScale)
        $('.dim').value = String(state.dim)
        $('.blur').value = String(state.blur)
        $('.surface').value = String(state.surface)
        $('.speed').value = String(state.speed)
        $('.respect-motion').checked = state.respectMotion
        $('.dim-value').textContent = `${Math.round(state.dim * 100)}%`
        $('.blur-value').textContent = `${Math.round(state.blur)}px`
        $('.surface-value').textContent = `${Math.round(state.surface * 100)}%`
        $('.font-scale-value').textContent = `${Math.round(state.fontScale * 100)}%`
        for (const button of shadow.querySelectorAll('[data-preset]')) {
          button.setAttribute('aria-pressed', String(state.source.type === 'preset' && state.source.id === button.dataset.preset))
        }
        for (const button of shadow.querySelectorAll('[data-theme-preset]')) {
          button.setAttribute('aria-pressed', String(state.themePreset === button.dataset.themePreset))
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

      function shaderPlayerUrl(id) {
        return `https://www.shadertoy.com/embed/${encodeURIComponent(id)}?gui=false&t=10&paused=false&muted=true`
      }

      function openShaderPlayer(id) {
        window.open(shaderPlayerUrl(id), '_blank', 'noopener,noreferrer')
        showStatus(`已打开 ShaderToy ${id}；请返回 DSH，再点击“2. 捕获”。`)
      }

      function startShaderCapture(id) {
        if (typeof navigator.mediaDevices?.getDisplayMedia !== 'function') {
          showStatus('当前浏览器不支持页面捕获，请使用最新版 Chrome、Edge 或 Safari。', 'error')
          return
        }

        showStatus(`请选择已打开的 ShaderToy ${id} 标签页。`)

        void navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'browser' },
          audio: false,
          preferCurrentTab: false,
          selfBrowserSurface: 'exclude',
          surfaceSwitching: 'include',
        }).then(stream => {
          if (stream.getVideoTracks().length === 0) {
            for (const track of stream.getTracks()) track.stop()
            showStatus('没有取得可用的视频画面，请重新选择 ShaderToy 标签页。', 'error')
            return
          }
          setSource(
            { type: 'shader-capture', id, stream },
            `正在使用 ShaderToy ${id} 的真实标签页画面；停止共享后壁纸会自动关闭。`,
          )
        }).catch(error => {
          if (error?.name === 'NotAllowedError') {
            showStatus('未开始捕获：请允许屏幕录制，并在选择器中选择 ShaderToy 标签页。', 'error')
          } else if (error?.name === 'NotReadableError') {
            showStatus('系统无法读取所选页面；请检查浏览器的屏幕录制权限。', 'error')
          } else if (error?.name === 'InvalidStateError') {
            showStatus('捕获需要由当前 DSH 页面发起；请返回并聚焦 DSH 后重新点击“2. 捕获”。', 'error')
          } else {
            showStatus('ShaderToy 页面捕获失败，请重新点击并选择对应标签页。', 'error')
          }
        })
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
        if (!event.currentTarget.checked && state.source.type === 'shader-capture') {
          state = { ...state, enabled: false, source: { ...DEFAULT_SOURCE } }
          commit({ rerender: true })
          showStatus('ShaderToy 标签页捕获已停止。')
          return
        }
        state = { ...state, enabled: event.currentTarget.checked }
        commit()
        showStatus(state.enabled ? '壁纸已启用。' : '壁纸已暂停显示。')
      })
      $('.theme-enabled').addEventListener('change', event => {
        state = { ...state, themeEnabled: event.currentTarget.checked }
        commit()
        showStatus(state.themeEnabled ? '页面主题已启用。' : '页面主题已关闭，已恢复 DSH 原生外观。')
      })
      for (const button of shadow.querySelectorAll('[data-theme-preset]')) {
        button.addEventListener('click', () => {
          const id = button.dataset.themePreset
          const preset = THEME_PRESETS[id]
          state = {
            ...state,
            themeEnabled: true,
            themePreset: id,
            themeColor: preset.base,
            accentColor: preset.accent,
            buttonColor: preset.button,
          }
          commit()
          showStatus(`已应用“${button.textContent.trim()}”页面主题。`)
        })
      }
      for (const key of ['themeColor', 'accentColor', 'buttonColor']) {
        const control = $(`.${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`)
        control.addEventListener('input', event => {
          state = { ...state, themeEnabled: true, themePreset: 'custom', [key]: event.currentTarget.value }
          commit()
        })
      }
      $('.button-style').addEventListener('change', event => {
        state = { ...state, themeEnabled: true, buttonStyle: event.currentTarget.value }
        commit()
      })
      $('.font-style').addEventListener('change', event => {
        state = { ...state, themeEnabled: true, fontStyle: event.currentTarget.value }
        commit()
      })
      $('.font-scale').addEventListener('input', event => {
        state = { ...state, themeEnabled: true, fontScale: Number(event.currentTarget.value) }
        commit()
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
      $('.open-shader').addEventListener('click', () => {
        const id = parseShaderId($('.shader-id').value)
        if (id === undefined) {
          showStatus('请输入有效的 ShaderToy ID 或官方链接。', 'error')
          return
        }
        openShaderPlayer(id)
      })
      $('.capture-shader').addEventListener('click', () => {
        const id = parseShaderId($('.shader-id').value)
        if (id === undefined) {
          showStatus('请输入有效的 ShaderToy ID 或官方链接。', 'error')
          return
        }
        startShaderCapture(id)
      })
      $('.shader-example').addEventListener('click', () => {
        const id = 'XXcyRn'
        $('.shader-id').value = id
        openShaderPlayer(id)
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
        commit()
      })
      $('.reset').addEventListener('click', () => {
        state = normalizeState(DEFAULT_STATE)
        $('.remote-url').value = ''
        $('.shader-id').value = ''
        commit({ rerender: true })
        showStatus('已恢复默认设置。')
      })

      const onVisibilityChange = () => syncPlayback()
      const onReducedMotionChange = () => syncPlayback()
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
          clearContent()
          layer.remove()
          controls.remove()
          globalStyle.remove()
          delete document.body.dataset.dshWallpaper
          delete document.body.dataset.dshTheme
          delete document.body.dataset.dwpButtonStyle
          for (const property of [
            '--dwp-surface',
            '--dwp-theme-rgb',
            '--dwp-theme-layer-1-rgb',
            '--dwp-theme-layer-2-rgb',
            '--dwp-accent',
            '--dwp-button',
            '--dwp-button-hover',
            '--dwp-button-text',
            '--dwp-font-family',
            '--dwp-font-scale',
          ]) document.documentElement.style.removeProperty(property)
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
    exports.contrastText = contrastText
    exports.parseRemoteUrl = parseRemoteUrl
    exports.parseShaderId = parseShaderId
    return module.exports
  },
})
