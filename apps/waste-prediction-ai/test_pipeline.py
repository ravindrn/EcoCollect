
import pandas as pd

from monthly.pipeline import run_monthly_pipeline


df = pd.read_csv(
    "data/monthly_loads.csv"
)

result = run_monthly_pipeline(df)

print("\nMODEL COMPARISON")
print(result["scores"].to_string(index=False))

print("\nSELECTED METHODS")
print(result["decisions"].to_string(index=False))

print("\nNEXT MONTH FORECAST")
print(result["forecast"].to_string(index=False))
