
import pandas as pd
from sqlalchemy import text

from database import get_engine


# 1. Read daily history
daily = pd.read_csv(
    "data/history.csv",
    parse_dates=["date"]
)

daily = daily[["date", "collected_kg"]].copy()
daily["source_type"] = "synthetic"


# 2. Read collection calendar
calendar = pd.read_csv(
    "data/calendar.csv",
    parse_dates=["date"]
)

calendar = calendar[["date", "working_day"]].copy()


# 3. Read monthly category data
monthly = pd.read_csv("data/monthly_loads.csv")
monthly = monthly[
    ["month", "nondeg_loads", "deg_loads", "status"]
].copy()

monthly["month"] = (
    pd.to_datetime(monthly["month"])
    .dt.to_period("M")
    .dt.to_timestamp()
)


# 4. Connect to PostgreSQL
engine = get_engine()


# 5. Import using a transaction
with engine.begin() as connection:

    # Ensure destination tables are empty
    for table in [
        "daily_collection_history",
        "collection_calendar",
        "monthly_waste_loads"
    ]:
        count = connection.execute(
            text(f"SELECT COUNT(*) FROM {table}")
        ).scalar_one()

        if count > 0:
            raise RuntimeError(
                f"{table} already contains {count} rows. "
                "Import cancelled to prevent duplicates."
            )

    # Insert CSV records into existing tables
    daily.to_sql(
        "daily_collection_history",
        connection,
        if_exists="append",
        index=False
    )

    calendar.to_sql(
        "collection_calendar",
        connection,
        if_exists="append",
        index=False
    )

    monthly.to_sql(
        "monthly_waste_loads",
        connection,
        if_exists="append",
        index=False
    )


print("PASS: Historical waste data imported")

print("Daily records:", len(daily))
print("Calendar records:", len(calendar))
print("Monthly records:", len(monthly))

engine.dispose()
