import dic_builder
import pandas as pd
import json

# 처리순서
# 1.wordrank
# 2.tfidf
# 3.read_wordrank_result
# 4.read_tfidf_result
# 5.ensemble

# wordrank 계산
print("1: wordrank processing")
raw_data = "data/1_source/kics_5k.csv"
wordrank_result = "data/2_wordrank_result/keywords.json"
dic_builder.wordrank(raw_data, wordrank_result)

# TF-ID 계산
print("2: tfidf processing")
background_documents = "data/3_tfidf_background"
tfidf_result = "data/4_tfidf_result"
dic_builder.tfidf(background_documents, tfidf_result)

df = pd.read_csv("data/1_source/kics_5k.csv")
categories = df['CRIME_M'].unique()

keywords = {

}

for category in categories:
    temp = tfidf_result + "/" + category + ".txt_tfidf.txt"
    print("3: read wordrank result:", category)
    tfidf = dic_builder.read_tfidf_result(temp)
    print("4: read tfidf result:", category)
    wordrank = dic_builder.read_wordrank_result(wordrank_result, category)
    print("5: ensemble:", category)
    ensemble_dict = dic_builder.ensemble(tfidf, wordrank)
    temp = "data/5_ensemble_result"
    write_path = temp + "/" + category + ".txt"

    keywords[category] = []

    file = open(write_path, "w", encoding="utf-8")
    for entry in ensemble_dict:
        file.write(str(entry[0]) + " " + str(entry[1]) + "\n")
        if entry[1] >= 100:
            keywords[category].append(entry[0])
    file.close()


with open("data/5_ensemble_result/keywords.json", 'w', encoding='utf-8') as f:
    json.dump(keywords, f, indent=4, ensure_ascii=False)

