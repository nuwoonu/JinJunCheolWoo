// [woo] PM2 ecosystem
// start-expo-tunnel.sh 가 cloudflared 띄우고 그 URL 을 환경변수로 expo Metro 실행
module.exports = {
  apps: [
    {
      name: "schoolmate-expo",
      cwd: "/root/JinJunCheolWoo/schoolmate_app",
      script: "/root/JinJunCheolWoo/schoolmate_app/start-expo-tunnel.sh",
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      out_file: "/var/log/schoolmate-expo.out.log",
      error_file: "/var/log/schoolmate-expo.err.log",
      time: true,
      kill_timeout: 5000
    }
  ]
};
