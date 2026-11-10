
import warnings
import pandas as pd

from statsmodels.tools.sm_exceptions import ConvergenceWarning
from monthly.methods import f_ses

df = pd.read_csv(
    "data/monthly_loads.csv",
    parse_dates=["month"]
)

df = df[df["status"] == "confirmed"]
df = df.sort_values("month").reset_index(drop=True)

for series in ["nondeg_loads", "deg_loads"]:
    values = df[series].to_numpy(float)

    for i in range(len(df)):
        if df["month"].iloc[i] < pd.Timestamp("2025-07-01"):
            continue

        month = df["month"].iloc[i].strftime("%Y-%m")

        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always", ConvergenceWarning)

            try:
                prediction = f_ses(values[:i])

                issues = [
                    str(w.message)
                    for w in caught
                    if issubclass(w.category, ConvergenceWarning)
                ]

                if issues:
                    print(
                        f"WARNING | {series} | {month} | "
                        f"prediction={prediction:.2f}"
                    )
                    for issue in issues:
                        print("Reason:", issue)

            except Exception as error:
                print(f"FAILED | {series} | {month} | {error}")
