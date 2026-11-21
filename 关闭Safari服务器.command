#!/bin/zsh
PIDFILE="/tmp/tidewake-safari-http.pid"
if [ -f "$PIDFILE" ]; then
  PID="$(cat "$PIDFILE")"
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" && echo "汐境回响本地服务器已停止"
  else
    echo "服务器进程已不在运行"
  fi
  rm -f "$PIDFILE"
else
  PIDS="$(/usr/sbin/lsof -tiTCP:8765 -sTCP:LISTEN 2>/dev/null)"
  if [ -n "$PIDS" ]; then
    kill $PIDS && echo "汐境回响本地服务器已停止"
  else
    echo "没有找到正在运行的服务器"
  fi
fi
sleep 0.5
