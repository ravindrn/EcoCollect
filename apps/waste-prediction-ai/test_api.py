
from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


def test_daily_forecast():

    response = client.get(
        "/predict/next-7-days",
        params={"as_of_date": "2026-11-05"}
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert len(data["predictions"]) == 7

    assert data["model_version"] == "rf_v1"

    for item in data["predictions"]:
        assert item["predicted_kg"] >= 0

    print("PASS: Daily forecast API")


def test_monthly_forecast():

    response = client.get(
        "/predict/next-month-categories"
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert "predictions" in data
    assert "scores" in data
    assert "selected_methods" in data

    print("PASS: Monthly forecast API")


def test_invalid_daily_date():

    response = client.get(
        "/predict/next-7-days",
        params={"as_of_date": "2025-06-15"}
    )

    assert response.status_code == 400, response.text

    print("PASS: Invalid historical date rejected")


def test_missing_daily_date():

    response = client.get(
        "/predict/next-7-days"
    )

    assert response.status_code == 422, response.text

    print("PASS: Missing required date rejected")


if __name__ == "__main__":

    with client:
        test_daily_forecast()
        test_monthly_forecast()
        test_invalid_daily_date()
        test_missing_daily_date()

    print("\nALL API REGRESSION TESTS PASSED")
