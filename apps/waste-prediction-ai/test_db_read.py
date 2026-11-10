
import pandas as pd

from database import get_engine


def main():
    engine = get_engine()

    try:
        # Read daily waste history
        daily = pd.read_sql(
            """
            SELECT date, collected_kg
            FROM daily_collection_history
            ORDER BY date
            """,
            engine,
            parse_dates=["date"]
        )

        # Read future and historical calendar
        calendar = pd.read_sql(
            """
            SELECT date, working_day
            FROM collection_calendar
            ORDER BY date
            """,
            engine,
            parse_dates=["date"]
        )

        # Read confirmed monthly records
        monthly = pd.read_sql(
            """
            SELECT month, nondeg_loads, deg_loads, status
            FROM monthly_waste_loads
            WHERE status = 'confirmed'
            ORDER BY month
            """,
            engine,
            parse_dates=["month"]
        )

        print("\nDAILY HISTORY")
        print("Rows:", len(daily))
        print(daily.tail())

        print("\nCALENDAR")
        print("Rows:", len(calendar))
        print(calendar.tail())

        print("\nMONTHLY COLLECTIONS")
        print("Rows:", len(monthly))
        print(monthly.tail())

        print("\nDATE COVERAGE")
        for name, df, column in [
            ("Daily", daily, "date"),
            ("Calendar", calendar, "date"),
            ("Monthly", monthly, "month")
        ]:
            if df.empty:
                print(f"{name}: EMPTY")
            else:
                print(
                    f"{name}: "
                    f"{df[column].min().date()} "
                    f"to {df[column].max().date()}"
                )

    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
