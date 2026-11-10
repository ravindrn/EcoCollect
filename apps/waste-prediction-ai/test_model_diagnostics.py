
import pandas as pd
import numpy as np
from monthly.evaluation import rolling_test

df = pd.read_csv("data/monthly_loads.csv", parse_dates=["month"])
df = df[df["status"] == "confirmed"]
df = df.sort_values("month").reset_index(drop=True)

results = rolling_test(df)

# Show predictions that are missing, infinite, or negative
bad = results[
    results["pred"].isna()
    | ~np.isfinite(results["pred"])
    | (results["pred"] < 0)
]

print("\nINVALID MODEL PREDICTIONS")

if bad.empty:
    print("No invalid predictions found")
else:
    print(
        bad[
            ["series", "month", "method", "actual", "pred", "error"]
        ].to_string(index=False)
    )
