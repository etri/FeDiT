# 개요
csv 파일을 사용하여 LSTM-AE 정합성 검증 모듈을 학습하고, 학습된 모듈을 기반으로 데이터의 정합성(에러)를 추론하는 프로젝트이다.


# 사용방법
학습을 먼저 진행해서 학습 모델을 만들어야 추론이 가능함


## 학습
### 학습 데이터 준비
data 폴더에 train.csv 파일명으로 저장
```
"대여개수","대기개수","기온","강수량"
"2558","23289","24.000000 ","0.000000 "
"2354","23493","24.000000 ","0.000000 "
"1602","24245","24.000000 ","0.000000 "
"1041","24806","23.000000 ","0.000000 "
```
### 학습 명령어
```console
$ python main.py -m train
```

## 추론
### 추론 데이터 준비
data 폴더에 infer.csv 파일명으로 저장
```
"대여개수","대기개수","기온","강수량"
"2558","23289","24.000000 ","0.000000 "
"2354","23493","24.000000 ","0.000000 "
"1602","24245","24.000000 ","0.000000 "
"1041","24806","23.000000 ","0.000000 "
```
### 추론 명령어
```console
$ python main.py -m infer
    (생략)
에러: 0.002
```

## 옵션 보기
```console
$ python main.py -h
usage: main.py [-h] [-m {train,infer}] [-w WINDOW_SIZE] [-l LAYER_SIZE] [-p PATIENCE]

Auto LSTM-AE Script

options:
  -h, --help            show this help message and exit
  -m {train,infer}, --mode {train,infer}
                        Mode: train or infer
  -w WINDOW_SIZE, --window_size WINDOW_SIZE
                        Size of the window for the model
  -l LAYER_SIZE, --layer_size LAYER_SIZE
                        Number of layers in the model
  -p PATIENCE, --patience PATIENCE
                        Patience for EarlyStopping
```