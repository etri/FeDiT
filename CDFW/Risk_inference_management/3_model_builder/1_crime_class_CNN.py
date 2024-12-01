from numpy import genfromtxt
import numpy as np
from keras.models import Sequential
from keras.layers import Dense, Dropout, Conv2D, MaxPool2D, Flatten
from keras.callbacks import EarlyStopping
from keras.regularizers import l2
from sklearn.metrics import classification_report

# x: 568
# y: 22
# t: 590

# 1. 데이터셋 로딩
d_tr = genfromtxt('../2_dataset_builder/data/ds_tr.csv', delimiter=',')
x_tr = d_tr[:, 0:568]
y_tr = d_tr[:, 568:589]
x_cnn_tr = x_tr.reshape(-1,8,71,1)


d_te = genfromtxt('../2_dataset_builder/data/ds_va.csv', delimiter=',')
x_te = d_te[:, 0:568]
y_te = d_te[:, 568:589]
x_cnn_te = x_te.reshape(-1,8,71,1)

d_va = genfromtxt('../2_dataset_builder/data/ds_te.csv', delimiter=',')
x_va = d_va[:, 0:568]
y_va = d_va[:, 568:589]
x_cnn_va = x_va.reshape(-1,8,71,1)


# 2. 모델 구조 설정
model = Sequential()
model.add(Conv2D(1000, kernel_size=2, activation='relu'))
model.add(Conv2D(500, kernel_size=2, activation='relu', name="layer_2"))
#model.add(MaxPool2D(pool_size=(2,2)))

model.add(Conv2D(100, kernel_size=2, activation='relu', name="layer_3"))
model.add(Flatten())
model.add(Dense(50, activation='relu', name="layer_4"))
model.add(Dense(21, activation='softmax', name="layer_5"))


#model = Sequential()
#model.add(Dense(2000, input_dim=568, activation='relu'))
#model.add(Dropout(0.1))
#model.add(Dense(1000, activation='relu', name="layer_2"))
#model.add(Dense(500, activation='relu', name="layer_3"))
#model.add(Dense(100, activation='relu', name="layer_4"))
#model.add(Dense(21, activation='softmax', name="layer_5"))

# model.add(Dense(2000, input_dim=568, activation='relu', kernel_regularizer=l2(0.001)))
# model.add(Dense(1000, activation='relu', kernel_regularizer=l2(0.001), name="layer_2"))
# model.add(Dense(500, activation='relu', kernel_regularizer=l2(0.001), name="layer_3"))
# model.add(Dense(21, activation='softmax', kernel_regularizer=l2(0.001), name="layer_4"))

# 3. 모델 학습 방법 설정
model.compile(optimizer='rmsprop', loss='categorical_crossentropy', metrics=['accuracy'])

# 4. 모델 학습
#early_stopping = EarlyStopping(patience=20)
#hist = model.fit(x_cnn_tr, y_tr, epochs=23, batch_size=16, validation_data=(x_cnn_va, y_va), callbacks=[early_stopping])
hist = model.fit(x_cnn_tr, y_tr, epochs=30, batch_size=16, validation_data=(x_cnn_va, y_va))
# 5. 모델 저장
model.save('./model/crime_class_CNN.h5')

# 6. 모델 학습 과정 검토
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
loss_and_metrics = model.evaluate(x_cnn_te, y_te)
print('loss_and_metrics : ' + str(loss_and_metrics))

# 8. 모델 시험
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

# https://scikit-learn.org/stable/modules/generated/sklearn.metrics.classification_report.html#sklearn.metrics.classification_report
y_test = np.argmax(y_te, axis=1)
y_pred = np.argmax(model.predict(x_cnn_te), axis=-1)
# report = classification_report(y_test, y_pred, output_dict=True)
report = classification_report(y_test, y_pred)

