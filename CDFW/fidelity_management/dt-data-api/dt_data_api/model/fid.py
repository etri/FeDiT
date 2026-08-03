import pytorch_fid_wrapper as pfw
import torch
import os
import gc
import torchvision.transforms as transforms
import numpy as np
import pandas as pd
import matplotlib
import matplotlib.pyplot as plt
import matplotlib.cm as cm
from PIL import Image
from pyts.image import RecurrencePlot

from tensorflow.keras.callbacks import Callback
import numpy as np
from scipy import linalg
from dt_data_api.common.settings import MAIN_PATH

matplotlib.use("Agg")

"""
FID Score 계산
"""


class Manager:
    """
    FID Secore
    ---
    정확도 검증 FID Secore
    """

    WINDOW_SIZE = 24  # 과거 데이터 수 (값을 기준으로 예측)
    realImage = None
    fakeImage = None
    realData = None
    fakeData = None

    def __init__(self, realImage, fakeImage) -> None:
        """
        초기화
        Args:
            realImage(any): 원본 이미지
            fakeImage(any): 생성 이미지
        """
        self.realImage = realImage
        self.fakeImage = fakeImage

    def __init__(self, realData, fakeData, windowSize) -> None:
        """
        초기화
        Args:
            realData(any): 원본 데이터
            fakeData(any): 생성 데이터
            windowSize(any): 데이터 분할 수
        """
        self.realData = realData
        self.fakeData = fakeData
        self.WINDOW_SIZE = windowSize

    """
    데이터 설정
    """

    def setData(self, realImage, fakeImage):
        """
        원본 데이터 설정
        Args:
            realImage(any): 원본 이미지
            fakeImage(any): 생성 이미지
        """
        self.realImage = realImage
        self.fakeImage = fakeImage

    def exportScore(self, real_file, fake_file):
        """
        이미지를 비교하여 FID 스코어 산정
        Returns: FID 스코어
            fid_score
        """
        batch_size = 1

        try:
            # fake = Image.open('dt_data_api/data/fake.png').convert('RGB')
            # real = Image.open('dt_data_api/data/real.png').convert('RGB')
            fake = Image.open(fake_file).convert("RGB")
            real = Image.open(real_file).convert("RGB")

            to_tensor = transforms.ToTensor()
            tensorFake = to_tensor(fake)
            tensorFake = tensorFake.unsqueeze(0)
            tensorReal = to_tensor(real)
            tensorReal = tensorReal.unsqueeze(0)

            pfw.set_config(batch_size=batch_size, device="cpu")
            fid_score = pfw.fid(tensorFake, tensorReal)
            # print(fid_score)
        except Exception as e:
            raise e
        return fid_score

    def recurrencePlot(self, data, eps=None, steps=None, size=0):
        """
        Texture 데이터 생성
        """
        if eps == None:
            eps = 0.01
        if steps == None:
            steps = 10
        N = data.size + size
        S = np.repeat(data[None, :], N, axis=0)
        Z = np.floor(np.abs(S - S.T) / eps)
        Z[Z > steps] = steps
        return Z

    def recurrencePlotImage(self, data, fileName):
        """
        recurrence plot Image 생성
        Args:
            data(any): 데이터
            fileName(any): 이미지 생성 파일명
        """
        try:
            img = np.random.normal(0, 10, (300, 300))
            height, width = img.shape
            figsize = (
                (1.0, height / width) if height >= width else (width / height, 1.0)
            )
            plt.figure(figsize=figsize)
            # plt.axis('off'), plt.xticks([]), plt.yticks([])
            plt.tight_layout()
            plt.subplots_adjust(left=0, bottom=0, right=1, top=1, hspace=0, wspace=0)
            # Texture 데이터 적용
            plt.imshow(self.recurrencePlot(data), origin="lower")
            # plt.imshow(self.recurrencePlot(data), cmap='binary', origin='lower')
            # plt.imshow(self.recurrencePlot(data), cmap='magma')
            # plt.show()
            plt.savefig(fileName, dpi=300)
            plt.close()
            plt.clf()
        except Exception as e:
            raise e

    def createRecurrence(
        self, outputs_cols, data_size, real_file=None, fake_file=None, real_fake=None
    ):
        """
        recurrence plot Image 생성 및 FID Secore 산정
        Args:
            outputs_cols(any): 항목 수
            data_size(any): 데이터 크기
            file_count(any): 파일번호
            filepath(any): 저장경로
        Returns: FID 스코어
            result
        """
        try:
            # real_fake = os.path.join(filepath, f'real_fake_{file_count+1:02d}.png')
            # real_file = os.path.join(filepath, f'real_{file_count+1:02d}.png')
            # fake_file = os.path.join(filepath, f'fake_{file_count+1:02d}.png')

            # 원본데이터와 생성데이터 비교 차트 생성 (원본데이터는 데이터 분할 수 만큼 앞으로 이동)
            plt.figure(figsize=(12, 9))
            for col in outputs_cols:
                plt.plot(
                    np.asarray(self.fakeData[col])[0:data_size],
                    label="prediction" + col,
                )
                plt.plot(
                    np.asarray(self.realData[col])[
                        self.WINDOW_SIZE : data_size + self.WINDOW_SIZE
                    ],
                    label="actual" + col,
                )
            plt.legend()
            # plt.show()
            # plt.savefig(f'dt_data_api/data/real_fake.png', dpi=300)
            plt.savefig(real_fake, dpi=300)

            # 원본데이터와 생성데이터 비교 차트 생성 (원본데이터는 데이터 분할 수 만큼 앞으로 이동)
            # self.recurrencePlotImage(np.ravel(self.realData)[self.WINDOW_SIZE:data_size + self.WINDOW_SIZE], f'dt_data_api/data/real.png')
            # self.recurrencePlotImage(np.ravel(self.fakeData)[0:data_size], f'dt_data_api/data/fake.png')
            self.recurrencePlotImage(
                np.ravel(self.realData)[
                    self.WINDOW_SIZE : data_size + self.WINDOW_SIZE
                ],
                real_file,
            )
            self.recurrencePlotImage(np.ravel(self.fakeData)[0:data_size], fake_file)

            # FID Secore 산정
            result = self.exportScore(real_file, fake_file)

            plt.close()
            plt.clf()
        except Exception as e:
            print("Error in createRecurrence: ", e)
            raise e
        return result

    def createRecurrence2(
        self, outputs_cols, count, dt_2018, dt_2019, dt_2020, dt_2022
    ):
        """
        recurrence plot Image 생성 및 FID Secore 산정 (다중 데이터 비교시 사용)
        """
        try:
            # 원본데이터와 생성데이터 비교 차트 생성 (원본데이터는 데이터 분할 수 만큼 앞으로 이동)
            plt.figure(figsize=(12, 9))
            for col in outputs_cols:
                plt.plot(
                    np.asarray(dt_2022[col])[
                        self.WINDOW_SIZE : count + self.WINDOW_SIZE
                    ],
                    label="2022-" + col,
                )
                plt.plot(
                    np.asarray(self.fakeData[col])[0:count], label="prediction-" + col
                )
                plt.plot(
                    np.asarray(self.realData[col])[
                        self.WINDOW_SIZE : count + self.WINDOW_SIZE
                    ],
                    label="actual-" + col,
                )
                # plt.plot(np.asarray(dt_2018[col])[self.WINDOW_SIZE:count + self.WINDOW_SIZE], label='2018-' + col)
                # plt.plot(np.asarray(dt_2019[col])[self.WINDOW_SIZE:count + self.WINDOW_SIZE], label='2019-' + col)
                # plt.plot(np.asarray(dt_2020[col])[self.WINDOW_SIZE:count + self.WINDOW_SIZE], label='2020-' + col)

            plt.legend()
            # plt.show()
            plt.savefig("dt_data_api/data/real_fake.png", dpi=300)

            # 원본데이터와 생성데이터 비교 차트 생성 (원본데이터는 데이터 분할 수 만큼 앞으로 이동)
            self.recurrencePlotImage(
                np.ravel(self.realData)[self.WINDOW_SIZE : count + self.WINDOW_SIZE],
                "dt_data_api/data/real.png",
            )
            self.recurrencePlotImage(
                np.ravel(self.fakeData)[0:count], "dt_data_api/data/fake.png"
            )

            # FID Secore 산정
            result = self.exportScore()
        except Exception as e:
            raise e
        return result

    def preProcess(self):
        """
        이미지 비교 (샘플)
        """
        batch_size = 1
        img_chn = 3
        image_size = 128

        # x = torch.normal(0, 1, (batch_size, img_chn, image_size, image_size))
        # y = torch.normal(0.2, 0.8, (batch_size, img_chn, image_size, image_size))

        try:
            fake = Image.open("dt_data_api/data/fake.png").convert("RGB")
            # real = Image.open('dt_data_api/data/fake_.png').convert('RGB')
            real = Image.open("dt_data_api/data/real.png").convert("RGB")

            to_tensor = transforms.ToTensor()
            tensorFake = to_tensor(fake)
            tensorFake = tensorFake.unsqueeze(0)
            tensorReal = to_tensor(real)
            tensorReal = tensorReal.unsqueeze(0)

            # fake1 = []
            # real1 = []
            # fake1.append(tensorFake)
            # real1.append(tensorReal)

            pfw.set_config(batch_size=batch_size, device="cpu")
            # fid_score = pfw.fid(x, y)
            fid_score = pfw.fid(tensorFake, tensorReal)
            # fid_score = pfw.fid(fake1, real1)
            print(fid_score)
        except Exception as e:
            raise e
        return None

    '''
    def calculate_fid_score(real_data, generated_data):
        """
        두 개의 시계열 데이터 집합 간의 Frechet Inception Distance(FID) 점수를 계산합니다.
        """
        real_mean = np.mean(real_data, axis=0)
        real_cov = np.cov(real_data, rowvar=False)
        generated_mean = np.mean(generated_data, axis=0)
        generated_cov = np.cov(generated_data, rowvar=False)

        # real_cov * generated_cov의 행렬 제곱근(sqrt)을 계산합니다.
        sqrt_cov, _ = linalg.sqrtm(real_cov @ generated_cov, disp=False)

        # sqrt_cov 행렬의 복소수 값을 실수 값으로 대체합니다.
        if np.iscomplexobj(sqrt_cov):
            sqrt_cov = sqrt_cov.real

        # FID 점수를 계산합니다.
        fid = np.sum((real_mean - generated_mean)**2) + np.trace(real_cov + generated_cov - 2*sqrt_cov)

        return fid
    '''


