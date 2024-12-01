# output
# ds_tr.csv
# ds_va.csv
# ds_te.csv

# vector size 계산
# keywords.json 이용해서 계산
# 교통 데이터 제거
# 강도(n1)+강간(n2)+.....: total
# 제외
# 교통사고, 교통사고외

import json
import re
from konlpy.tag import Kkma
from krwordrank.word import KRWordRank
import csv
import pandas as pd
import math

kkma = Kkma()


def clean_number(txt):
    # 숫자 제거
    temp = re.findall("[0-9]*", txt)
    for t in temp:
        txt = txt.replace(t, "")
    temp = re.findall("[0-9.:]+", txt)
    for t in temp:
        txt = txt.replace(t, "")
    return txt


def get_morphemes(text):
    # option
    print("# data cleansing")
    text = clean_number(text)

    # option
    print("# pos")
    pos = kkma.pos(text)
    print(pos)

    words = []
    for w in pos:
        if w[1] == "NNG" or w[1] == "VV":
            words.append((w[0], 1))

    return words


# y 벡터 템플릿 생성
# 범죄유형별로 정답 벡터 구조 생성
# 예) "강도":[1,0,0,0....,crs]
# 데이터셋 생성시 이 정보를 이용함
print("1.create y vector template")
y = {}  # class[0,.....][crs]
with open('data/keywords.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    del data["교통사고"]
    del data["교통사고외"]
    vy_count = len(data.keys()) + 1
    idx = 0
    for k, v in data.items():
        print(f"{k} idx:{idx}")
        y[k] = [0] * vy_count
        y[k][idx] = 1
        idx += 1

print(y)
# print(json.dumps(y, indent=4, sort_keys=True, ensure_ascii=False))


# 키워드 인덱스 생성
# 키워드:벡터포지션 정보 생성
# 데이터셋 생성시 키워드의 벡터 위치 정보 알아냄
print("2.create keyword index")
kwd_idx = {}
with open('data/keywords.json', 'r', encoding='utf-8') as f:
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
        print(f"{k}:{temp}")

print(f"vector_size:{count}")
# print(json.dumps(kwd_idx, indent=4, sort_keys=True, ensure_ascii=False))

vx_count = count
print(f"vx_count{vx_count}, vy_count{vy_count}, total:{vx_count + vy_count}")

print("3.create x vector")
# 학습데이터 생성 (x, y)
# 타입별로 생성하고
# ds_total.csv (전체 저장)
# ds_tr.csv (60%)
# ds_va.csv (20%)
# ds_te.csv (20%)

# 데이터 그룹별로 읽기
# kics 데이터 읽기


df = pd.read_csv("data/kics_5k.csv")

# kics 데이터를 유형별로 분류
g = df.groupby(['CRIME_M'])

ds_tr = []
ds_va = []
ds_te = []

for x1 in g:
    print(x1[0], x1[1].shape[0])

    if x1[0] == "교통사고" or x1[0] == "교통사고외":
        continue

    xy_list = []
    for idx, row in x1[1].iterrows():
        print(idx, row)

        # init vector
        tx = [0] * vx_count
        ty = y[x1[0]]
        ty[-1] = row['CRS']

        xy = tx + ty
        print(xy)

        # extract words
        morphemes = get_morphemes(row['범죄사실'])
        for m in morphemes:
            if m[0] in kwd_idx:
                for i in kwd_idx[m[0]]:
                    xy[i] = round(m[1], 4)
        xy_list.append(xy)

    tr_count = math.floor(x1[1].shape[0] * 0.6)
    va_count = math.floor(x1[1].shape[0] * 0.2)
    te_count = x1[1].shape[0] - tr_count - va_count

    ds_tr.extend(xy_list[:tr_count])
    ds_va.extend(xy_list[tr_count: tr_count + va_count])
    ds_te.extend(xy_list[tr_count + va_count:])


# tr_count + va_count

with open("data/ds_tr.csv", 'w') as f:
    wr = csv.writer(f)
    wr.writerows(ds_tr)

with open("data/ds_va.csv", 'w') as f:
    wr = csv.writer(f)
    wr.writerows(ds_va)

with open("data/ds_te.csv", 'w') as f:
    wr = csv.writer(f)
    wr.writerows(ds_te)
