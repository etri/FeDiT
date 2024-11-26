from numpy import genfromtxt
import numpy as np
from keras.models import Sequential
from keras.layers import Dense
import random
from keras.regularizers import l2

# 1. 데이터셋 로딩
d_tr = genfromtxt('../2_dataset_builder/data/ds_tr.csv', delimiter=',')
x_tr = d_tr[:, 0:568]
y_tr = d_tr[:, 589:590]

d_va = genfromtxt('../2_dataset_builder/data/ds_va.csv', delimiter=',')
x_va = d_va[:, 0:568]
y_va = d_va[:, 589:590]

d_te = genfromtxt('../2_dataset_builder/data/ds_te.csv', delimiter=',')
x_te = d_te[:, 0:568]
y_te = d_te[:, 589:590]

# 2. 모델 구조 설정
model = Sequential()
model.add(Dense(2000, input_dim=568, activation='relu', kernel_regularizer=l2(0.001)))
model.add(Dense(1000, activation='relu', kernel_regularizer=l2(0.001)))
model.add(Dense(500, activation='relu', kernel_regularizer=l2(0.001)))
model.add(Dense(256, activation='relu', kernel_regularizer=l2(0.001)))
model.add(Dense(1))

# 3. 모델 학습 방법 설정
model.compile(optimizer='rmsprop', loss='mse', metrics=['accuracy'])
# model.summary()

# 4. 모델 학습
# hist = model.fit(x_tr, y_tr, epochs=1500, batch_size=128, validation_data=(x_va, y_va))
from keras.callbacks import EarlyStopping

early_stopping = EarlyStopping(patience=10)
hist = model.fit(x_tr, y_tr, epochs=1500, batch_size=16, validation_data=(x_va, y_va), callbacks=[early_stopping])

# 5. 모델 저장
model.save('./model/crs.h5')

# 5. 모델 학습 과정 검토
# import matplotlib.pyplot as plt
# fig, loss_ax = plt.subplots()
# acc_ax = loss_ax.twinx()
# loss_ax.plot(hist.history['loss'], 'y', label='train_loss')
# loss_ax.plot(hist.history['val_loss'], 'r', label='val_loss')
# acc_ax.plot(hist.history['accuracy'], 'b', label='train_accuracy')
# acc_ax.plot(hist.history['val_accuracy'], 'g', label='val_accuracy')
# loss_ax.set_xlabel('epoch')
# loss_ax.set_ylabel('loss')
# acc_ax.set_ylabel('accuracy')
# loss_ax.legend(loc='upper left')
# acc_ax.legend(loc='lower left')
# plt.show()

# 7. 모델 평가
loss = model.evaluate(x_te, y_te, batch_size=16)
print('loss : ' + str(loss))

# 8. 모델 시험
# y_ = model.predict(x_te, batch_size=32)
# for i, v in enumerate(y_):
#     print('{},{}'.format(y_te[i][0], v[0]))
