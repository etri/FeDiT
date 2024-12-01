import csv
import pandas as pd
import math

df = pd.read_csv("data/kics_5k.csv")

# kics 데이터를 유형별로 분류
g = df.groupby(['CRIME_M'])

test_data = []

for x1 in g:
    if x1[0] == "교통사고" or x1[0] == "교통사고외":
        continue

    temp = []
    for idx, row in x1[1].iterrows():
        temp.append([x1[0], row['CRS'], row['범죄사실']])

    tr_count = math.floor(x1[1].shape[0] * 0.6)
    va_count = math.floor(x1[1].shape[0] * 0.2)
    te_count = x1[1].shape[0] - tr_count - va_count
    test_data.extend(temp[tr_count + va_count:])

with open("data/test_data.csv", 'w') as f:
    wr = csv.writer(f)
    wr.writerows(test_data)
