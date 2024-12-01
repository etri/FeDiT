import fnmatch
import json
import operator
import os
import re
import math
import pandas as pd
from konlpy.tag import Kkma
from krwordrank.word import KRWordRank
import tools


def clean_number(txt):
    # 숫자 제거
    temp = re.findall("[0-9]*", txt)
    for t in temp:
        txt = txt.replace(t, "")
    temp = re.findall("[0-9.:]+", txt)
    for t in temp:
        txt = txt.replace(t, "")
    return txt


# wordrank 계산
def wordrank(data_path, json_path):
    df = pd.read_csv(data_path)
    g = df.groupby('CRIME_M')

    kkma = Kkma()
    output = {}

    for k, v in g.groups.items():
        texts = []
        for i in v:
            print(k, i)
            text = df.values[i][3]
            text = clean_number(text)
            temp = ""
            analyzed_morphemes = kkma.pos(text)
            for morpheme in analyzed_morphemes:
                if morpheme[1] == "NNG" or morpheme[1] == "VV":
                    temp = temp + " " + morpheme[0]
            texts.append(temp)

        min_count = 2
        # if k == "상해":
        #     min_count = 1

        wordrank_extractor = KRWordRank(
            min_count=min_count,
            max_length=10,
            verbose=False
        )
        beta = 0.8
        max_iter = 10
        keywords, rank, graph = wordrank_extractor.extract(texts, beta, max_iter)

        passwords = {word: score for word, score in sorted(keywords.items(), key=lambda x: -x[1])[:]}

        output[k] = []
        count = 0
        for x in passwords.items():
            count += 1
            print(x)
            output[k].append(x[0])

            if count == 200:
                break

    print("#output")
    print(output)

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=4, ensure_ascii=False)


# tfidf 계산
def tfidf(files_path, write_path):
    total_number_of_documents = 0
    list_of_preprocessed_documents = []
    list_of_dics_for_idf = []
    kkma = Kkma()

    # 전처리: 문서별로 형태소 분석 후 명사, 형용사만 추출
    list_of_files = os.listdir(files_path)
    for entry in list_of_files:
        if fnmatch.fnmatch(entry, "*.txt"):
            total_number_of_documents += 1
            preprocessed = []
            dic_for_idf = dict()  # IDF 계산용
            line_list = tools.get_lines_utf8(files_path + "/" + entry)
            for line in line_list:
                try:
                    line = clean_number(line)
                    analyzed_morphemes = kkma.pos(line)
                    for morpheme in analyzed_morphemes:  # morpheme: tuple (형태소, 품사)
                        if morpheme[1] == "NNG" or morpheme[1] == "VV":
                            preprocessed.append(morpheme[0])
                            dic_for_idf[morpheme[0]] = 0
                except:
                    # print("형태소 분석 불가: " + line)
                    continue
            list_of_preprocessed_documents.append(preprocessed)
            list_of_dics_for_idf.append(dic_for_idf)
    print("number of documents: " + str(total_number_of_documents))

    # 각각의 문서에 대하여
    for idx, entry in enumerate(list_of_files):
        if fnmatch.fnmatch(entry, "*.txt"):
            tfidf_dic = dict()

            # TF 계산
            for morpheme in list_of_preprocessed_documents[idx]:
                if tfidf_dic.get(morpheme) is None:
                    tfidf_dic[morpheme] = [0.0, 1, 0]  # [TF-IDF, TF, IDF]
                else:
                    tfidf_dic[morpheme][1] += 1

            # IDF 계산
            for key in tfidf_dic:
                for morpheme_dic in list_of_dics_for_idf:
                    if key in morpheme_dic:
                        tfidf_dic.get(key)[2] += 1

            # TF-IDF 계산
            for key in tfidf_dic:
                value = tfidf_dic.get(key)
                value[0] = value[1] * math.log(total_number_of_documents / (1 + value[2]))

            # TF-IDF 높은 순으로 결과 출력
            w_file = open(write_path + "/" + entry + "_tfidf.txt", "w", encoding="utf-8")
            sorted_tf = sorted(tfidf_dic.items(), key=operator.itemgetter(1))
            for term in reversed(sorted_tf):
                w_file.write(str(term[0]) + " " + str(term[1]) + "\n")
            w_file.close()


# wordrank 계산 결과 읽어 오기
def read_wordrank_result(json_path, data_type):
    with open(json_path, encoding='utf-8') as json_file:
        json_data = json.load(json_file)
        wordrank_keywords = json_data[data_type]
    return wordrank_keywords


# tfidf 계산 결과 읽어 오기
def read_tfidf_result(file_path):
    tfidf_keywords = []
    line_list = tools.get_lines_utf8(file_path)
    for line in line_list:
        item = line.split()
        tfidf_keywords.append(item[0])
    return tfidf_keywords


# wordrank 계산 결과와 tfidf 계산 결과 결합
def ensemble(tfidf_result, wordrank_result):
    tfidf_dict = dict()
    # option: 30, 50, 100
    count = 100
    for keyword in tfidf_result:
        tfidf_dict[keyword] = count
        count -= 1
        if count == 0:
            break

    wordrank_dict = dict()
    # option: 30, 50, 100
    count = 100
    for keyword in wordrank_result:
        wordrank_dict[keyword] = count
        count -= 1
        if count == 0:
            break

    ensemble_dict = dict()
    for key in wordrank_dict:
        if key in tfidf_dict:
            ensemble_dict[key] = wordrank_dict.get(key) + tfidf_dict.get(key)

    sorted_dict = sorted(ensemble_dict.items(), key=operator.itemgetter(1), reverse=True)
    return sorted_dict
