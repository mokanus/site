# 官网更新与部署流程

官网有两个发布目标，互不影响：

| 目标 | 地址 | 怎么更新 |
| --- | --- | --- |
| GitHub Pages | `https://mokanus.github.io/site/` | 合并到 `develop` 后自动发布 |
| 自有服务器（主站） | `https://www.funbits.cn/` | **手动**执行 `scripts/deploy-funbits.sh deploy` |

GitHub Pages 的自动发布管不到 funbits.cn 那台服务器。App Store 里填的隐私政策、用户协议地址在 www.funbits.cn 上，所以每次官网合并了改动，都要按下面的流程再部署一次。

## 一次更新的完整流程

1. 在功能分支上改页面，本地用 `python3 -m http.server 8765` 预览。改了 `site.css` / `site.js` 的话，记得把所有页面里的 `?v=` 版本号加一。
2. 提 PR 合并到 `develop`，GitHub Pages 会自动更新。
3. 在本地切到最新的 `develop`，部署到 funbits.cn：

   ```sh
   git switch develop && git pull
   scripts/deploy-funbits.sh deploy --dry-run   # 先看要上传哪些文件、线上是哪个 release
   scripts/deploy-funbits.sh deploy
   ```

4. 看脚本最后的逐页校验结果。全部 ✓ 就完成了；有 ✗ 就看下面的「排查与回滚」。

## 第一次使用前的准备

复制配置模板，填上服务器登录用户、IP 和 SSH 密钥（和长沙麻将共用同一台 ECS，用的是 `~/.ssh/mahjong_deploy`）：

```sh
cp scripts/deploy.env.example scripts/deploy.env
```

`scripts/deploy.env` 已加进 `.gitignore`。这个仓库是公开的，服务器 IP 和密钥路径不要写进任何会提交的文件。

## 服务器结构

- 每次发布是一个独立目录：`/var/www/funbits/releases/<时间戳>`（格式 `YYYYMMDD-HHMMSS`），里面的 `REVISION` 记录了对应的提交。旧目录不删，回滚就是切回旧目录。
- www.funbits.cn 的 nginx 配置是 `/etc/nginx/conf.d/8bit-portal.conf`，官网和 3000 端口的 Next.js NES 游戏大厅共用这个域名：
  - 走官网目录：`/`、`/apps/`、`/assets/`、`/games/artofwar/`、`/favicon.ico`、`/site.webmanifest`
  - 旧链接 `games.html`、`apps.html` 301 跳回首页
  - 其余路径（包括 `/games`、`/games/<slug>`、`/guide`）都转给 NES 大厅
- 长沙麻将在 `mahjong.funbits.cn` 和 IP 直连上，不在这个配置文件里，部署官网不会碰到它。

## 脚本做了什么

`scripts/deploy-funbits.sh deploy` 按顺序执行：

1. **检查**：工作区必须干净，HEAD 必须等于 `origin/develop`（要发别的提交，设 `ALLOW_ANY_REF=1`）。
2. **打包**：用 `git archive` 导出 HEAD，去掉 `README.md`、`docs/`、`scripts/` 等只属于仓库的文件，写入 `REVISION`。
3. **上传**：传到新目录 `/var/www/funbits/releases/<时间戳>`，此时线上还没变。
4. **切换路径**：从 nginx 配置里读出当前在用的 release 时间戳（必须只有一个，否则停下让人检查），备份配置为 `8bit-portal.conf.bak-site-<时间戳>`，把配置里的旧时间戳全部换成新时间戳。
5. **nginx -t 后 reload**：`nginx -t` 不通过就自动还原配置并退出，线上不受影响；通过了才 reload。
6. **逐页校验**：仓库里每个 `.html` 页面，加上 `site.css`、`site.js`、`favicon.ico`、`site.webmanifest`，都要求返回 200 且内容和本地逐字节一致；同时确认 `/games` 仍是 200（NES 大厅没被挡住）、`games.html` / `apps.html` 仍是 301。

其他命令：

```sh
scripts/deploy-funbits.sh status            # 线上在用哪个 release、服务器上有哪些 release 和配置备份
scripts/deploy-funbits.sh verify            # 只做第 6 步的线上校验
scripts/deploy-funbits.sh rollback          # 切回上一个 release
scripts/deploy-funbits.sh rollback 20261024-162000   # 切回指定 release
```

## 排查与回滚

- **校验有 ✗ 且确认是新版的问题**：`scripts/deploy-funbits.sh rollback`。回滚同样会备份配置、跑 `nginx -t` 再 reload，几秒内生效。
- **配置本身改坏了**：登录服务器，把最近的备份拷回去再 reload：

  ```sh
  ls -t /etc/nginx/conf.d/8bit-portal.conf.bak*          # 找最近的备份
  cp -p /etc/nginx/conf.d/8bit-portal.conf.bak-site-<时间戳> /etc/nginx/conf.d/8bit-portal.conf
  nginx -t && systemctl reload nginx
  ```

  2026-10-24 第一次接入官网之前的原始配置备份是 `8bit-portal.conf.bak-site-20261024`。
- **某页显示「内容不一致」但返回 200**：通常是这个路径被 NES 大厅接走了，见下一节。
- **想清理旧 release**：脚本不会自动删除。确认不再需要回滚后，在服务器上手动删除最早的几个 `releases/<时间戳>` 目录，至少保留线上在用的和它前一个。

## 新增页面时要注意

nginx 只把上面列出的几个路径交给官网。在已有目录下加页面（比如 `apps/<新产品>/`）不需要改配置，部署后直接生效。

如果新增了**新的顶层路径**，或者**新的游戏目录** `games/<新游戏>/`，需要先在 `8bit-portal.conf` 里给它加一段指向官网目录的 `location`，否则请求会落到 NES 大厅（`/games/<slug>` 本来就是 NES 大厅的路由）。加之前先确认 NES 大厅在这个路径上返回 404，不要抢掉它已有的页面。改完同样先备份、`nginx -t` 再 reload。这种情况下逐页校验会报「内容不一致」或非 200，可以当作提醒。
