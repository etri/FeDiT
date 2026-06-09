import pytorch_fid_wrapper as pfw
import torch
import io
import torchvision.transforms as transforms
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.cm as cm
from PIL import Image
from pyts.image import RecurrencePlot

"""
FID Score 계산
"""


class fid:
    WINDOW_SIZE = 24  # 과거 데이터 수 (값을 기준으로 예측)
    realImage = None
    fakeImage = None
    realData = None
    fakeData = None

    """
    초기화
    """

    def __init__(self, realImage, fakeImage) -> None:
        self.realImage = realImage
        self.fakeImage = fakeImage

    """
    초기화
    """

    def __init__(self, realData, fakeData, windowSize) -> None:
        self.realData = realData
        self.fakeData = fakeData
        self.WINDOW_SIZE = windowSize

    """
    데이터 설정
    """

    def setData(self, realImage, fakeImage):
        self.realImage = realImage
        self.fakeImage = fakeImage

    def preProcess(self):
        batch_size = 1
        img_chn = 3
        image_size = 128

        # x = torch.normal(0, 1, (batch_size, img_chn, image_size, image_size))
        # y = torch.normal(0.2, 0.8, (batch_size, img_chn, image_size, image_size))

        try:
            fake = Image.open("dt_data_api/data/fake.png").convert("RGB")
            real = Image.open("dt_data_api/data/fake_.png").convert("RGB")
            # real = Image.open('dt_data_api/data/real.png').convert('RGB')

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

    def exportScore(self):
        batch_size = 1

        try:
            fake = Image.open("dt_data_api/data/fake.png").convert("RGB")
            real = Image.open("dt_data_api/data/real.png").convert("RGB")

            to_tensor = transforms.ToTensor()
            tensorFake = to_tensor(fake)
            tensorFake = tensorFake.unsqueeze(0)
            tensorReal = to_tensor(real)
            tensorReal = tensorReal.unsqueeze(0)

            pfw.set_config(batch_size=batch_size, device="cpu")
            fid_score = pfw.fid(tensorFake, tensorReal)
            print(fid_score)
        except Exception as e:
            raise e
        return fid_score

    def recurrencePlot(self, s, eps=None, steps=None, size=0):
        if eps == None:
            eps = 0.01
        if steps == None:
            steps = 10
        N = s.size + size
        S = np.repeat(s[None, :], N, axis=0)
        Z = np.floor(np.abs(S - S.T) / eps)
        Z[Z > steps] = steps
        return Z

    # def createRecurrence(self, realData, fakeData):
    #    self.recurrencePlotImage(np.asarray(realData)[10:210], 'dt_data_api/data/real.png')
    #    self.recurrencePlotImage(np.ravel(fakeData)[0:200], 'dt_data_api/data/fake.png')
    #    self.exportScore()

    def createRecurrence(self, count):
        try:
            plt.figure(figsize=(6, 3))
            plt.plot(np.asarray(self.realData)[10 : count + 10], label="actual")
            plt.plot(np.ravel(self.fakeData)[0:count], label="prediction")
            plt.legend()
            # plt.show()
            plt.savefig("dt_data_api/data/real_fake.png", dpi=300)

            self.recurrencePlotImage(
                np.asarray(self.realData)[10 : count + 10], "dt_data_api/data/real.png"
            )
            self.recurrencePlotImage(
                np.ravel(self.fakeData)[0:count], "dt_data_api/data/fake.png"
            )
            result = self.exportScore()
        except Exception as e:
            raise e
        return result

    def createRecurrence2(self, outputs_cols, count):
        try:
            plt.figure(figsize=(12, 9))
            for col in outputs_cols:
                plt.plot(
                    np.asarray(self.realData[col])[
                        self.WINDOW_SIZE : count + self.WINDOW_SIZE
                    ],
                    marker="o",
                    label="actual-" + col,
                )
                plt.plot(
                    np.asarray(self.fakeData[col])[0:count],
                    marker="o",
                    label="prediction-" + col,
                )
            plt.legend()
            # plt.show()
            plt.savefig("dt_data_api/data/real_fake.png", dpi=300)

            self.recurrencePlotImage2(
                np.ravel(self.realData)[self.WINDOW_SIZE : count + self.WINDOW_SIZE],
                "dt_data_api/data/real.png",
            )
            self.recurrencePlotImage2(
                np.ravel(self.fakeData)[0:count], "dt_data_api/data/fake.png"
            )
            result = self.exportScore()
        except Exception as e:
            raise e
        return result

    def recurrencePlotImage(self, data, fileName):
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
            plt.imshow(self.recurrencePlot(data), origin="lower")
            # plt.imshow(self.recurrencePlot(data), cmap='binary', origin='lower')
            # plt.imshow(self.recurrencePlot(data), cmap='magma')
            # plt.show()
            plt.savefig(fileName, dpi=300)
        except Exception as e:
            raise e

    def recurrencePlotImage2(self, data, fileName):
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
            plt.imshow(self.recurrencePlot(data), origin="lower")
            # plt.imshow(self.recurrencePlot(data), cmap='binary', origin='lower')
            # plt.imshow(self.recurrencePlot(data), cmap='magma')
            # plt.show()
            plt.savefig(fileName, dpi=300)
        except Exception as e:
            raise e
