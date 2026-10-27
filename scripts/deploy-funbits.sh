#!/usr/bin/env bash
# 把官网发布到 www.funbits.cn（阿里云 ECS），流程说明见 docs/DEPLOY.md。
#
#   scripts/deploy-funbits.sh deploy [--dry-run]   打包 HEAD，上传新 release，切 nginx，逐页校验
#   scripts/deploy-funbits.sh rollback [时间戳]     切回上一个（或指定的）release
#   scripts/deploy-funbits.sh status               查看线上在用的 release 和服务器上已有的 release
#   scripts/deploy-funbits.sh verify               只做线上逐页校验
#
# 服务器地址和 SSH 密钥放在 scripts/deploy.env（不进仓库），格式见 scripts/deploy.env.example。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/scripts/deploy.env"
[ -f "$ENV_FILE" ] && . "$ENV_FILE"

: "${DEPLOY_HOST:?请在 scripts/deploy.env 里设置 DEPLOY_HOST，例如 root@<服务器IP>}"
DEPLOY_SSH_KEY="${DEPLOY_SSH_KEY:-}"
SITE_URL="${SITE_URL:-https://www.funbits.cn}"
REMOTE_ROOT="${REMOTE_ROOT:-/var/www/funbits}"
NGINX_CONF="${NGINX_CONF:-/etc/nginx/conf.d/8bit-portal.conf}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-develop}"

# 只在仓库里、不属于站点的文件，不上传
EXCLUDES=(README.md docs scripts .gitignore .nojekyll assets/fonts/README.md)

SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10)
[ -n "$DEPLOY_SSH_KEY" ] && SSH_OPTS+=(-i "${DEPLOY_SSH_KEY/#\~/$HOME}" -o IdentitiesOnly=yes)

