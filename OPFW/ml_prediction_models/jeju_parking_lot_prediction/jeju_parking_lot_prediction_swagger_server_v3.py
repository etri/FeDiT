from flask import Flask, request, jsonify, redirect
from datetime import datetime, timedelta
import random
from collections import OrderedDict
from flasgger import Swagger, swag_from
import joblib
import holidays
import pandas as pd

app = Flask(__name__)
swagger = Swagger(app)

# 주차장 ID 리스트
measure_position_id_list = [
    11111111, 11251813, 16488201, 16489518, 17039715, 
    17385794, 17435963, 17680713, 17759313, 20019319
]

measure_position_name_list = ['서귀포매일올레시장', '신제주공영주차장', '법원북측공영주차장', '인제공영주차장', '동문공설시장공영주차장',
                              '서귀중앙공영주차빌딩', '칠성골공영주차장', '이도2동공영주차장', '북수구공영주차장', '산짓물공영주차장']


measure_position_space_list = [216, 500, 91, 125, 264,
                               306, 80, 150, 51, 71]

fdo_id_list = ['F-KR-109941-0001', 'F-KR-109941-0002', 'F-KR-109941-0003', 'F-KR-109941-0004', 'F-KR-109941-0005', 
               'F-KR-109941-0006', 'F-KR-109941-0007', 'F-KR-109941-0008', 'F-KR-109941-0009', 'F-KR-109941-0010',
               'F-KR-109941-0011', 'F-KR-109941-0012', 'F-KR-109941-0013', 'F-KR-109941-0014', 'F-KR-109941-0015',
               'F-KR-109941-0016', 'F-KR-109941-0017', 'F-KR-109941-0018', 'F-KR-109941-0019', 'F-KR-109941-0020'] 

fdo_do_map_list = ['KR-109012-0003', 'KR-109012-0001', 'KR-109012-0006', 'KR-109012-0006', 'KR-109012-0006', 
                   'KR-109012-0002', 'KR-109012-0006', 'KR-109012-0001', 'KR-109012-0004', 'KR-109012-0004',
                   'KR-109012-0004', 'KR-109012-0001', 'KR-109012-0004', 'KR-109012-0006', 'KR-109012-0001',
                   'KR-109012-0007', 'KR-109012-0004', 'KR-109012-0006', 'KR-109012-0002', 'KR-109012-0002']

do_id = ['KR-109012-0001', 'KR-109012-0002', 'KR-109012-0003', 'KR-109012-0004', 'KR-109012-0005',
         'KR-109012-0006', 'KR-109012-0007', 'KR-109012-0008', 'KR-109012-0009', 'KR-109012-0010']

# 데이터프레임 생성
table_01 = {'FDO_id': fdo_id_list, 'DO_id': fdo_do_map_list}
df1 = pd.DataFrame(table_01)

table_02 = {'DO_id': do_id, 'measure_position_id': measure_position_id_list, 
            'measure_position_name': measure_position_name_list, 
            'measure_position_space': measure_position_space_list}
df2 = pd.DataFrame(table_02)

# 두 테이블을 'DO_id'를 기준으로 조인
merged_df = pd.merge(df1, df2, on='DO_id', how='left')

# 특정 FDO_id에 해당하는 measure_position_id와 measure_position_name, measure_position_space 찾기 함수
def get_measure_info(fdo_id):
    result = merged_df.loc[merged_df['FDO_id'] == fdo_id, ['measure_position_id', 'measure_position_name', 'measure_position_space']]
    if not result.empty:
        measure_position_id = int(result['measure_position_id'].values[0])  # int64 to int
        measure_position_name = result['measure_position_name'].values[0]
        measure_position_space = int(result['measure_position_space'].values[0])  # int64 to int
        return measure_position_id, measure_position_name, measure_position_space
    else:
        return None, None, None


# congestion_rate 계산 함수
def calculate_congestion_rate(x, measure_position_space):
    if measure_position_space == 0:
        return 0  # Division by zero 방지
    return max(0, min(1, 1 - (x / measure_position_space)))



# 모델 파일 로드 함수 정의
def load_model(file_name):
    try:
        loaded_model = joblib.load(file_name)
        print(f"모델 로드 성공: {file_name}")
        return loaded_model
    except Exception as e:
        print(f"모델 로드 실패: {file_name}")
        print(f"오류 내용: {e}")
        return None

# 미래 시각에 대한 예측 함수 정의
def predict_gnrl(model, date_time):
    features = ['minutes_of_day', 'day_of_week', 'day_type']

    # 시각 정보를 기반으로 예측에 사용할 데이터를 생성
    minutes_of_day = date_time.hour * 60 + date_time.minute    
    day_of_week = date_time.weekday()  # 월요일이 0, 일요일이 6
    
    # 공휴일 추가
    kr_holidays = holidays.KR()  # 한국의 공휴일 정보를 가져오기

    # 평일/공휴일을 판단하는 함수
    def determine_day_type(date):
        if date in kr_holidays:
            return 0
        elif date.weekday() >= 5:  # 토요일(5) 또는 일요일(6)인 경우
            return 0
        else:
            return 1

    day_type = determine_day_type(date_time)
    
    # 예측을 위한 데이터 생성
    input_data = pd.DataFrame([[minutes_of_day, day_of_week, day_type]], columns=features)
    
    # 모델을 사용하여 예측 수행
    predicted_gnrl = model.predict(input_data)
    
    return predicted_gnrl[0]

