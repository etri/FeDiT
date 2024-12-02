from keras.models import load_model
from sklearn.metrics import mean_squared_error
import numpy as np
from numpy import genfromtxt
import random

def mean_absolute_percentage_error(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    return np.mean(np.abs((y_true - y_pred) / y_true)) * 100


# 1. 데이터셋 로딩
d_te = genfromtxt('../2_dataset_builder/data/ds_te.csv', delimiter=',')
x_te = d_te[:, 0:568]
y_te = d_te[:, 589:590]
y_ii = d_te[:, 568:589]
x_cnn_te = x_te.reshape(-1,8,71,1)


# 2. dataset 을 범죄별로 분류 (why? 범죄별 예측 정확도 산출)
labels = [
    "절도",
    "체포감금",
    "손괴",
    "공갈",
    "약취유인",
    "상해",
    "폭행",
    "협박",
    "횡령",
    "배임",
    "사기",
    "특별경제범죄",
    "강간",
    "강도",
    "강제추행",
    "살인",
    "방화",
    "유사강간",
    "마약",
    "도박범죄",
    "성풍속범죄"
]

ds_temp = {
}

for i, v in enumerate(y_ii):
    pos = np.where(v == 1)[0][0]
    if pos in ds_temp:
        ds_temp[pos]['x'].append(x_cnn_te[i].astype(int).tolist()),
        ds_temp[pos]['y'].append(y_te[i].tolist()),
    else:
        ds_temp[pos] = {
            'x': [x_cnn_te[i].astype(int).tolist()],
            'y': [y_te[i].tolist()]
        }

    # print(i, pos, labels[pos])
    # print('y:{} y_:{}'.format(label[idx], label[v]))

model = load_model('./model/crs_CNN.h5')

print("===")
print("범죄 유형별 성능 평가")
for k, v in ds_temp.items():
    print("")
    print(labels[k])
    x_test = np.array(v['x'])
    y_true = np.array(v['y'])

    # total
    y_pred = model.predict(x_test, batch_size=16)

    mse = mean_squared_error(y_true, y_pred)
    print('mse', mse)

    rmse = mean_squared_error(y_true, y_pred, squared=False)
    print('rmse', rmse)

    mape = mean_absolute_percentage_error(y_true, y_pred)
    print('mape', mape)

    # for k2, v2 in enumerate(y_pred):
    #     print('{},{}'.format(y_true[k2][0], v2[0]))


print("")
print("전체 성능 평가")
y_pred = model.predict(x_cnn_te, batch_size=16)

mse = mean_squared_error(y_te, y_pred)
print('mse', mse)

rmse = mean_squared_error(y_te, y_pred, squared=False)
print('rmse', rmse)

mape = mean_absolute_percentage_error(y_te, y_pred)
print('mape', mape)

# for i, v in enumerate(y_pred):
#     print('{},{}'.format(y_te[i][0], v[0]))