say()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m警告:\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m错误:\033[0m %s\n' "$*" >&2; exit 1; }
remote() { ssh "${SSH_OPTS[@]}" "$DEPLOY_HOST" "$@"; }
sha() { if command -v sha256sum >/dev/null; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi; }

# nginx 配置里引用的 release 时间戳，必须正好一个
current_release() {
  local found
  found="$(remote "grep -oE 'releases/[0-9]{8}-[0-9]{6}' '$NGINX_CONF' | sort -u | cut -d/ -f2")"
  [ -n "$found" ] || die "$NGINX_CONF 里没找到 $REMOTE_ROOT/releases/<时间戳> 路径，请先手动检查配置"
  [ "$(printf '%s\n' "$found" | wc -l | tr -d ' ')" = 1 ] || die "$NGINX_CONF 引用了多个 release：$(echo $found)，请先手动统一"
  printf '%s\n' "$found"
}

# 把 nginx 配置里的 release 从 $1 换成 $2：先备份，nginx -t 不过就还原
switch_release() {
  local from="$1" to="$2" bak="$NGINX_CONF.bak-site-$(date +%Y%m%d-%H%M%S)"
  say "切换 nginx：releases/$from → releases/$to（备份到 $bak）"
  remote bash -s -- "$NGINX_CONF" "$bak" "$from" "$to" "$REMOTE_ROOT" <<'REMOTE'
set -euo pipefail
conf="$1"; bak="$2"; from="$3"; to="$4"; root="$5"
[ -f "$root/releases/$to/index.html" ] || { echo "目标 release 不存在：$root/releases/$to" >&2; exit 1; }
cp -p "$conf" "$bak"
sed -i "s#releases/$from#releases/$to#g" "$conf"
if ! nginx -t; then
  cp -p "$bak" "$conf"
  echo "nginx -t 未通过，已还原配置，线上未变化" >&2
  exit 1
fi
systemctl reload nginx 2>/dev/null || nginx -s reload
REMOTE
}

# 逐页校验：仓库里每个 html 都要 200 且内容和本地一致；NES 大厅和旧链接跳转保持原样
verify() {
  local dir="$1" fail=0 tmp code url path
  tmp="$(mktemp)"
  say "逐页校验 $SITE_URL"
  while IFS= read -r path; do
    url="$SITE_URL/${path%index.html}"
    code="$(curl -sS -o "$tmp" -w '%{http_code}' "$url" || echo 000)"
    if [ "$code" != 200 ]; then
      echo "  ✗ $code  $url"; fail=1
    elif [ "$(sha "$tmp")" != "$(sha "$dir/$path")" ]; then
      echo "  ✗ 内容不一致  $url（可能被 NES 大厅接走了，见 docs/DEPLOY.md「新增页面」）"; fail=1
    else
      echo "  ✓ 200  $url"
    fi
  done < <(cd "$dir" && find . -name '*.html' | sed 's#^\./##' | sort; printf '%s\n' assets/site.css assets/site.js favicon.ico site.webmanifest)
  for pair in "/games 200" "/games.html 301" "/apps.html 301"; do
    url="$SITE_URL${pair% *}"
    code="$(curl -sS -o /dev/null -w '%{http_code}' "$url" || echo 000)"
    if [ "$code" = "${pair#* }" ]; then echo "  ✓ $code  $url"; else echo "  ✗ $code（应为 ${pair#* }）  $url"; fail=1; fi
  done
  rm -f "$tmp"
  return $fail
}

# 把 HEAD 导出成一份干净的站点目录
package() {
  local out="$1" ex
  git -C "$ROOT" archive --format=tar HEAD | tar -x -C "$out"
  for ex in "${EXCLUDES[@]}"; do rm -rf "${out:?}/$ex"; done
  git -C "$ROOT" log -1 --format='%H %cI %s' > "$out/REVISION"
}

cmd_deploy() {
  local dry=0
  [ "${1:-}" = "--dry-run" ] && dry=1

  cd "$ROOT"
  [ -z "$(git status --porcelain)" ] || die "工作区有未提交的改动，先提交或 stash"
  git fetch -q origin "$DEPLOY_BRANCH"
  if [ "$(git rev-parse HEAD)" != "$(git rev-parse "origin/$DEPLOY_BRANCH")" ]; then
    [ "${ALLOW_ANY_REF:-0}" = 1 ] || die "HEAD 不是 origin/$DEPLOY_BRANCH 的最新提交（要发其他提交请设 ALLOW_ANY_REF=1）"
    warn "发布的不是 origin/$DEPLOY_BRANCH 最新提交：$(git log -1 --oneline)"
  fi

  local ts cur
  WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
  package "$WORK"
  ts="$(date +%Y%m%d-%H%M%S)"
  cur="$(current_release)"
  say "要发布：$(git log -1 --oneline)，$(find "$WORK" -type f | wc -l | tr -d ' ') 个文件"
  say "线上 release：$cur  →  新 release：$ts"

  if [ $dry = 1 ]; then
    say "dry-run：不上传、不改配置。将上传的文件："
    (cd "$WORK" && find . -type f | sed 's#^\./#  #' | sort)
    return 0
  fi

  say "上传到 $REMOTE_ROOT/releases/$ts"
  tar -C "$WORK" -czf - . | remote "mkdir -p '$REMOTE_ROOT/releases/$ts' && tar -xzf - -C '$REMOTE_ROOT/releases/$ts' && chmod -R a+rX '$REMOTE_ROOT/releases/$ts'"

  switch_release "$cur" "$ts"

  if verify "$WORK"; then
    say "发布完成：$SITE_URL 现在是 $(git log -1 --format=%h) （release $ts）"
    say "回滚命令：scripts/deploy-funbits.sh rollback $cur"
  else
    warn "校验未全部通过。确认有问题就执行：scripts/deploy-funbits.sh rollback $cur"
    exit 1
  fi
}

cmd_rollback() {
  local cur target
  cur="$(current_release)"
  target="${1:-}"
  if [ -z "$target" ]; then
    target="$(remote "ls -1 '$REMOTE_ROOT/releases'" | grep -E '^[0-9]{8}-[0-9]{6}$' | sort | awk -v c="$cur" '$0 < c' | tail -1)"
    [ -n "$target" ] || die "找不到比 $cur 更早的 release"
  fi
  [ "$target" != "$cur" ] || die "线上已经是 $target"
  switch_release "$cur" "$target"
  say "已回滚到 $target（线上是 $(remote "cat '$REMOTE_ROOT/releases/$target/REVISION' 2>/dev/null || echo '该 release 没有 REVISION 记录'")）"
}

cmd_status() {
  local cur r
  cur="$(current_release)"
  say "nginx 配置：$NGINX_CONF"
  say "服务器上的 release（* 为线上在用）："
  for r in $(remote "ls -1 '$REMOTE_ROOT/releases'" | sort); do
    printf '  %s %s  %s\n' "$([ "$r" = "$cur" ] && echo '*' || echo ' ')" "$r" \
      "$(remote "cat '$REMOTE_ROOT/releases/$r/REVISION' 2>/dev/null | cut -c1-80" || true)"
  done
  say "配置备份："
  remote "ls -1t '$NGINX_CONF'.bak* 2>/dev/null | head -5 | sed 's/^/  /'" || true
}

cmd_verify() {
  WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
  package "$WORK"
  verify "$WORK"
}

case "${1:-}" in
  deploy)   shift; cmd_deploy "$@" ;;
  rollback) shift; cmd_rollback "$@" ;;
  status)   cmd_status ;;
  verify)   cmd_verify ;;
  *) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
