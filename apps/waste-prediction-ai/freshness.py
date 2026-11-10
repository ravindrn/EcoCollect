
import pandas as pd


def check_history_freshness(
    history,
    calendar,
    as_of_date,
    max_missing_working_days=1
):
    """
    Check how many scheduled collection days
    have passed since the last history record.

    This checks freshness only; it does not
    verify whether the data is real or synthetic.
    """

    if history.empty:
        raise ValueError("Historical data is empty")

    if calendar.empty:
        raise ValueError("Calendar data is empty")

    last_date = pd.Timestamp(
        history["date"].max()
    ).normalize()

    forecast_date = pd.Timestamp(
        as_of_date
    ).normalize()

    if last_date > forecast_date:
        raise ValueError(
            "History contains dates after forecast date"
        )

    dates = pd.to_datetime(calendar["date"])

    missing_period = calendar.loc[
        (dates > last_date)
        & (dates < forecast_date)
    ].copy()

    # Ensure every elapsed date is represented
    expected_dates = pd.date_range(
        start=last_date + pd.Timedelta(days=1),
        end=forecast_date - pd.Timedelta(days=1),
        freq="D"
    )

    available_dates = pd.DatetimeIndex(
        pd.to_datetime(missing_period["date"])
    ).normalize()

    if len(expected_dates.difference(available_dates)) > 0:
        raise ValueError(
            "Calendar is missing dates needed "
            "for freshness validation"
        )

    if (
        not missing_period["working_day"]
        .isin([0, 1]).all()
    ):
        raise ValueError(
            "Invalid working_day values"
        )

    missed_working_days = int(
        missing_period["working_day"].sum()
    )

    return {
        "last_history_date": last_date.strftime("%Y-%m-%d"),
        "forecast_as_of": forecast_date.strftime("%Y-%m-%d"),
        "missed_working_days": missed_working_days,
        "is_fresh": (
            missed_working_days <= max_missing_working_days
        )
    }
