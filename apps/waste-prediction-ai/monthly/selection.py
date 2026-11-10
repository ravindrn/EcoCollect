
import pandas as pd

MARGIN = 0.05
MIN_TEST_MONTHS = 12


def choose_method(scores, series, default="naive"):

    # Take scores for one waste category
    g = scores[
        scores["series"] == series
    ].set_index("method")

    if default not in g.index:
        raise ValueError(f"Missing Naive baseline for {series}")

    base_mae = float(g.loc[default, "MAE_loads"])
    base_months = int(g.loc[default, "test_months"])

    # Naive is the default method
    best_name = default
    best_mae = base_mae

    for name, row in g.iterrows():

        if name == default:
            continue

        # Require at least 12 tested months
        if int(row["test_months"]) < MIN_TEST_MONTHS:
            continue

        # Compare methods on the same number of test months
        if int(row["test_months"]) != base_months:
            continue

        candidate_mae = float(row["MAE_loads"])

        # Require at least 5% improvement over Naive
        if (
            candidate_mae <= base_mae * (1 - MARGIN)
            and candidate_mae < best_mae
        ):
            best_name = name
            best_mae = candidate_mae

    reason = (
        "Naive retained: no eligible method beat it by 5%"
        if best_name == default
        else f"{best_name} met the 5% improvement rule"
    )

    return {
        "series": series,
        "chosen": best_name,
        "MAE_loads": round(best_mae, 2),
        "reason": reason
    }


def select_models(scores):

    decisions = [
        choose_method(scores, "nondeg_loads"),
        choose_method(scores, "deg_loads")
    ]

    return pd.DataFrame(decisions)
