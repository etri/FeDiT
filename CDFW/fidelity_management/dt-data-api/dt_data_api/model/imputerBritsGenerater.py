import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from .brits.model import BRITS
from .brits.plots import plot

class Manager:
    '''
    Brits (Bidirectional Recurrent Imputation for Time Series)
    ---
    Brits 통해 결측값 채움
    '''
    #원본데이터
    data = pd.DataFrame
    
    def __init__(self, data=None) -> None:
        self.data = data
    
    def setData(self, data=None):
        '''
        원본 데이터 설정
        Args:
            data(pandas.DataFrame): 원본 데이터
        '''
        self.data = data
    
    def britsImputer(self):
        '''
        britsImputer 결측값 보간
        Returns: 결측값을 값을 채운 데이터
            data
        '''
        try:
            # Generate some time series
            N = 2000
            t = np.linspace(0, 1, N)
            e = np.random.multivariate_normal(mean=np.zeros(2), cov=np.eye(2), size=N)
            a = 40 + 20 * np.cos(2 * np.pi * (10 * t - 0.5)) + e[:, 0]
            b = 60 + 30 * np.cos(2 * np.pi * (20 * t - 0.5)) + e[:, 1]
            x = np.hstack([a.reshape(- 1, 1), b.reshape(- 1, 1)])

            # Add some missing values
            for i in range(10):
                a = np.random.randint(low=200, high=N - 200, size=2)
                b = np.random.randint(low=5, high=50, size=2)
                for j in range(2):
                    x[a[j]: a[j] + b[j], j] = np.nan
            
            print(x.shape)
            x = np.array(self.data)
            #return None

            # Fit the model
            model = BRITS(
                x=x,
                #units=100,
                units=14,
                #timesteps=200
                timesteps=12
            )

            model.fit(
                learning_rate=0.001,
                batch_size=16,
                epochs=300,
                verbose=True
            )

            # Impute the missing values
            x_hat = model.impute(x=x)
            print(x)
            print(x_hat)
            
            # Plot the imputations
            fig = plot(actual=x, imputed=x_hat)
            print('------------------A')
            fig.write_image('dt_data_api/data/birts_results.png', scale=4, height=900, width=700)
            print('------------------B')
            
            self.data = x_hat

        except Exception as e:
            raise e
        return self.data   
    