# 예측매니저 설치 매뉴얼

---

## 1. 데이터베이스 설치
- MariaDB를 설치합니다.
```bash
sudo apt update
sudo apt install mariadb-server
```

---

## 2. 데이터베이스 생성
- MariaDB 설치 후 다음 단계를 진행합니다.
```bash
sudo systemctl status mariadb # MariaDB 상태 확인
sudo systemctl start mariadb # MariaDB 시작
sudo mysql_secure_installation # 루트 계정 비밀번호 설정 (선택)
sudo mysql -u root -p # MariaDB 접속
```

### 2-1. 데이터베이스 설정
- MariaDB에서 데이터베이스와 사용자를 생성합니다.
```sql
CREATE DATABASE 데이터베이스이름; # 데이터베이스 생성
CREATE USER '유저이름'@'localhost' IDENTIFIED BY '유저비밀번호'; # 유저 생성
GRANT ALL PRIVILEGES ON 데이터베이스이름.* TO '유저이름'@'localhost' IDENTIFIED BY '유저비밀번호'; # 권한 부여
FLUSH PRIVILEGES; # 권한 저장
SHOW DATABASES; # 데이터베이스 확인
SELECT User, Host FROM mysql.user; # 유저 리스트 확인
```

---

## 3. 데이터베이스 설정
- Django의 `settings.py` 파일을 수정합니다.
```bash
vim settings.py # vim이 없으면 sudo apt-get install vim으로 설치
```

- `settings.py` 예시:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': '생성한데이터베이스이름',
        'USER': '유저이름',
        'PASSWORD': '유저비밀번호!',
        'HOST': 'localhost',
        'PORT': '3306', # 기본 포트
    }
}
```

## 4. 도커 설치
- 도커를 설치합니다.
```bash
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 도커 저장소 추가
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 패키지 목록 업데이트 및 도커 설치
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 도커 권한 설정
sudo usermod -aG docker $USER
newgrp docker

# 도커 설치 확인
docker ps
```

---

## 5. 데이터베이스 마이그레이션
- Django 프로젝트 디렉토리에서 실행합니다.
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 6. 서버 실행
- Django 서버를 실행합니다.
```bash
python manage.py runserver 0.0.0.0:8000
```

