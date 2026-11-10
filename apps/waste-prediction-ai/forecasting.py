import pandas as pd

FEATURES = [
    "day_of_week",
    "working_day",
    "lag_7",
    "lag_14",
    "rolling_7_day_avg"
]


def forecast_next_7_days(model, history, calendar, as_of_date):

    as_of_date = pd.Timestamp(as_of_date).normalize()

    cal = calendar.set_index("date").sort_index()

    waste = (
        history.set_index("date")["collected_kg"]
        .sort_index()
        .copy()
    )

    last_known_date = waste.index.max()

    if as_of_date < last_known_date:
        raise ValueError("Forecast date is before the history ends.")

    all_dates = pd.date_range(
        last_known_date + pd.Timedelta(days=1),
        as_of_date + pd.Timedelta(days=7),
        freq="D"
    )

    missing_calendar = all_dates.difference(cal.index)

    if len(missing_calendar) > 0:
        raise ValueError(
            f"Calendar missing {len(missing_calendar)} required dates."
        )

    rows = []

    for date in all_dates:

        info = cal.loc[date]

        lag_7 = waste.loc[
            date - pd.Timedelta(days=7)
        ]

        lag_14 = waste.loc[
            date - pd.Timedelta(days=14)
        ]

        rolling_7 = waste.loc[
            date - pd.Timedelta(days=13):
            date - pd.Timedelta(days=7)
        ].mean()

        X_future = pd.DataFrame([{
            "day_of_week": int(info["day_of_week"]),
            "working_day": int(info["working_day"]),
            "lag_7": lag_7,
            "lag_14": lag_14,
            "rolling_7_day_avg": rolling_7
        }])[FEATURES]

        if int(info["working_day"]) == 0:
            predicted_kg = 0.0
        else:
            predicted_kg = max(
                0.0,
                float(model.predict(X_future)[0])
            )

        waste.loc[date] = predicted_kg

        rows.append({
            "date": date,
            "predicted_kg": round(predicted_kg, 1),
            "working_day": int(info["working_day"]),
            "record_type": "PREDICTED",
            "forecast_as_of": as_of_date
        })

    result = pd.DataFrame(rows)

    result = result[
        (result["date"] > as_of_date) &
        (result["date"] <= as_of_date + pd.Timedelta(days=7))
    ].copy()

    return result.reset_index(drop=True)
