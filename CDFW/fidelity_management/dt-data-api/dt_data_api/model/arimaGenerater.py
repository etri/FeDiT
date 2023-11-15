import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib
import matplotlib.pyplot as plt
#from statsmodels.tsa.arima_model import ARIMA
import statsmodels.api as sm
from statsmodels.graphics.tsaplots import plot_acf
from statsmodels.stats.diagnostic import acorr_ljungbox
import scipy.stats as scs
import pmdarima as pm

# 정상성 확인
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf, acf, pacf
from statsmodels.tsa.stattools import adfuller, kpss

from sklearn.metrics import mean_squared_error

matplotlib.use('TkAgg')

class Manager:
    '''
    ARIMA 모델학습
    ---
    학습모델 생성
    '''    
    def __init__(self) -> None:
        pass

    # ADF (Augmented Dickey Fuller) 검정
    def adf_test(self, x) :
        indices = ['Test Statistics', 'p-value', '# of Lags Used', '# of Observations Used']

        # AIC = 고려된 지연 수(lags)를 AIC(Akaike Information Criterion) 기반 자동 선택
        adf_test = adfuller(x, autolag = 'AIC')
        results = pd.Series(adf_test[0:4], index = indices)

        for key, value in adf_test[4].items() :
            results[f'Critical Value ({key})'] = value

        return results

    # KPSS (Kwiatkowski-Phillips-Schmidt-Shin) 검정
    # c = 시계열이 level 정상성이라는 귀무가설
    # ct = 시게열이 trend 정상성이라는 귀무가설 (계열에서 trend를 제거하면 level 정상성이 됨)
    def kpss_test(self, x, h0_type = 'c') :
        indices = ['Test Statistics', 'p-value', '# of Lags Used']
        kpss_test = kpss(x, regression = h0_type)
        results = pd.Series(kpss_test[0:3], index = indices)

        for key, value in kpss_test[3].items() :
            results[f'Critical Value ({key})'] = value
        
        return results

    # 통합
    def test_autocorrelation(self, x, n_lags=40, alpha=0.05, h0_type='c'):
        adf_results = self.adf_test(x)
        kpss_results = self.kpss_test(x, h0_type=h0_type)

        print('ADF test statistic: {:.2f} (p-val: {:.2f})'.format(adf_results['Test Statistics'],
                                                                adf_results['p-value']))
        print('KPSS test statistic: {:.2f} (p-val: {:.2f})'.format(kpss_results['Test Statistics'],
                                                                kpss_results['p-value']))

        fig, ax = plt.subplots(2, figsize=(16, 8))
        plot_acf(x, ax=ax[0], lags=n_lags, alpha=alpha)
        plot_pacf(x, ax=ax[1], lags=n_lags, alpha=alpha)
        plt.show()
    
    def test_diff(self, x):
        diff = x.diff().dropna()

        fig, ax = plt.subplots(2, sharex=True)
        x.plot(title = "Google's stock price", ax=ax[0])
        diff.plot(ax=ax[1], title='First Differences')

        plt.tight_layout()
        plt.show()        
    
    def test_modelSummary(self, x):
        arima = sm.tsa.arima.ARIMA(x, order=(2,1,1)).fit()
        print(arima.summary())
    
    # Diagnosing the fit of the model based on its residual
    def arima_diagnostics(self, resids, n_lags=40):
        resids = resids.diff().dropna()

        # create placeholder subplots
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2)

        r = resids
        resids = (r - np.nanmean(r)) / np.nanstd(r)
        resids_nonmissing = resids[~(np.isnan(resids))]
        
        # residuals over time
        sns.lineplot(x=np.arange(len(resids)), y=resids, ax=ax1)
        ax1.set_title('Standardized residuals')

        # distribution of residuals
        x_lim = (-1.96 * 2, 1.96 * 2)
        r_range = np.linspace(x_lim[0], x_lim[1])
        norm_pdf = scs.norm.pdf(r_range)
        
        sns.distplot(resids_nonmissing, hist=True, kde=True, 
                    norm_hist=True, ax=ax2)
        ax2.plot(r_range, norm_pdf, 'g', lw=2, label='N(0,1)')
        ax2.set_title('Distribution of standardized residuals')
        ax2.set_xlim(x_lim)
        ax2.legend()
            
        # Q-Q plot
        qq = sm.qqplot(resids_nonmissing, line='s', ax=ax3)
        ax3.set_title('Q-Q plot')

        # ACF plot
        plot_acf(resids, ax=ax4, lags=n_lags, alpha=0.05)
        ax4.set_title('ACF plot')
        
        plt.show()
    
    def arima_acorr(self, x):
        arima = sm.tsa.arima.ARIMA(x, order=(2,1,1)).fit()
        print(arima.summary())

        print('-------------------A')
        print(arima.resid)
        ljung_box_results = acorr_ljungbox(arima.resid)
        print(ljung_box_results)
        print('-------------------B')

        fig, ax = plt.subplots(1, figsize=[16, 5])
        sns.scatterplot(x=range(len(ljung_box_results['lb_stat'])), 
                        y=ljung_box_results['lb_pvalue'], 
                        ax=ax)
        ax.axhline(0.05, ls='--', c='r')
        ax.set(title="Ljung-Box test's results",
            xlabel='Lag',
            ylabel='p-value')

        plt.tight_layout()
        plt.show()
    
    def auto_arima(self, x):
        # model = pm.auto_arima(x, 
        #                 error_action = 'ignore', 
        #                 suppress_warnings = True,
        #                 seasonal = False)
        
        model = pm.auto_arima(x,
                           error_action='ignore',
                           suppress_warnings=True,
                           seasonal=False,
                           stepwise=False,
                           approximation=False,
                           n_jobs=-1)
        
        print(model.summary())
    
    def arima_prediction(self, x):
        
        n_forecasts = len(x)
        
        arima = sm.tsa.arima.ARIMA(x, order=(2,1,1)).fit()
        #print(arima.summary())
        
        auto_arima = pm.auto_arima(x,
                           error_action='ignore',
                           suppress_warnings=True,
                           seasonal=False,
                           stepwise=False,
                           approximation=False,
                           n_jobs=-1)
        #print(arima.summary())
        
        #수동
        print('--------------A')
        arima_pred = arima.forecast(n_forecasts)
        print(arima_pred)
        print('--------------B')
        arima_pred = [pd.DataFrame(arima_pred[0], columns=['prediction']),
                      pd.DataFrame(arima_pred[2], columns=['ci_lower', 
                        'ci_upper'])]
        arima_pred = pd.concat(arima_pred, axis=1).set_index(x.index)
        
        #auto
        print(auto_arima.summary())
        auto_arima_pred = auto_arima.predict(n_periods=n_forecasts,
                                             return_conf_int=True, 
                                             alpha=0.05)
        aa = pd.DataFrame(auto_arima_pred[0], columns=['prediction'])
        bb = pd.DataFrame(auto_arima_pred[1], columns=['ci_lower', 'ci_upper'])
        aa['ci_lower'] = bb['ci_lower']
        aa['ci_upper'] = bb['ci_upper']
        auto_arima_pred = aa.set_index(x.index)

        #그래프
        ig, ax = plt.subplots(1)
        ax = sns.lineplot(data=x, color='red', label='Actual')

        ax.plot(arima_pred.prediction, c='blue', label='ARIMA(2,1,1)')
        ax.fill_between(arima_pred.index, arima_pred.ci_lower, arima_pred.ci_upper, alpha=0.3, facecolor='blue')

        ax.plot(auto_arima_pred.prediction, c='green', label='ARIMA(3,1,2)')
        ax.fill_between(auto_arima_pred.index, auto_arima_pred.ci_lower, auto_arima_pred.ci_upper, alpha=0.2, facecolor='green')

        ax.set(title="Google's stock price  - actual vs. predicted", xlabel='Date', ylabel='Price ($)')
        ax.legend(loc='upper left')

        plt.tight_layout()
        plt.show()

        pass


    def a_plot_ts(self, data, color, alpha, label):    
        plt.figure(figsize=(11,5))
        plt.plot(data, color=color, alpha=alpha, label=label)
        plt.title("Mean Temperature of Bindukuri")
        plt.ylabel('Mean temperature')
        plt.legend()
        plt.show()
    
    def a_ADF_test(self, data):
        # ADF 실시
        results = adfuller(data, autolag='AIC')
        
        # 통계량
        s = results[0]
        # p-value
        p = results[1]
        # 기각역
        cv = results[4]
        
        # 출력
        print('-'*30)
        print('Augemented Dickey-Fuller Test')
        print('H0 : 단위근이 존재한다 (비정상 시계열)')
        print('Ha : 단위근이 없다 (정상 시계열)')
        print('Critical Values : {}'.format(cv))
        print('-'*30)
        print('Test Statistics : {:.4f}'.format(s))
        print('p-value : {:.4f}'.format(p))
        print('-'*30)
    
    def a_plot_rolling(self, data, roll_size):
        # 이동평균함수(rolling) - 평균, 표준편차
        roll_mean = data.rolling(window=roll_size).mean()
        roll_std = data.rolling(window=roll_size).std()
        
        # 시각화
        plt.figure(figsize=(11,5))
        plt.plot(data, color='blue', alpha=0.25, label='Original')
        plt.plot(roll_mean, color='black', label='Rolling mean')
        plt.plot(roll_std, color='red', label='Rolling std')
        plt.title('Rolling Mean & Standard Deviation')
        plt.ylabel("Mean Temperature")
        plt.legend()
        plt.show()

    def a_ACF_PACF(self, data):
        # ACF
        acf_20 = acf(x=data, nlags=10)
        # PACF
        pacf_20 = pacf(x=data, nlags=10, method='ols')

        # 95% 신뢰구간 계산하기
        confidence = 1.96/np.sqrt(len(data))

        # 시각화
        plt.figure(figsize=(8,4))
        # ACF
        plt.subplot(1,2,1)
        plt.plot(acf_20)
        plt.axhline(y=0, linestyle='--', alpha=0.5)
        plt.axhline(y=-confidence, linestyle='--', alpha=0.5)
        plt.axhline(y=confidence, linestyle='--', alpha=0.5)
        plt.title('AutoCorrelation Function')
        # PACF
        plt.subplot(1,2,2)
        plt.plot(pacf_20)
        plt.axhline(y=0, linestyle='--', alpha=0.5)
        plt.axhline(y=-confidence, linestyle='--', alpha=0.5)
        plt.axhline(y=confidence, linestyle='--', alpha=0.5)
        plt.title('Partial AutoCorrelation Function')

        plt.tight_layout()
        plt.show()
    
    def a_ARIMA(self, data):
        # index를 period로 변환해주어야 warning이 뜨지 않음
        ts_copy = data.copy()
        #ts_copy.index = pd.DatetimeIndex(ts_copy.index).to_period('D')

        # 예측을 시작할 위치(이후 차분을 적용하기 때문에 맞추어주었음
        start_idx = ts_copy.index[1]

        # ARIMA(1,0,1)
        model1 = sm.tsa.arima.ARIMA(ts_copy, order=(1,0,1))
        # fit model
        model1_fit = model1.fit()

        # 전체에 대한 예측 실시
        forecast1 = model1_fit.predict(start=start_idx)

        self.a_plot_and_error(data[1:], forecast1)
        #print(forecast1)
    
    def a_plot_and_error(self, data, forecast):
        # MSE 계산
        mse = mean_squared_error(data, forecast)
        # 시각화
        plt.figure(figsize=(11,5))
        plt.plot(data, color='blue', alpha=0.25 , label='Original')
        plt.plot(forecast, color='red', label='predicted')
        plt.title("Time Series Forecast")
        plt.ylabel("Mean Temperature")
        plt.legend()
        plt.show()
        # MSE 출력
        print('Mean Squared Error : {:.4f}'.format(mse))
        