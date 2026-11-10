# Waste Prediction AI — Database Mapping

**Project:** Bope-Poddala Waste Prediction AI  
**Backend:** Python + FastAPI  
**Database:** PostgreSQL  
**Status:** Local database mapping established; shared-system schema mapping pending

## 1. Purpose

This document describes how the Waste Prediction AI module maps its required data to the existing local PostgreSQL tables.

PostgreSQL integration has been implemented and tested in the local AI prototype.

The team's main waste management system database must be reviewed separately before final integration.

## 2. Daily Waste Forecasting

**AI input requirements:**

- `date` — Collection date
- `collected_kg` — Collected waste quantity in kilograms

**Local PostgreSQL source:**

- Table: `daily_collection_history`
- Logical date field: `date`
- Logical quantity field: `collected_kg`

**Purpose:**

Stores historical daily collection records used by the forecasting module.

Important considerations:

- Daily forecasting currently relies mainly on synthetic records.
- Seven actual council audit measurements were incorporated into the local dataset.
- Actual and synthetic records must remain distinguishable.
- Real operational data is required for reliable model validation.

Exact physical column names and data-provenance fields must be verified against the current database schema.

## 3. Collection Calendar

**AI input requirements:**

- `date`
- `working_day`

**Local PostgreSQL source:**

- Table: `collection_calendar`
- Logical date field: `date`
- Logical collection-day indicator: `working_day`

**Purpose:**

Provides working-day and non-working-day information for future forecast dates.

Requirements:

- Future calendar dates must be available.
- Weekends, public holidays and Poya days must follow the council collection schedule.
- Calendar dates must not be duplicated.
- Schedule changes must be reflected in future records.

## 4. Monthly Category Forecasting

**AI input requirements:**

- `month`
- `nondeg_loads`
- `deg_loads`
- `status`

**Local PostgreSQL source:**

- Table: `monthly_waste_loads`

**Purpose:**

Stores historical monthly collection-load records for degradable and non-degradable waste categories.

Requirements:

- One record per month.
- No negative collection loads.
- Only eligible confirmed records should be used for operational forecasting.
- Monthly data must be maintained and updated.

**Important:** Monthly loads are not kilograms.

Exact physical column names must be verified against the database schema.

## 5. Daily Forecast Storage

**Local PostgreSQL tables:**

- `forecast_runs`
- `waste_predictions`

### `forecast_runs`

Stores information associated with a daily forecast execution.

Relevant logical information includes:

- Forecast run identifier
- Forecast reference date
- Model version
- Forecast creation timestamp
- Data provenance, where stored

### `waste_predictions`

Stores predicted daily waste quantities associated with forecast runs.

Relevant logical information includes:

- Forecast run identifier
- Predicted collection date
- Predicted waste quantity in kilograms
- Working-day indicator

**Relationship:** A daily forecast run can have multiple prediction records.

The local implementation supports avoiding duplicate forecast runs for the same reference date.

Exact keys, constraints and physical column names require schema verification.

## 6. Monthly Forecast Storage

**Local PostgreSQL tables:**

- `monthly_forecast_runs`
- `monthly_forecast_predictions`

### `monthly_forecast_runs`

Stores information associated with monthly forecasting executions.

### `monthly_forecast_predictions`

Stores monthly category forecast results.

Relevant logical information includes:

- Forecast month
- Waste category
- Predicted collection loads
- Selected forecasting method
- Forecast run association

Exact stored metadata and relationships require verification against the current schema.

## 7. Historical Record Replacement Tracking

**Local PostgreSQL table:**

`daily_collection_history_replacements`

**Purpose:**

Supports traceability when verified actual daily records replace previously stored synthetic values.

Requirements:

- Protect verified actual measurements.
- Preserve replacement history where applicable.
- Avoid unauthorized overwrites.
- Maintain clear data provenance.

## 8. Application-to-Database Mapping

| Application component | Database usage |
|---|---|
| `database.py` | Creates PostgreSQL connection engine |
| `save_forecast.py` | Reads daily history/calendar and saves daily forecasts |
| `save_monthly_forecast.py` | Reads monthly collection records and saves monthly forecasts |
| `forecast_api.py` | Retrieves saved forecasts for API responses |
| `import_history.py` | Historical data import utility |
| `import_actual_data.py` | Actual council audit data import utility |

## 9. Integration with Main Waste Management System

The local AI database schema should not automatically be assumed to match the team's main system database.

Before integration:

1. Review the existing shared PostgreSQL schema.
2. Identify the source tables for daily waste records.
3. Confirm availability and meaning of collected-weight fields.
4. Confirm the collection calendar source.
5. Identify the source of monthly category collection records.
6. Decide whether AI prediction tables will be shared or isolated.
7. Agree on API access and database permissions.
8. Validate field mappings and data types.

The preferred integration approach is for the TypeScript backend to consume the FastAPI forecasting endpoints, while database ownership and access are agreed with the integration team.

## 10. Integration Rules

1. Do not modify existing shared-system tables without team approval.
2. Keep forecasting logic separate from database access logic.
3. Validate incoming data before prediction.
4. Never treat synthetic data as verified actual measurements.
5. Do not store database passwords in source code.
6. Preserve forecast metadata and traceability.
7. Maintain consistent measurement units.
8. Verify schema changes and migrations before deployment.

## 11. Current Status

### Implemented locally

- PostgreSQL connectivity
- Historical daily collection data storage
- Collection calendar storage
- Monthly collection records storage
- Daily forecast persistence
- Monthly forecast persistence
- Database-backed forecast retrieval
- Historical record replacement tracking

### Pending

- Verification of all physical columns and constraints
- Shared-system database mapping
- Production database access permissions
- Final integration with the TypeScript backend
- Deployment migration and database initialization process

---

**Document status:** Updated local mapping draft. Final schema mapping requires database inspection and agreement with the main backend team.