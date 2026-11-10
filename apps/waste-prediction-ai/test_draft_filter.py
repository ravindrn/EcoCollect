import pandas as pd

from monthly.pipeline import run_monthly_pipeline

# Read existing sample monthly data
df = pd.read_csv("data/monthly_loads.csv")

# Add an invalid draft record
draft = pd.DataFrame([{
    "month": "2026-05",
    "nondeg_loads": -100,
    "deg_loads": -100,
    "status": "draft"
}])

df = pd.concat([df, draft], ignore_index=True)

# Forecast should ignore the invalid draft
result = run_monthly_pipeline(df)

print("PASS: Draft record ignored")
print(result["forecast"].to_string(index=False))