
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

실행시 API 데이터베이스는 자동 생성 ```settings.py``` 참조

- Library
```
about-time==4.2.1
absl-py==2.0.0
alive-progress==3.1.5
asgiref==3.7.2
astunparse==1.6.3
atomicwrites==1.4.1
attrs==23.2.0
cachetools==5.3.2
certifi==2025.1.31
charset-normalizer==3.3.2
cloudpickle==2.2.1
colorama==0.4.6
contourpy==1.0.7
cycler==0.12.1
Cython==3.0.5
decorator==5.1.1
Django==4.1.7
djangorestframework==3.14.0
dm-tree==0.1.8
easydict==1.10
exceptiongroup==1.2.1
fastdtw==0.3.4
filelock==3.13.1
flatbuffers==24.3.25
fonttools==4.44.1
fsspec==2023.10.0
gast==0.4.0
google-auth==2.23.4
google-auth-oauthlib==0.4.6
google-pasta==0.2.0
grapheme==0.6.0
grpcio==1.59.2
h5py==3.10.0
idna==3.4
importlib-metadata==6.8.0
importlib-resources==6.1.1
iniconfig==2.0.0
intel-openmp==2021.4.0
Jinja2==3.1.2
joblib==1.3.2
keras==2.10.0
Keras-Preprocessing==1.1.2
kiwisolver==1.4.5
libclang==16.0.6
llvmlite==0.41.1
mariadb==1.1.10
Markdown==3.5.1
MarkupSafe==2.1.3
matplotlib==3.6.3
mkl==2021.4.0
ml-dtypes==0.3.2
mpmath==1.3.0
multipledispatch==1.0.0
networkx==3.2.1
numba==0.58.1
numpy==1.23.5
nvidia-cublas-cu11==11.11.3.6
nvidia-cudnn-cu11==9.7.0.66
oauthlib==3.2.2
opt-einsum==3.3.0
packaging==23.2
pandas==1.5.3
patsy==0.5.6
Pillow==10.1.0
pip-licenses==5.0.0
plotly==5.22.0
pluggy==1.0.0
pmdarima==2.0.4
pmlb==1.0.1.post3
prettytable==3.16.0
protobuf==3.19.6
py==1.11.0
pyasn1==0.5.0
pyasn1-modules==0.3.0
PyMySQL==1.1.2
pyparsing==3.0.9
pytest==6.2.5
python-dateutil==2.8.2
pytorch-fid-wrapper==0.0.4
pyts==0.12.0
pytz==2024.1
PyYAML==6.0.1
requests==2.28.2
requests-oauthlib==1.3.1
rsa==4.9
scikit-learn==1.2.2
scipy==1.10.1
seaborn==0.12.2
shap==0.46.0
six==1.16.0
slicer==0.0.8
sqlparse==0.4.4
statsmodels==0.14.0
sympy==1.13.1
tbb==2021.13.0
tenacity==8.4.2
tensorboard==2.10.1
tensorboard-data-server==0.6.1
tensorboard-plugin-wit==1.8.1
tensorflow-estimator==2.10.0
tensorflow-gpu==2.10.0
tensorflow-intel==2.11.0
tensorflow-io-gcs-filesystem==0.31.0
tensorflow-probability==0.19.0
termcolor==2.3.0
threadpoolctl==3.2.0
toml==0.10.2
tomli==2.0.1
torch==2.1.0
torchaudio==2.6.0
torchvision==0.16.0+cu118
tqdm==4.66.4
typeguard==2.13.3
typing_extensions==4.12.2
tzdata==2024.1
urllib3==1.26.19
wcwidth==0.2.13
Werkzeug==3.0.3
wrapt==1.16.0
zipp==3.19.2
```

## Execution
- Django API
```
$ python manage.py runserver 0.0.0.0:8000 --noreload
  * 소스변경시 자동 적용
$ python manage.py runserver 0.0.0.0:8000 --settings=config.settings.deploy --noreload
```
