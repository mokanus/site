# 咕噜研习社官网

糖光、咕噜账本、鹈鹕壁纸、战争艺术的产品官网，纯 HTML/CSS/JS，无构建步骤，部署在自有服务器 https://www.funbits.cn 上。

## 页面

| 路径 | 内容 |
| --- | --- |
| `index.html` | 首页：APPs 与游戏两个分类 |
| `apps/tangguang/` | 糖光：产品页、`privacy.html` 隐私政策、`terms.html` 用户协议 |
| `apps/gulu/` | 咕噜账本：同上 |
| `apps/pelican/` | 鹈鹕壁纸（Mac）：同上 |
| `games/artofwar/` | 战争艺术：同上 |
| `assets/` | 样式 `site.css`、交互动效 `site.js`、字体与图片 |

提交 App Store 时可填写的地址（战争艺术把路径里的 `apps` 换成 `games`）：

- 隐私政策：`https://www.funbits.cn/apps/<产品>/privacy.html`
- 用户协议（自定义 EULA）：`https://www.funbits.cn/apps/<产品>/terms.html`
- 技术支持：`https://www.funbits.cn/apps/<产品>/#support`

## 本地预览

```sh
python3 -m http.server 8765
```

访问 http://127.0.0.1:8765/ 。

## 发布

官网只发布到 https://www.funbits.cn，不再使用 GitHub Pages。改动合并到 `develop` 后执行 `scripts/deploy-funbits.sh deploy` 上线，完整流程和回滚方法见 [docs/DEPLOY.md](docs/DEPLOY.md)。

## 缓存

页面里的 `site.css?v=3`、`site.js?v=3` 是版本号，改了样式或脚本后把所有页面里的版本号加一，访客就会拿到新文件。

## 图片来源

产品截图来自各产品仓库里的交互原型（咕噜账本 `index.html`、糖光 `prototype.html`），鹈鹕壁纸的截图是 Mac 上实拍的 App Store 截图（2880×1800）缩到 1600 宽的 webp，图标来自 pelican-wallpaper 仓库的 `packaging/Assets.xcassets`；战争艺术的画面、头像和单位图标来自 ArtOfWar 仓库的 `godot/docs/design` 与 `art/` 目录。
