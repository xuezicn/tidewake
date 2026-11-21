#!/bin/zsh
cd "$(dirname "$0")" || exit 1
PORT=8765
BASE="http://127.0.0.1:${PORT}"
PIDFILE="/tmp/tidewake-safari-http.pid"
LOG="/tmp/tidewake-safari-http.log"

check() {
  /usr/bin/curl -fsS --max-time 1 "$BASE/index.html" >/dev/null 2>&1
}

if ! check; then
  nohup /usr/bin/python3 -m http.server "$PORT" --bind 127.0.0.1 >"$LOG" 2>&1 &
  echo $! > "$PIDFILE"
  for i in {1..30}; do
    check && break
    sleep 0.2
  done
fi

if ! check; then
  # 没有 Python 或端口不可用时，退回直接打开本机文件
  /usr/bin/open -a Safari "$PWD/index.html" 2>/dev/null || /usr/bin/open "$PWD/index.html"
  exit 0
fi

open -a Safari "$BASE/index.html?v=$(date +%s)#/home"
