# 咕噜公社官网

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

页面里的 `site.css?v=6`、`site.js?v=4` 是版本号，改了样式或脚本后把所有页面里的版本号加一，访客就会拿到新文件。

## 图片来源

产品截图来自各产品仓库里的交互原型（咕噜账本 `index.html`、糖光 `prototype.html`），鹈鹕壁纸的截图是 Mac 上实拍的 App Store 截图（2880×1800）缩到 1600 宽的 webp，图标来自 pelican-wallpaper 仓库的 `packaging/Assets.xcassets`；战争艺术的画面、头像和单位图标来自 ArtOfWar 仓库的 `godot/docs/design` 与 `art/` 目录。

## 品牌形象

Logo 和网站图标来自咕噜品牌素材包（规范见 [assets/img/brand/BRAND.md](assets/img/brand/BRAND.md)，SVG 源文件也在 `assets/img/brand/`）：

- `assets/img/mark.svg`：主标，端坐的咕噜，用于顶栏和页脚（48px 左右及以上）
- `assets/img/mark-small.svg`、`favicon-32.png`、`favicon.ico`：小头像，32px 以下只留头
- `apple-touch-icon.png`、`icon-192.png`、`icon-512.png`：米白主题的探头图标 `app-icon-ivory.svg`；`icon-maskable-512.png` 是主标居中放在米白底上，适配安卓圆形遮罩
- 表情 `face-*.svg` 和姿态 `pose-*.svg` 用于插画位和空状态，同一屏最多出现一只咕噜。漫画里的“咕噜”是没有五官的声骸，和这只猫是两个角色，不要混用

## 牛皮纸视觉（2026-10 改版）

全站用牛皮纸 + 毛毡剪纸风：底色是牛皮纸（`--kraft`），内容贴在米白卡纸上（`--paper`），强调色取自咕噜频道头像（青绿毛毡 `--felt`、橙、珊瑚、金）。纸纹是 `assets/img/kraft/grain.webp`，一张程序生成的无缝纤维纹理，用 `background-blend-mode:soft-light` 叠在任意底色上。

角色插画在 `assets/img/kraft/`，都是透明底的牛皮纸剪纸版（原图在分支 `claude/kraft-cutouts` 的 `assets/img/kraft/src/`）：

- 人形咕噜：`girl-stand`（首页首屏）、`girl-read`（产品页隐私承诺卡上）、`girl-wave`（备用）
- 小猫咕噜：`cat-sit`（首页关于区）、`cat-peek`（产品页功能卡、法律文档顶部探头）、`cat-sleep`（所有页面页脚上沿）

人形设定见 `assets/img/brand/character/CHARACTER.md`。全站只用牛皮纸这一种画风，同一屏最多一只猫。
