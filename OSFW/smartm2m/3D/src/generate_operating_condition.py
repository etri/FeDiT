import numpy as np
import os
import re
import pandas as pd

IV = '<inlet_velocity>'
NONE = '<NONE>'
MARKER = [IV, NONE]
MAX_SEQUENCE = 10
vocab_path = "src/vocab.txt"

def generate_operating_condition():
    # 필요한 부분만 읽어 새로 저장
    processed_path = "dataset/processed/csv/"
    filelst = os.listdir(processed_path)
    operation_value = sorted(list(map(lambda x:re.sub(".csv","",x).split("_")[2],filelst)))

    # 시뮬레이션 정보저장
    simulation_df = pd.DataFrame({"inlet_velocity":operation_value})
    simulation_df.to_csv("src/simulation_info.csv",index=False)

    # 토큰생성
    tokens = generate_tokens(operation_value)    
    char2idx, idx2char = load_vocabulary(tokens,vocab_path)

    # 숫자로 변환
    indexes = transform_number(tokens,char2idx) 
    
    # 저장
    np.save('dataset/processed/input/operating/operating_condition.npy',indexes)
    return char2idx, idx2char

def generate_tokens(operation_value):

    tokens = []
    for v in operation_value:
        text_input = []
        text_input.append('<inlet_velocity>')
        text_input.append(str(v))
        text_input.append('<NONE>')
        text_input.append('0')
        text_input = ' '.join(text_input) 
        tokens.append([text_input])
    
    return tokens

def load_vocabulary(tokens,vocab_path):
    ''' 입력된 tokens와 vocab파일(.txt) 을 사용하여 (단어: 인덱스 , 인덱스: 단어) 형태의 딕셔너리 생성'''
    if not os.path.exists(vocab_path):
        words = extract_property_value(tokens)
        words = sorted(list(set(words)))
        words[:0] = MARKER
        register_vocab(words,vocab_path)
    vocab_list = load_vocab(vocab_path)
    char2idx, idx2char = make_vocabulary(vocab_list)
    return char2idx, idx2char

def extract_property_value(tokens):
    '''속성값 추출 (속성값 예 : 속도 2.38 2.15...)'''
    words = []
    for token in tokens:
        # token 예 : ['<inlet_velocity> 5 <NONE> 0']
        for word in token[0].split(): 
            if word not in MARKER: 
                words.append(word)
    return [word for word in words if word]

def register_vocab(words,vocab_path):
    '''vocab 등록'''
    with open(vocab_path, 'w', encoding='utf-8') as vocab_file:
        for word in words:
            vocab_file.write(word + '\n')

def load_vocab(vocab_path):
    '''vocab load'''
    vocab_list = []
    with open(vocab_path, 'r', encoding='utf-8') as vocab_file:
        for line in vocab_file:
            vocab_list.append(line.strip())
    return vocab_list

def make_vocabulary(vocab_list):
    '''(단어: 인덱스 , 인덱스: 단어) 형태의 딕셔너리 생성'''
    char2idx = {char: idx for idx, char in enumerate(vocab_list)}
    idx2char = {idx: char for idx, char in enumerate(vocab_list)}
    return char2idx, idx2char

def transform_number(tokens,char2idx):
    '''토큰 전부 index(숫자)로 변환'''
    indexes = []
    for token in tokens:
        index = []
        for tok in token[0].split(' '):
            index.append(char2idx[tok])
        indexes.append(index)
    indexes = np.array(indexes)
    return indexes


