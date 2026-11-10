
import pandas as pd

from database import get_engine
from freshness import check_history_freshness


def main():

    engine = get_engine()

    try:
        history = pd.read_sql(
            """
            SELECT date, collected_kg
            FROM daily_collection_history
            ORDER BY date
            """,
            engine,
            parse_dates=["date"]
        )

        calendar = pd.read_sql(
            """
            SELECT date, working_day
            FROM collection_calendar
            ORDER BY date
            """,
            engine,
            parse_dates=["date"]
        )

    finally:
        engine.dispose()

    result = check_history_freshness(
        history=history,
        calendar=calendar,
        as_of_date="2026-11-06",
        max_missing_working_days=1
    )

    print("\nHISTORY FRESHNESS RESULT")

    for key, value in result.items():
        print(f"{key}: {value}")

    assert result["is_fresh"] is False, (
        "Expected the October history to be stale"
    )

    print("\nPASS: Stale history detected")


if __name__ == "__main__":
    main()
