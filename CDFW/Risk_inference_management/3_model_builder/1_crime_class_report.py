from numpy import genfromtxt
import numpy as np
from keras.models import Sequential
from keras.layers import Dense, Dropout
from keras.regularizers import l2
from keras.models import load_model
from sklearn.metrics import classification_report

# x: 568
# y: 22
# t: 590

# 1. 데이터셋 로딩
d_te = genfromtxt('../2_dataset_builder/data/ds_te.csv', delimiter=',')
x_te = d_te[:, 0:568]
y_te = d_te[:, 568:589]

model = load_model('./model/crime_class.h5')

label = [
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

y_test = np.argmax(y_te, axis=1)
# y_pred = model.predict_classes(x_te)
y_pred = np.argmax(model.predict(x_te), axis=-1)
# report = classification_report(y_test, y_pred, output_dict=True)
report = classification_report(y_test, y_pred)
print(report)