# 특정 measure_position_id에 대한 예측 데이터를 생성하는 함수
def generate_forecast(parking_lot_id, measure_position_space):
    # 모델 파일 경로 생성
    file_name = f'model/jeju_parking_lot_model_{parking_lot_id}.pkl'
    model = load_model(file_name)
    
    if model is None:
        return None  # 모델 로드 실패 시

    forecast = []
    now = datetime.now()  # 현재 시각을 가져오기
    
    # 1시간씩 증가하며 48개의 예측 수행
    for hour in range(48):
        current_time = now + timedelta(hours=hour)  # 현재 시각에서 1시간씩 증가
        predicted_value = predict_gnrl(model, current_time)
        
        # congestion_rate 계산
        congestion_rate = calculate_congestion_rate(predicted_value, measure_position_space)
        
        forecast.append(OrderedDict({
            "date_time": current_time.isoformat(),
            "prediction_value": int(predicted_value),  # JSON 직렬화를 위해 int 변환
            "congestion_rate": round(congestion_rate, 2)  # congestion_rate 추가 및 소수점 2자리
        }))
    
    return forecast



# /api/tci/ai_engine/park_pred 경로로 GET 요청을 처리
@app.route('/api/tci/ai_engine/park_pred', methods=['GET'])
@swag_from({
    'summary': '48시간 예측 데이터를 반환하는 API',
    'description': 'fdo_id를 기반으로 매핑된 주차장 ID에 대한 48시간 동안의 예측 데이터를 반환합니다.',
    'parameters': [
        {
            'name': 'fdo_id',
            'in': 'query',
            'type': 'string',
            'required': True,
            'description': f"예측 데이터를 요청할 관광지 ID. 사용 가능한 fdo_id: {', '.join(fdo_id_list)}"
        }
    ],
    'responses': {
        200: {
            'description': '예측 데이터가 성공적으로 반환되었습니다.',
            'schema': {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'response_time': {'type': 'string'},
                    'inference_duration': {'type': 'string'},
                    'forecasts': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'fdo_id': {'type': 'string'},
                                'pkl_id': {'type': 'string'},
                                'predictions': {
                                    'type': 'array',
                                    'items': {
                                        'type': 'object',
                                        'properties': {
                                            'date_time': {'type': 'string'},
                                            'prediction_value': {'type': 'number'},
                                            'congestion_rate': {'type': 'number'}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        400: {
            'description': '요청 데이터가 잘못되었습니다.'
        }
    }
})

def park_prediction():
    start_time = datetime.now()  # 요청 시작 시간 기록
    fdo_id = request.args.get('fdo_id')  # 쿼리 파라미터로부터 fdo_id 값 가져오기
    response_time = start_time.isoformat()  # 응답 시각 기록
    
    try:
        # 응답 데이터를 저장할 리스트
        response_forecasts = []

        # fdo_id가 없는 경우 전체 fdo_id_list에 대해 예측 수행
        fdo_ids_to_process = fdo_id_list if not fdo_id else [fdo_id]

        for current_fdo_id in fdo_ids_to_process:
            # fdo_id를 사용해 measure_position_id와 measure_position_name 찾기
            measure_position_id, measure_position_name, measure_position_space = get_measure_info(current_fdo_id)
            
            if measure_position_id is None:
                # 해당 fdo_id에 대한 정보가 없을 경우 경고 메시지 추가
                response_forecasts.append(OrderedDict({
                    "fdo_id": current_fdo_id,
                    "error": f"fdo_id '{current_fdo_id}'는 등록되어 있지 않습니다. 유효한 fdo_id를 사용하세요."
                }))
                continue  # 다음 fdo_id로 진행

            # 매핑된 measure_position_id에 대한 예측값 반환
            forecast_data = generate_forecast(measure_position_id, measure_position_space)
            if forecast_data is None:
                response_forecasts.append(OrderedDict({
                    "fdo_id": current_fdo_id,
                    "error": f"모델 로드 실패: '{measure_position_id}'"
                }))
                continue  # 다음 fdo_id로 진행
            
            # 정상적으로 예측된 경우
            response_forecasts.append(OrderedDict({
                "fdo_id": current_fdo_id,
                "pkl_id": measure_position_id,
                "predictions": forecast_data
            }))

        # 최종 응답 생성
        response = OrderedDict({
            "success": True,
            "response_time": response_time,                
            "inference_duration": str(datetime.now() - start_time),
            "forecasts": response_forecasts
        })
        
        return jsonify(response), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "response_time": response_time,
            "inference_duration": str(datetime.now() - start_time),
            "error": str(e)
        }), 500

@app.route('/')
def home():
    return "의사결정 추론 서버 정상 동작중..."

# 404 에러 핸들러 정의
@app.errorhandler(404)
def page_not_found(error):
    return "잘못된 요청을 하였습니다. URL을 다시 확인하세요.", 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)