from collections import namedtuple
from dt_data_api.common.enum import MD_TYPE, MD_LOSS, MD_OTMZ, MD_METRICS

#모델파라메터
model_parameters = [
    'model_type',   #모델유형
    'window_size',  #데이터 분할 수
    'batch_size',   #배치 수
    'units',        #뉴런 수
    'test_size',    #학습 비율
    'epochs',       #반복 학습 수
    'patience',     #epochs 동안 개선 가능한 수 (epochs 동안 개선이 없을시 학습 중단)
    'loss',         #손실유형
    'meterics',     #결과분석 유형
    'optimizer',    #성능옵션 
    'optimizer_lr', #성능옵션 lr
    'data_size',     #FID 평가 데이터 수    
    'n_estimator',     #생성할 트리의 개수(int, default=100)
    'min_samples_leaf',       #노드를 분할하기 위해 리프 노드가 가져야 할 최소한의 샘플 개수(int or float, default=1)
    'min_samples_split',      #노드를 분할하기 위해 필요한 최소한의 샘플 개수 (int or float, default=2)
    'max_features',            #노드를 분할할 때 고려할 특성의 무작위 하위 집합의 크기. 회귀: {“sqrt”, “log2”, None}, int or float, default=1.0 분류: {“sqrt”, “log2”, None}, int or float, default="sqrt"
    'max_depth',              #트리의 최대 깊이(int, default=None)
    'num_segments',
    'segment_len',
    ]
model_parameters_value = [MD_TYPE.LSTM, 10, 32, 16, 0.2, 100, 10, MD_LOSS.MSE, MD_METRICS.MAE, MD_OTMZ.ADAM, 0.0005, 100, 100, 1, 2, 1, None, 4, 8]
ModelParameters = namedtuple('ModelParameters', model_parameters, defaults=model_parameters_value)

#입력파라메터
input_parameters = [
    'filepath',     #생성모델 경로
    'filename',     #생성모델 파일명
    'output_cols',  #종속변수
    'feature_cols', #독립변수 (종속변수 데이터 생산에 영향)
    'is_indpds',    #독립변수 여부
    'output_size',  #예측수    
    'use_model_yn', #모델데이터 사용여부
    'real_time_yn', #실시간 사용 여부
    'output_file',  #출력파일  
    'target_start_date',
    'target_last_date',
    'resmpl_intvl_tp',
    'resmpl_intvl_value',
    'index_column',
    'trgt_col_list'
    ]
input_parameters_value = ['', '', [], [], False, 1, None, None, None, None, None, None, None, None, None]
InputParameters = namedtuple('InputParameters', input_parameters, defaults=input_parameters_value)