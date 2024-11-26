import re
from konlpy.tag import Kkma
from krwordrank.word import KRWordRank


def clean_number(txt):
    # 숫자 제거
    temp = re.findall("[0-9]*", txt)
    for t in temp:
        txt = txt.replace(t, "")
    temp = re.findall("[0-9.:]+", txt)
    for t in temp:
        txt = txt.replace(t, "")
    return txt


kkma = Kkma()


def get(text):
    text = clean_number(text)

    # option
    texts = []
    temp = ""
    analyzed_morphemes = kkma.pos(text)
    for morpheme in analyzed_morphemes:
        if morpheme[1] == "NNG" or morpheme[1] == "VV":
            temp = temp + " " + morpheme[0]
    texts.append(temp)

    # nouns = kkma.nouns(text)
    # text = " ".join(nouns)

    # word_rank
    wordrank_extractor = KRWordRank(
        min_count=1,  # 단어의 최소 출현 빈도수 (그래프 생성 시)
        max_length=10,  # 단어의 최대 길이
        verbose=False
    )
    beta = 0.8  # PageRank의 decaying factor beta
    max_iter = 10
    keywords, rank, graph = wordrank_extractor.extract(texts, beta, max_iter)

    # passwords(필터를 pass한 단어들)
    words = {word: score for word, score in sorted(keywords.items(), key=lambda x: -x[1])[:]}
    # passwords = {word: score for word, score in sorted(keywords.items(), key=lambda x: -x[1])[:]
    #              if not (word in stopwords)}

    return words

# temp = """
# 피의자는 2018.10.17 16:21경 서울 서대문구 통일로 191 파리바게트 앞에서 배고픔을 이기지 못해 음식을 약탈하기로 마음먹었다. 피의자는 위 주소지 인근길에서 빈 소주병 하나를 준비해 깬 다음, 파리바게트로 뛰어들어갔다. 근무 중이던 피해자 한소민은 피의자가 뛰어들어오자 가게 안에 있던 손님들부터 내보낸 뒤, "빵을 그냥 드릴테니 소란을 피우지 말고 나가줄 것"을 부탁했다. 이에 피의자는 이에 만족하지 못하고 "20만원과 빵을 달라"고 요청했고, 한소민은 "빵은 드리겠다"고 말했다.
# 이로써 피의자는 피해자를 위협해 빵 10여개와 현금 8만원을 강취했다. 피의자 강동윤은 금전적 스트레스를 이유로 범죄를 저질렀다.
# """
#
# words = get(temp)
# print(words)
