#!/usr/bin/env bash
# [woo] expo + cloudflare quick tunnel 시작 스크립트
# 1) cloudflared 로 8081 → 공인 HTTPS URL 발급
# 2) URL 추출해서 REACT_NATIVE_PACKAGER_HOSTNAME 으로 expo 실행
set -e

LOG=/var/log/schoolmate-cloudflared.log
URL_FILE=/tmp/schoolmate-tunnel-url

# 기존 cloudflared 정리
pkill -f "cloudflared tunnel --url http://localhost:8081" 2>/dev/null || true

# cloudflared 백그라운드 시작
nohup /usr/local/bin/cloudflared tunnel --no-autoupdate --url http://localhost:8081 > "$LOG" 2>&1 &

# trycloudflare URL 추출 (최대 60초 대기)
URL=""
for i in $(seq 1 60); do
  URL=$(grep -oE "https://[a-zA-Z0-9.-]+\.trycloudflare\.com" "$LOG" 2>/dev/null | head -1 || true)
  [ -n "$URL" ] && break
  sleep 1
done

if [ -z "$URL" ]; then
  echo "[FATAL] cloudflared URL 을 못 받았습니다" >&2
  cat "$LOG" >&2
  exit 1
fi

HOST=${URL#https://}
echo "$URL" > "$URL_FILE"
echo "[INFO] tunnel URL: $URL"
echo "[INFO] hostname:   $HOST"

# expo Metro 실행 (PM2가 이 프로세스를 관리)
export CI=1
export EXPO_NO_TELEMETRY=1
export NODE_ENV=development
export BROWSER=none
export REACT_NATIVE_PACKAGER_HOSTNAME="$HOST"
export EXPO_PACKAGER_PROXY_URL="$URL"
export EXPO_MANIFEST_PROXY_URL="$URL"

cd /root/JinJunCheolWoo/schoolmate_app
exec npx expo start --host lan --port 8081
