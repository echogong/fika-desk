#!/bin/sh
# 服务器上没有浏览器。Agent 登录时要“打开浏览器”，会运行这个脚本（登录时环境变量 BROWSER 指向它）：
# 把网址记下来交给 Fika Desk，页面上显示出来，你在自己的手机或电脑上打开。
fika_url_file=${FIKA_DESK_OPEN_URL_FILE:-${MULTIAGENT_OPEN_URL_FILE:-}}
if [ -n "$fika_url_file" ] && [ -n "$1" ]; then
  printf '%s\n' "$1" >> "$fika_url_file"
fi
exit 0
