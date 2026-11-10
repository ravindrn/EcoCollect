
import numpy as np
from sklearn.linear_model import Ridge
from statsmodels.tsa.holtwinters import SimpleExpSmoothing
from statsmodels.tsa.arima.model import ARIMA


# 1. Naive forecasting
def f_naive(y):
    return float(y[-1])


# 2. Previous 3-month average
def f_mean3(y):
    return float(np.mean(y[-3:]))


# 3. Simple Exponential Smoothing
def f_ses(y):
    model = SimpleExpSmoothing(
        y,
        initialization_method="estimated"
    ).fit()

    return float(model.forecast(1)[0])


# 4. Ridge autoregression
def f_ar1(y):
    X = y[:-1].reshape(-1, 1)
    target = y[1:]

    model = Ridge(alpha=1.0)
    model.fit(X, target)

    return float(model.predict([[y[-1]]])[0])


# 5. ARIMA forecasting
def f_arima(y):
    model = ARIMA(
        y,
        order=(1, 0, 0)
    ).fit()

    return float(model.forecast(1)[0])


METHODS = {
    "naive": f_naive,
    "mean3": f_mean3,
    "SES": f_ses,
    "AR1_ridge": f_ar1,
    "ARIMA(1,0,0)": f_arima
}
