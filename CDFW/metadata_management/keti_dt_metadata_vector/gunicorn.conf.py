# gunicorn.conf.py
wsgi_app = "app:app"  # 선택(권장): CMD에서 app:app 생략 가능
bind = "0.0.0.0:5000"
workers = 3  # 2*CPU + 1 권장치에서 시작
threads = 2
timeout = 120
graceful_timeout = 30
keepalive = 5
preload_app = True  # 모델 한 번만 로드 후 포크(테스트 권장)
max_requests = 1000
max_requests_jitter = 100
loglevel = "info"
accesslog = "-"
errorlog = "-"


def post_fork(server, worker):
    # 포크 후 워커마다 ES 재연결 (preload_app=True일 때 안전)
    try:
        from src.db.elastic import reconnect

        reconnect()
        server.log.info("ES client reconnected in worker %s", worker.pid)
    except Exception as e:
        server.log.error("Failed to reconnect ES in worker %s: %s", worker.pid, e)
