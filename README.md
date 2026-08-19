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
dsh plugin --profile web add github:hinayoung23/dsh-live-wallpaper#v0.2.1
```

### 从 npm 安装

```sh
dsh plugin --profile web add dsh-live-wallpaper
```

### 素材使用方法

最简单、最稳定的方式是直接使用面板中的四款“内置动态”，它们不需要访问任何外部网站。

使用下载的视频：

1. 在插件面板的“下载壁纸素材”中打开 Pexels 或 Pixabay。
2. 在网站中选择作品并下载 MP4/WebM 文件，不要复制作品详情页地址。
3. 回到插件面板，在“本地文件”中点击“选择视频、GIF 或图片”。

使用 ShaderToy：

1. 可以先点击插件面板中的“直接试用示例 XXcyRn”。
2. 自己寻找作品时，打开 ShaderToy 的作品页面，地址形如 `https://www.shadertoy.com/view/XXcyRn`。
3. `/view/` 后面的 `XXcyRn` 就是 Shader ID；也可以把完整作品链接直接粘贴到插件中，无需手动提取。
4. 如果 ShaderToy 在当前网络无法访问或应用后画面空白，请使用内置动态壁纸，或下载视频后通过本地文件应用。

“视频 / 图片 URL”要求媒体直链，即在浏览器中打开后直接显示视频或图片；Pexels、Pixabay 等素材详情页不能作为媒体直链使用。

### 来源与安全

- ShaderToy 使用其官方 `shadertoy.com/embed/<id>` 页面。插件不会绕过访问控制，也不会下载 Shader 源码。
- 远程网页在不带 `allow-same-origin` 的 sandbox iframe 中运行；壁纸层默认不接收鼠标事件。
- 插件不会抓取、代理或绕过任何第三方壁纸市场的访问控制。
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
dsh plugin --profile web add github:hinayoung23/dsh-live-wallpaper#v0.2.1
```

### Install from npm

```sh
dsh plugin --profile web add dsh-live-wallpaper
```

### How to Use Wallpaper Sources

The easiest and most reliable option is to use one of the four Built-in Animation presets. They do not require access to any external website.

To use a downloaded video:

1. Open Pexels or Pixabay from the Download Wallpaper Media section in the plugin panel.
2. Choose a video and download its MP4/WebM file. Do not copy the asset detail page URL.
3. Return to the plugin panel and click Choose Video, GIF, or Image under Local File.

To use ShaderToy:

1. Start with the Try Example XXcyRn button in the plugin panel.
2. To use another shader, open its ShaderToy page. Its address will look like `https://www.shadertoy.com/view/XXcyRn`.
3. The value after `/view/`—`XXcyRn` in this example—is the Shader ID. You can also paste the complete page URL into the plugin without extracting the ID yourself.
4. If ShaderToy is unavailable on your network or the result is blank, use a built-in animation or download a video and apply it as a local file.

The Video / Image URL field requires a direct media URL—one that opens the video or image itself in a browser. Pexels and Pixabay asset detail pages are not direct media URLs.

### Sources and Security

- ShaderToy wallpapers use the official `shadertoy.com/embed/<id>` page. The plugin does not bypass access controls or download shader source code.
- Remote pages run inside a sandboxed iframe without `allow-same-origin`; the wallpaper layer does not receive pointer events by default.
- The plugin does not scrape, proxy, or bypass access controls for any third-party wallpaper marketplace.
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
