# FunBits 官网

FunBits 游戏与 App 展示网站，使用 HTML 和 CSS，无需构建。

## 页面

- `index.html`：首页与产品分类。
- `games.html`：游戏展示。
- `apps.html`：App 展示。
- `funbits-assets/`：样式与站点图标。

产品卡片中的名称与介绍为展示样例。

## 本地预览

直接打开 `index.html`，或在仓库目录运行：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

访问 http://127.0.0.1:8765/。

## GitHub Pages

在仓库 Settings → Pages 中，将 Source 设为 Deploy from a branch，选择 `develop` 分支和 `/(root)` 目录后保存。`.nojekyll` 使页面按静态文件发布。

默认访问地址：https://mokanus.github.io/site/

修改页面后提交并推送到 `develop`，GitHub Pages 会自动更新网站。
