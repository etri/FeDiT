이 폴더에 Nginx HTTPS 인증서를 둡니다.

  server.crt : 서버 인증서 + 중간 체인 (PEM 형식)
  server.key : 개인키 (PEM 형식, 암호 없음)

자체 서명 인증서 생성
  deploy\00_generate_cert.ps1

공인 인증서를 쓰는 경우 위 두 파일 이름 그대로 덮어쓰면 됩니다.
개인키(server.key)는 외부에 노출되지 않도록 주의하세요.
