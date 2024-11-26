import sys
from src.auto_train import AutoTrain

if __name__=="__main__":
    if len(sys.argv) < 2:
        print("추론시 사용할 csv 파일명 지정")
        exit()
    
    # 파라미터 검사
    autoTrain = AutoTrain(name=sys.argv[1])
    mae = autoTrain.load_and_infer()
    print("정합성 점수:", mae)