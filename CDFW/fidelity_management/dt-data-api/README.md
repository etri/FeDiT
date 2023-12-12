conda 가상화 생성
conda create --name dt-twin-api python=3.9

conda 가상화 실행
conda activate dt-twin-api

django 설치
pip install django==4.1.7
pip install djangorestframework==3.14.0
pip install mysqlclient==2.1.1
pip install pandas==1.5.3
pip install numpy==1.23.5
pip install multipledispatch
pip install matplotlib==3.7.2
pip install scikit-learn==1.2.2
pip install tensorflow-gpu==2.10.0
pip install pytorch-fid-wrapper==0.0.4
pip install pyts==0.12.0
pip install tqdm==4.65.0
pip install plotly==5.9.0
pip install statsmodels==0.14.0
pip install seaborn==0.12.2
pip install pmdarima

샐행
python manage.py runserver 0.0.0.0:8000 --noreload
python manage.py runserver 0.0.0.0:8000 --settings=config.settings.deploy --noreload

DB동기화
python manage.py makemigrations
python manage.py migrate