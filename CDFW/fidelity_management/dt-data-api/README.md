
# Fidelity


## Installation
- Miniconda3 
```
$ mkdir -p ~/miniconda3
$ wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
$ bash ~/miniconda3/miniconda.sh -b -u –p ~/miniconda3
  * (base) [root@localhost /] : base 상태 확인
$ conda create —name dt-twin-api python=3.9
  * conda 가상화 생성
$ conda activate dt-twin-api
  * conda 가상화 실행
```

- Mariadb
```
- CentOS7

  * yum repo 소스 경로
  * https://mariadb.org/download/?t=repo-config&d=CentOS+7&v=10.5&r_m=blendbyte

  * 소스 파일을 생성하여 링크 URL 정보를 붙여넣기
$ vi /etc/yum.repos.d/mariadb.repo

$ sudo yum install MariaDB-server MariaDB-client
$ systemctl start mariadb
  * DB 실행
$ systemctl enable mariadb
  * 서버 재부팅시 자동실행 설정
$ mysqladmin -u root password
  * root 비밀번호 초기화

$ mysql -u root -p
$ create database dt_data_api;
  * DB 생성
$ create user '계정'@'%' identified by '비밀번호';
  * 계정 생성  
$ grant all privileges on dt_data_api.* to 계정@'%' identified by '비밀번호';  
  * 권한 부여
$ flush privileges;  
```

- Table Create Query
```
$ mysql --host=localhost --user=root --password dt_data_api < dt_data_api.sql
[dt_data_api.sql](./dt_data_api.sql)
```

- Django & Library
```
$ pip install django==4.1.7
$ pip install djangorestframework==3.14.0
$ pip install mysqlclient==2.1.1
$ pip install pandas==1.5.3
$ pip install numpy==1.23.5
$ pip install multipledispatch
$ pip install matplotlib==3.7.2
$ pip install scikit-learn==1.2.2
$ pip install tensorflow-gpu==2.10.0
$ pip install pytorch-fid-wrapper==0.0.4
$ pip install pyts==0.12.0
$ pip install tqdm==4.65.0
$ pip install plotly==5.9.0
$ pip install statsmodels==0.14.0
$ pip install seaborn==0.12.2
$ pip install pmdarima

* GPU 사용시 CUDA, NVIDIA Driver 설치

* django 동기화 (필요시)
$ python manage.py makemigrations
$ python manage.py migrate
```

## Execution
- Django API
```
$ python manage.py runserver 0.0.0.0:8000 --noreload
  * 소스변경시 자동 적용
$ python manage.py runserver 0.0.0.0:8000 --settings=config.settings.deploy --noreload
```