class FIDCallback(Callback):
    """
    FID Secore Callback
    ---
    학습 중간 값 추출
    """

    def __init__(
        self,
        generator,
        epochs_to_fid,
        real_data,
        test_data,
        window_size,
        output_cols,
        filepath,
        data_size,
    ):
        super(FIDCallback, self).__init__()
        self.generator = generator
        self.epochs_to_fid = epochs_to_fid
        self.window_size = window_size
        self.real_data = real_data
        self.test_data = test_data
        self.output_cols = output_cols
        self.fid_scores = []
        self.filepath = filepath
        self.data_size = data_size

    def on_epoch_end(self, epoch, logs=None):
        if epoch % self.epochs_to_fid == 0:
            # fake_data = self.generator.predict(np.random.normal(size=(len(self.test_data), self.generator.input_shape[-1])))
            # fid_score = Manager.calculate_fid_score(self.test_data, fake_data)
            # print(f'FID Score after epoch {epoch}: {fid_score}')
            # self.fid_scores.append(fid_score)

            y_pred = self.generator.predict(self.test_data)
            # print(f'Epoch {epoch+1} - Predictions: {y_pred}')

            # 결과데이터 변환
            output_df = pd.DataFrame(columns=self.output_cols)
            for i in range(len(self.output_cols)):
                output_df[self.output_cols[i]] = y_pred[:, i]

            # FID Score
            real_fake = os.path.join(self.filepath, f"real_fake_{epoch + 1:02d}.png")
            real_file = os.path.join(self.filepath, f"real_{epoch + 1:02d}.png")
            fake_file = os.path.join(self.filepath, f"fake_{epoch + 1:02d}.png")

            f = Manager(
                realData=self.real_data,
                fakeData=output_df[self.output_cols],
                windowSize=self.window_size,
            )
            result = f.createRecurrence(
                self.output_cols,
                data_size=self.data_size,
                real_file=real_file,
                fake_file=fake_file,
                real_fake=real_fake,
            )
            self.fid_scores.append(
                [
                    epoch + 1,
                    result,
                    real_file.replace(MAIN_PATH, ""),
                    fake_file.replace(MAIN_PATH, ""),
                    real_fake.replace(MAIN_PATH, ""),
                ]
            )
            print(result)

            gc.collect()
