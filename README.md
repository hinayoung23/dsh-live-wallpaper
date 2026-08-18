# DSH Live Wallpaper

[中文](#中文) | [English](#english)

## 中文

为 DeepSeek Harness Web UI 提供动态壁纸与页面主题中心。插件完全运行在浏览器侧，不依赖 Steam、Wallpaper Engine、API Key 或额外 npm 依赖。

当前版本在 DeepSeek Harness `0.1.0-rc.7` 上完成验证。

### 功能

- 四款离线程序化动态壁纸：极光、星云、落日流光、霓虹网格
- 通过 ShaderToy ID 或官方链接嵌入公开 Shader
- 应用 HTTP(S) 视频、图片或网页 URL
- 临时应用本地视频、GIF 和图片
- 调整背景暗度、模糊、界面遮罩透明度和视频速度
- 5 套页面主题预设，并可分别自定义主题底色、强调色和按钮颜色
- 圆角、胶囊、直角、玻璃和 DSH 原生共 5 种按钮形态
- 系统无衬线、圆体、衬线、等宽共 4 种字体风格，以及 90%–115% 字号缩放
- 壁纸与主题可独立开关；关闭主题或卸载插件后自动恢复 DSH 原生外观
- 页面隐藏、系统开启“减少动态效果”时自动暂停可暂停的动画
- 除本地文件外，配置保存在浏览器 localStorage 中

### 本地安装

```sh
dsh plugin --profile web add ./dsh-live-wallpaper
dsh --profile web --dump-config
dsh web
```

打开 DSH 后，点击右下角的圆形壁纸按钮。

### 从 GitHub 安装

```sh
dsh plugin --profile web add github:hinayoung23/dsh-live-wallpaper#v0.2.0
```

### 从 npm 安装

```sh
dsh plugin --profile web add dsh-live-wallpaper
```

### 来源与安全

- ShaderToy 使用其官方 `shadertoy.com/embed/<id>` 页面。插件不会绕过访问控制，也不会下载 Shader 源码。
- 远程网页在不带 `allow-same-origin` 的 sandbox iframe 中运行；壁纸层默认不接收鼠标事件。
- 插件不会抓取 DesktopHut、MoeWalls、Wallpaper Engine Workshop 或其他第三方市场。
- 使用第三方视频、图片或 Shader 前，请确认其授权允许你的使用方式。

### 已知限制

- 浏览器不能在刷新后重新取得本地文件权限，因此本地文件壁纸仅在当前页面生命周期内有效。
- 远程服务器可能禁止跨站嵌入或热链；这时请下载文件后通过“本地文件”使用。
- ShaderToy 的可用性受网络、浏览器 WebGL 能力和作品自身许可约束。

### 开发验证

```sh
pnpm check
pnpm pack
```

### 许可证

MIT

## English

DSH Live Wallpaper adds animated wallpapers and a page theme center to the DeepSeek Harness Web UI. It runs entirely in the browser and does not require Steam, Wallpaper Engine, an API key, or additional npm dependencies.

The current version has been verified with DeepSeek Harness `0.1.0-rc.7`.

### Features

- Four offline procedural animated wallpapers: Aurora, Nebula, Sunset Flow, and Neon Grid
- Embed public shaders using a ShaderToy ID or official ShaderToy URL
- Use HTTP(S) video, image, or web page URLs as wallpapers
- Temporarily apply local videos, GIFs, and images
- Adjust background dimming, blur, UI overlay opacity, and video playback speed
- Five page theme presets, with independent customization of the base, accent, and button colors
- Five button styles: rounded, pill, square, glass, and native DSH
- Four font styles—system sans-serif, rounded, serif, and monospace—with 90%–115% font scaling
- Enable wallpapers and themes independently; disabling the theme or uninstalling the plugin restores the native DSH appearance
- Automatically pause supported animations when the page is hidden or the system requests reduced motion
- Store configuration in browser `localStorage`, except for local files

### Local Installation

```sh
dsh plugin --profile web add ./dsh-live-wallpaper
dsh --profile web --dump-config
dsh web
```

After opening DSH, click the round wallpaper button in the lower-right corner.

### Install from GitHub

```sh
dsh plugin --profile web add github:hinayoung23/dsh-live-wallpaper#v0.2.0
```

### Install from npm

```sh
dsh plugin --profile web add dsh-live-wallpaper
```

### Sources and Security

- ShaderToy wallpapers use the official `shadertoy.com/embed/<id>` page. The plugin does not bypass access controls or download shader source code.
- Remote pages run inside a sandboxed iframe without `allow-same-origin`; the wallpaper layer does not receive pointer events by default.
- The plugin does not scrape DesktopHut, MoeWalls, the Wallpaper Engine Workshop, or other third-party marketplaces.
- Before using third-party videos, images, or shaders, confirm that their licenses permit your intended use.

### Known Limitations

- Browsers cannot recover local file permissions after a page reload, so local-file wallpapers remain available only for the current page lifecycle.
- Remote servers may block cross-origin embedding or hotlinking. In that case, download the file and use the Local File option.
- ShaderToy availability depends on the network connection, browser WebGL support, and the license of each shader.

### Development Verification

```sh
pnpm check
pnpm pack
```

### License

MIT
