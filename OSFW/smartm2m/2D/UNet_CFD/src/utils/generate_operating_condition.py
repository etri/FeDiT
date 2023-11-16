import pandas as pd
import numpy as np
from tqdm import tqdm
import os

PAD = '<PAD>'
UX = '<UX>'
UY = '<UY>'
DEN = '<DENSITY>'
VIS = '<VISCOSITY>'
NONE = '<NONE>'
MARKER = [PAD, UX, UY, DEN, VIS, NONE]

MAX_SEQUENCE = 10

def load_data():
    data_lst = os.listdir('dataset/preprocessed/')
    return data_lst

def generate_operating_data():
    '''장애물 없는 경우 운전 데이터 생성'''
    vocab_path = 'src/data/vocab.txt'
    data_lst = load_data()
    tokens = process_data(data_lst)
    char2idx, idx2char = load_vocabulary(tokens,vocab_path)
    indexes = transform_number(tokens,char2idx) 
    np.save('dataset/operating_condition.npy',indexes)
    return char2idx, idx2char 

def process_data(data_lst):
    '''특정 컬럼데이터 로드 및 토큰 생성'''
    tokens = []
    for value in data_lst:
        value = value.strip('.csv')
        value_str = value.split("_")
        ux = value_str[2]
        uy = value_str[4]
        density = 1
        viscosity = 1
        token = generate_tokens(ux,uy,density,viscosity)
        tokens.append(token)
    return tokens

def generate_tokens(ux,uy,density,viscosity):
    '''텍스트로 운전조건 저장'''
    text_input = []
    text_input.append(UX)
    text_input.append(str(ux))
    text_input.append(UY)
    text_input.append(str(uy))
    text_input.append(DEN)
    text_input.append(str(density))
    text_input.append(VIS)
    text_input.append(str(viscosity))
    text_input.append(NONE)
    text_input.append(str(0))
    text_input = ' '.join(text_input) 
    return [text_input]

def load_vocabulary(tokens,vocab_path):
    ''' 입력된 tokens와 vocab파일(.txt) 을 사용하여 (단어: 인덱스 , 인덱스: 단어) 형태의 딕셔너리 생성'''
    if not os.path.exists(vocab_path):
        words = extract_property_value(tokens)
        words = list(set(words))
        words[:0] = MARKER
        register_vocab(words,vocab_path)
    vocab_list = load_vocab(vocab_path)
    char2idx, idx2char = make_vocabulary(vocab_list)
    return char2idx, idx2char

def extract_property_value(tokens):
    '''속성값 추출 (속성값 예 : 속도 2.38 2.15...)'''
    words = []
    for token in tokens:
        # token 예 : ['<inlet_velocity> 2.38 <inlet_temperature> 10 <wall_temperature> 10 <Angle> 50 <NONE> 0']
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


