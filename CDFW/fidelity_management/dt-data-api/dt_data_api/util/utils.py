import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import tensorflow as tf
import matplotlib
import matplotlib.pyplot as plt
import shap

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
    
    def prepare_shap_analysis(self, data, model, window_size, n_features=2, columns=None, save_dir='shap_results', background=100):
        """
        SHAP 분석을 위한 데이터 준비 및 분석 수행
        Args:
            data: 분석할 데이터 (DataFrame, Dataset, numpy array 모두 가능)
            model: 훈련된 모델
            window_size: 윈도우 크기
            n_features: 특성 수 (기본값: 2)
            save_dir: 결과 저장 디렉토리 (기본값: 'shap_results')
            background: 배경 데이터 샘플 수 (기본값: 100)
        """
        def preprocess_for_shap(data, window_size):
            """
            SHAP 분석을 위한 데이터 전처리
            4차원 데이터 (batch, window_size, features, 1) 형태도 지원
            """


            # DataFrame을 numpy array로 변환
            if isinstance(data, pd.DataFrame):
                data = data.values
                
            if isinstance(data, tf.data.Dataset):
                # Dataset을 numpy 배열로 변환
                data_list = []
                for batch in data:
                    if isinstance(batch, tuple):
                        data_list.extend(batch[0].numpy())
                    else:
                        data_list.extend(batch.numpy())
                data = np.array(data_list)
            
            # numpy array가 아닌 경우 변환
            if not isinstance(data, np.ndarray):
                data = np.array(data)
            
            # 4차원 데이터 처리 (batch, window_size, features, 1)
            if len(data.shape) == 4:
                if data.shape[-1] == 1:  # 마지막 차원이 1인 경우
                    data = data.squeeze(axis=-1)  # 마지막 차원 제거
                else:
                    raise ValueError(f"Unexpected shape in last dimension: {data.shape}")
            
            # 차원 확인 및 조정
            if len(data.shape) == 1:  # 1D array
                data = data.reshape(-1, 1)
            
            # window_size에 맞게 데이터 재구성
            if len(data.shape) == 2:  # (samples, features)
                
                samples = data.shape[0]
                valid_samples = samples - window_size + 1
                print('디버그',data, samples, window_size)
                if valid_samples <= 0:
                    raise ValueError(f"Data length ({samples}) must be greater than window_size ({window_size})")
                
                windowed_data = np.array([
                    data[i:i+window_size] for i in range(valid_samples)
                ])
                return windowed_data
            elif len(data.shape) == 3:  # (samples, window_size, features)
                if data.shape[1] != window_size:
                    raise ValueError(f"Data window size ({data.shape[1]}) doesn't match specified window_size ({window_size})")
                return data
            else:
                raise ValueError(f"Unsupported data shape: {data.shape}")

        def predict_for_shap(data):
            batch_size = data.shape[0]
            data_reshaped = data.reshape(batch_size, window_size, n_features)
            return model.predict(data_reshaped).flatten()

        try:
            # 배경 데이터 준비
            n_background = background #min(background, len(data) if hasattr(data, '__len__') else sum(1 for _ in data))

            if isinstance(data, tf.data.Dataset):
                total_samples = sum(1 for _ in data)
                if total_samples < n_background:
                    n_background = total_samples

                for batch in data.take(1):
                    background_data = batch[0].numpy() if isinstance(batch, tuple) else batch.numpy()
            elif isinstance(data, pd.DataFrame):
                total_samples = len(data)
                if total_samples < n_background:
                    n_background = total_samples
                background_data = data.iloc[:n_background]
            else:  # numpy array 또는 기타 형식
                total_samples = len(data)
                if total_samples < n_background:
                    n_background = total_samples
                background_data = data[:n_background]

            # 배경 데이터 전처리
            background = preprocess_for_shap(background_data, window_size)
            
            # SHAP Explainer 생성
            background_2d = background.reshape(background.shape[0], -1)
            explainer = shap.KernelExplainer(predict_for_shap, background_2d)

            if isinstance(data, tf.data.Dataset):
                # Take a batch of samples from the dataset
                #data_list = []
                #for batch in data.take(n_samples_for_analysis):
                #    if isinstance(batch, tuple):
                #        data_list.extend(batch[0].numpy())
                #    else:
                #        data_list.extend(batch.numpy())
                #X_shap = np.array(data_list)
                for batch in data.take(1):
                    X_shap = batch[0].numpy() if isinstance(batch, tuple) else batch.numpy()                
            elif isinstance(data, pd.DataFrame):
                n_samples_for_analysis = min(n_background, len(data))  # or choose an appropriate sample size
                X_shap = data.iloc[:n_samples_for_analysis]
            else:  # for numpy arrays
                n_samples_for_analysis = min(n_background, len(data))  # or choose an appropriate sample size
                X_shap = data[:n_samples_for_analysis]

            X_shap = preprocess_for_shap(X_shap, window_size)
            X_shap_2d = X_shap.reshape(X_shap.shape[0], -1)

            # SHAP 값 계산
            shap_values = explainer.shap_values(X_shap_2d, nsamples=100)

            # 특성 이름 생성
            if columns:  # 사용자가 제공한 컬럼명을 사용
                feature_names = [f'{col}_time{i+1}' for i in range(window_size) for col in columns]
            elif isinstance(data, pd.DataFrame):  # DataFrame의 경우
                feature_names = [f'{col}_time{i+1}' for i in range(window_size) for col in data.columns[:n_features]]
            else:  # Default to generic feature names
                feature_names = [f'feature{j+1}_time{i+1}' for i in range(window_size) for j in range(n_features)]

            '''
            if isinstance(data, pd.DataFrame):
                # DataFrame의 컬럼명 활용
                feature_names = [f'{col}_time{i+1}' 
                            for i in range(window_size) 
                            for col in data.columns[:n_features]]
            else:
                feature_names = [f'feature{j+1}_time{i+1}' 
                            for i in range(window_size) 
                            for j in range(n_features)]
            '''

            # 저장된 파일 경로를 담을 리스트
            saved_plot_files = []

            
            # 시각화 및 저장
            plt.figure(figsize=(10, 6))
            shap.summary_plot(
                shap_values, 
                X_shap_2d,
                feature_names=feature_names,
                show=False
            )
            plt.tight_layout()
            
            # summary plot 저장
            for ext in ['png']:
                filepath = f'{save_dir}_shap_plot.{ext}'
                plt.savefig(filepath, 
                        dpi=300 if ext == 'png' else None,
                        format=ext, 
                        bbox_inches='tight')
                saved_plot_files.append(filepath)
            plt.close()


            #bar
            plt.figure(figsize=(10, 6))
            shap.summary_plot(
                shap_values, 
                X_shap_2d,
                feature_names=feature_names,
                show=False,
                plot_type='bar'
            )
            plt.tight_layout()
            
            # summary plot 저장
            for ext in ['png']:
                filepath = f'{save_dir}_shap_bar.{ext}'
                plt.savefig(filepath, 
                        dpi=300 if ext == 'png' else None,
                        format=ext, 
                        bbox_inches='tight')
                saved_plot_files.append(filepath)
            plt.close()


            # Waterfall plot
            plt.figure(figsize=(10, 6))
            shap.plots.waterfall(
                shap.Explanation(
                    values=shap_values[0],
                    base_values=explainer.expected_value,
                    data=X_shap_2d[0],
                    feature_names=feature_names
                )
            )
            plt.tight_layout()
            
            # waterfall plot 저장
            for ext in ['png']:
                filepath = f'{save_dir}_shap_waterfall.{ext}'
                plt.savefig(filepath,
                        dpi=300 if ext == 'png' else None,
                        format=ext,
                        bbox_inches='tight')
                saved_plot_files.append(filepath)
            plt.close()


            '''
            saved_waterfall_files = []
            # 시각화 및 저장
            plt.figure(figsize=(10, 6))
            shap.summary_plot(
                shap_values, 
                X_shap_2d,
                feature_names=feature_names,
                show=False
            )
            plt.tight_layout()
            
            # summary plot 저장
            for ext in ['png', 'pdf', 'svg']:
                filepath = f'{save_dir}_shap_plot.{ext}'
                plt.savefig(filepath, 
                        dpi=300 if ext == 'png' else None,
                        format=ext, 
                        bbox_inches='tight')
                saved_plot_files.append(filepath)
            plt.close()

            # Waterfall plot
            plt.figure(figsize=(10, 6))
            shap.plots.waterfall(
                shap.Explanation(
                    values=shap_values[0],
                    base_values=explainer.expected_value,
                    data=X_shap_2d[0],
                    feature_names=feature_names
                )
            )
            plt.tight_layout()
            
            # waterfall plot 저장
            for ext in ['png', 'pdf', 'svg']:
                filepath = f'{save_dir}_shap_waterfall.{ext}'
                plt.savefig(filepath,
                        dpi=300 if ext == 'png' else None,
                        format=ext,
                        bbox_inches='tight')
                saved_waterfall_files.append(filepath)
            plt.close()
            '''

            print(f"SHAP plots saved in directory: {save_dir}")
            print(f"Saved files: {saved_plot_files}")
            
            return shap_values, X_shap, saved_plot_files

        except Exception as e:
            print(f"SHAP 분석 중 오류 발생: {str(e)}")
            raise e
        
    
