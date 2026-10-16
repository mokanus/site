# Liaotao Studio 官网

糖光、咕噜账本、战争艺术的产品官网，纯 HTML/CSS，无构建步骤，可直接由 GitHub Pages 托管。

## 页面

| 路径 | 内容 |
| --- | --- |
| `index.html` | 首页：APPs 与游戏两个分类 |
| `apps/tangguang/` | 糖光：产品页、`privacy.html` 隐私政策、`terms.html` 用户协议 |
| `apps/gulu/` | 咕噜账本：同上 |
| `games/artofwar/` | 战争艺术：同上 |
| `assets/` | 样式与图片 |

提交 App Store 时可填写的地址（以默认 Pages 地址为例）：

- 隐私政策：`https://mokanus.github.io/site/apps/<产品>/privacy.html`
- 用户协议（自定义 EULA）：`https://mokanus.github.io/site/apps/<产品>/terms.html`
- 技术支持：`https://mokanus.github.io/site/apps/<产品>/#support`

## 待填写

全站搜索 `待填写` 即可找到占位内容（页面上以黄色高亮显示），目前只有联系邮箱一处。

## 本地预览

```sh
python3 -m http.server 8765
```

访问 http://127.0.0.1:8765/ 。

## 发布

在仓库 Settings → Pages 中选择 Deploy from a branch，分支选 `develop`、目录选 `/(root)`。`.nojekyll` 让页面按原样发布。
