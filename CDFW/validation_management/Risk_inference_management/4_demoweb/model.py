from flask import Blueprint, request, jsonify
from keras.models import load_model
from keras.models import load_model
from konlpy.tag import Kkma
from krwordrank.word import KRWordRank
import os
import json
import re
import numpy as np
import wordcloud
import math

model = Blueprint('model', __name__)

m1 = load_model('./model/crime_class.h5')
m2 = load_model('./model/crs.h5')

kkma = Kkma()

kwd_idx = {}
with open('data/keywords.json', 'r') as f:
    data = json.load(f)
    del data["교통사고"]
    del data["교통사고외"]
    count = 0
    for k, v in data.items():
        temp = 0
        for x in v:
            if x not in kwd_idx:
                kwd_idx[x] = []
            kwd_idx[x].append(count)
            count += 1
            temp += 1
        # print(f"{k}:{temp}")
vx_count = count


def clean_number(txt):
    temp = re.findall("[0-9]*", txt)
    for t in temp:
        txt = txt.replace(t, "")
    temp = re.findall("[0-9.:]+", txt)
    for t in temp:
        txt = txt.replace(t, "")
    return txt


def get_vec(text):
    text = clean_number(text)

    # init vector
    tx = [0] * vx_count

    # option
    pos = kkma.pos(text)

    keywords = [0] * 568

    # extract words
    for p in pos:
        print(p)
        if p[0] in kwd_idx:
            for i in kwd_idx[p[0]]:
                tx[i] = 1
                keywords[i] = p[0]

    return np.reshape([tx], (1, 568)), keywords


@model.route('/predict', methods=['post'])
def predict():
    msg = {
        'err': None,
        'res': {}
    }
    # return [class_name, class_weights:[...], word_cloud]
    # return [crs]

    # text = "피의자 반서율은 2012. 08. 28. 21:01경 서울 특별시 중량구 봉화산로26가길 39-7 (상봉동) 맛나커피에서 옆자리에 앉아 있던 피해자 신지예가 자리를 비운 틈에 피해자의 가방을 가지고 나와 절취하였다. 이로써 피의자는 피해자의 가방에서 현금 5만원과 신용카드 2장, 체크카드 1장, 주민등록증과 운전면허증이 들어있는 카드지갑을 꺼내 이를 절취하였다."

    try:
        text = request.json['text']

        msg['res']['wordcloud'] = wordcloud.get(text)

        x, keywords = get_vec(text)
        msg['res']['keywords'] = keywords

        y_ = m1.predict_classes(x)
        msg['res']['crime'] = y_.tolist()[0]
        print(y_)

        y1 = m1.predict(x)
        temp = y1.tolist()[0]
        msg['res']['crime_probs'] = [math.floor(num * 10 ** 2) / 10 ** 2 for num in temp]
        print(y1)

        y2 = m2.predict(x)
        print(y2)
        msg['res']['crs'] = round(y2.tolist()[0][0], 2)

    except Exception as ex:
        print(ex)

    return jsonify(msg)
