from enum import Enum

class MD_FILL_TYPE(Enum):
    '''
    결측값 채우기 유형
    '''
    MEAN = 0
    '''
    평균
    '''
    STD = 1
    '''
    표준편차
    '''
    VAR = 2
    '''
    분산
    '''
    COUNT = 3
    '''
    세기
    '''
    MEDIAN = 4
    '''
    중앙
    '''
    MIN = 5
    '''
    최소
    '''
    MAX = 6
    '''
    최대
    '''

class MD_FILL_METHOD(Enum):
    '''
    method 유형
    '''
    FFILL = 'ffill'
    '''
    앞값 채우기
    '''
    PAD = 'pad'
    '''
    앞값 채우기
    '''
    BFILL = 'bfill'
    '''
    뒷값 채우기
    '''
    BACKFILL = 'backfill'
    '''
    뒷값 채우기
    '''

class MD_IP_METHOD(Enum):
    '''
    선형 보간법 method 유형
    '''
    LINEAR = 'linear'
    TIME = 'time'
    INDEX = 'index'
    VALUES = 'values'
    NEAREST = 'nearest'
    ZERO = 'zero'
    SLINEAR = 'slinear'
    QUADRATIC = 'quadratic'
    CUBIC = 'cubic'
    BARYCENTRIC = 'barycentric'
    KROGH = 'krogh'
    SPLINE = 'spline'
    POLYNOMIAL = 'polynomial'
    FROM_DERIVATIVES = 'from_derivatives'
    PIECEWISE_POLYNOMIAL = 'piecewise_polynomial'
    PCHIP = 'pchip'
    AKIMA = 'akima'
    CUBICSPLINE = 'cubicspline'   

class DB_NAME(Enum):
    '''
    Database 유형
    '''
    DT_DATA_PLATFORM = 'dt_data_platform'
    DT_DATA_API = 'dt_data_api'


class MD_IP_SI(Enum):
    '''
    SimpleImputer 유형
    '''
    MEDIAN = 'median'
    '''
    중앙
    '''
    MEAN = 'mean'
    '''
    평균
    '''
    MOST_FREQUENT = 'most_frequent'
    '''
    최빈값 (많이 나온값)
    '''
    CONSTANT = 'constant'
    '''
    지정값
    '''

class MD_TYPE(Enum):
    '''
    MODEL 유형
    '''
    LSTM = 'lstm'
    '''
    LSTM
    '''
    GRU = 'gru'
    '''
    GRU
    '''
    SEG_RNN = "seg_rnn"
    '''
    SEG_RNN
    '''
    GAN = 'gan'
    '''
    GAN
    '''

class MD_LOSS(Enum):
    '''
    손실 유형
    '''
    HUB = 'hub'
    '''
    HUB
    '''
    MSE = 'mse'
    '''
    MSE
    '''
    MAE = 'mae'
    '''
    MAE
    '''
    MAPE = 'mape'
    '''
    MAPE
    '''

class MD_OTMZ(Enum):
    '''
    성능 유형
    '''
    ADAM = 'adam'
    '''
    ADAM
    '''
    SGD = 'sgd'
    '''
    SGD
    '''
    AGD = 'agd'
    '''
    AGD
    '''
    RMS = 'rms'
    '''
    RMS
    '''

class MD_METRICS(Enum):
    '''
    metrics 유형
    '''
    MSE = 'mse'
    '''
    MSE
    '''
    RMSE = 'rmse'
    '''
    RMSE
    '''
    MAE = 'mae'
    '''
    MAE
    '''
    MAPE = 'mape'
    '''
    MAPE
    '''

class MD_VFY_TYPE(Enum):
    '''
    검증 유형
    '''
    DT = 'dt'
    '''
    데이터 타입
    '''
    DF = 'df'
    '''
    데이터 포멧
    '''
    RG = 'rg'
    '''
    범위
    '''    

class ERROR_CODE(Enum):
    '''
    오류코드
    '''
    PRE_PROCESS = 'PP'
    '''
    전처리
    '''
    AUGMENT_MODEL = 'AM'
    '''
    증강모델
    '''
    AUGMENT = 'AG'
    '''
    증강
    '''
    AUTH = 'AU'
    '''
    권한
    '''
    CODE = 'CD'
    '''
    코드
    '''
    MENU = 'MN'
    '''
    메뉴
    '''
    UNIT = 'UI'
    '''
    단위
    '''
    USER = 'UE'
    '''
    사용자
    '''
    VRFC = 'VR'
    '''
    검증
    '''