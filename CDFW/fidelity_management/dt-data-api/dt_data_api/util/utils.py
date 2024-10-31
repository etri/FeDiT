import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

class Utils:

    # 컬럼에 숫자와 문자값이 섞여 있는지 확인하는 함수
    def is_mixed_column(self, df, column_name, ignoreBlank=True):
        # 컬럼 내 각 값이 숫자인지 확인
        def is_numeric(value):
            if pd.isna(value) or value == '':  # 빈 값 무시
                return None
            try:
                float(value)
                return True
            except ValueError:
                return False

        # 컬럼에 대해 숫자와 문자의 개수를 확인
        is_numeric_series = df[column_name].apply(is_numeric)

        # 빈 값을 제외하고 숫자와 문자가 모두 포함되어 있는지 체크
        if ignoreBlank:
            is_numeric_series = is_numeric_series.dropna()

        # 숫자가 아닌 값이 하나라도 있는지 확인할 때, 부울 반전 사용
        has_numeric = is_numeric_series.any()
        has_non_numeric = (~is_numeric_series.astype(bool)).any()

        return has_numeric and has_non_numeric
    
    # 특정 컬럼에서 정수가 아닌 숫자 값을 NaN으로 바꾸는 함수
    def replace_non_integer_numbers_with_nan(self, df, column_name):
        # 각 값이 정수가 아닌 숫자인지 확인하는 함수
        def is_non_integer_number(value):
            try:
                # 숫자인지 확인
                number = float(value)
                # 정수가 아니면 True
                return not number.is_integer()
            except (ValueError, TypeError):
                # 숫자가 아닌 경우 False 반환
                return False

        # 정수가 아닌 숫자 값들을 NaN으로 대체
        df[column_name] = df[column_name].apply(lambda x: np.nan if is_non_integer_number(x) else x)
        return df
    
    # 특정 컬럼에 LabelEncoder 적용, 빈칸 또는 공백 제외
    def label_encode_column_ignore_blanks(self, df, column_name):
        # LabelEncoder 생성
        le = LabelEncoder()

        # 빈칸이나 공백을 np.nan으로 변환
        df[column_name] = df[column_name].replace(r'^\s*$', np.nan, regex=True)

        # 빈값을 제외한 시리즈를 사용해 LabelEncoder를 학습
        valid_series = df[column_name].dropna()
        le.fit(valid_series)

        # 학습된 LabelEncoder를 사용하여 인코딩, 빈값은 유지
        df[column_name] = df[column_name].apply(lambda x: le.transform([x])[0] if pd.notna(x) else x)

        return df, le.classes_
    
    # source_df의 컬럼을 기준으로 target_df의 컬럼을 확장함
    def add_dataframe_to_dataframe_columns(self, target_df, source_df):
        return self.add_dataframe_columns(target_df, source_df.columns)
    
    # source_columns 컬럼을 기준으로 target_df에 컬럼을 추가함
    def add_dataframe_columns(self, target_df, source_columns):

        new_df = pd.DataFrame(columns=source_columns)

        for c in source_columns:
            if c in target_df.columns:
                new_df[c] = target_df[c]
            else:
                new_df[c] = [None] * len(target_df)

        return new_df

    # df_a에 없는 da_b 컬럼을 df_a로 컬럼과 데이터 복사.
    def add_columns_BtoA(self, df_a, df_b):

        # b의 열이 a에 없는 것을 찾기 위해 set을 사용합니다.
        diff_cols = list(set(df_b.columns) - set(df_a.columns))

        if diff_cols:
            # 차집합의 열과 값을 추가합니다.
            for col in diff_cols:
                df_a[col] = df_b[col]

        return df_a
