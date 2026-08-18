# DSH Live Wallpaper

为 DeepSeek Harness Web UI 提供动态壁纸与页面主题中心。插件完全运行在浏览器侧，不依赖 Steam、Wallpaper Engine、API Key 或额外 npm 依赖。

当前版本在 DeepSeek Harness `0.1.0-rc.7` 上完成验证。

## 功能

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

## 本地安装

```sh
dsh plugin --profile web add ./dsh-live-wallpaper
dsh --profile web --dump-config
dsh web
```

打开 DSH 后，点击右下角的圆形壁纸按钮。

## 从 GitHub 安装

```sh
dsh plugin --profile web add github:hinayoung23/dsh-live-wallpaper#v0.2.0
```

## 从 npm 安装

```sh
dsh plugin --profile web add dsh-live-wallpaper
```

## 来源与安全

- ShaderToy 使用其官方 `shadertoy.com/embed/<id>` 页面。插件不会绕过访问控制，也不会下载 Shader 源码。
- 远程网页在不带 `allow-same-origin` 的 sandbox iframe 中运行；壁纸层默认不接收鼠标事件。
- 插件不会抓取 DesktopHut、MoeWalls、Wallpaper Engine Workshop 或其他第三方市场。
- 使用第三方视频、图片或 Shader 前，请确认其授权允许你的使用方式。

## 已知限制

- 浏览器不能在刷新后重新取得本地文件权限，因此本地文件壁纸仅在当前页面生命周期内有效。
- 远程服务器可能禁止跨站嵌入或热链；这时请下载文件后通过“本地文件”使用。
- ShaderToy 的可用性受网络、浏览器 WebGL 能力和作品自身许可约束。

## 开发验证

```sh
pnpm check
pnpm pack
```

## License

MIT
