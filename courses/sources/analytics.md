# Python Data Analytics: Zero to Enterprise

**Project:** Analytics Enterprise Studio: CSV/SQL ingestion, quality checks, reproducible Pandas transformations, KPIs, saved reports, visualizations and a lightweight dashboard. Offline exercises use tiny synthetic datasets, no paid cloud requirement. Executable starter under `../projects/analytics/`.

## 01 · What is data analytics?

Data = observations. Analytics turns records into decisions. A business asks "What changed, why, and what should we do?" Descriptive analytics *what happened*, diagnostic *why*, predictive *what may happen*, prescriptive *what action is worth testing*. Never confuse correlation with causation.

```text
Business Question → Source → Quality Check → Transformation → KPI → Visualization → Decision
```

**Lab:** Ask "Is revenue growing?" Define revenue in currency, accounting period, refunds treatment, timezone and whether to use order date or payment date. Without a data contract, dashboards can disagree.

## 02 · Python, virtualenv and data structures

Python variables hold values; lists group items; dicts map column names to records. `for`, `if`, functions and exceptions automate repetitive processing. A virtual environment isolates packages. Learn `Path`, `datetime` and logging before large data projects.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install pandas numpy matplotlib pytest
```

```python
sales=[{"amount":120},{"amount":80}]
assert sum(row["amount"] for row in sales)==200
```

**Lab:** Make `mean_amount()` function and define behavior for empty input. Distinguish reproducible code from manual spreadsheet edits.

## 03 · CSV, JSON, Excel, SQL and data types

A CSV is lines of values, but commas, quotes, encodings, decimals and dates can be tricky. CSV has no built-in schema or reliable type metadata. Database adds SQL types, constraints and indexes. Choose types intentionally (integer order counts, decimal currency, timezone-aware timestamps).

```python
import pandas as pd
df=pd.read_csv("data/orders.csv",dtype={"order_id":"string"})
print(df.dtypes)
print(df.head())
```

**Lab:** Preserve leading zeros in IDs; parse dates with explicit formats. Inspect nulls and malformed rows. For money, prefer integer minor units or `Decimal` where precision matters.

## 04 · NumPy: arrays and vectorization

NumPy stores homogeneous arrays and applies operations efficiently. Vectorization reduces Python loops for numerical work. Broadcasting allows arrays with compatible shapes to combine. Shape mismatch and NaNs create subtle bugs.

```python
import numpy as np
prices=np.array([100,250,400])
quantities=np.array([2,1,3])
revenue=prices*quantities
print(revenue,revenue.sum())
```

**Lab:** Compute mean, median, percentiles. Explain why skewed income distributions make mean misleading.

## 05 · Pandas: Series, DataFrame, indexing

DataFrame tabular structure hai, where rows observations and columns fields. `loc` selects labels; `iloc` selects positions. Use explicit column assignment rather than chained assignment. Avoid assuming every string is clean.

```python
df["net_amount"] = df["quantity"] * df["unit_price"] - df["discount"]
paid = df.loc[df["status"].eq("paid"), ["order_id","net_amount"]]
```

**Lab:** Filter paid orders and sort by `net_amount`. Verify row count before and after filtering.

## 06 · Data cleaning and validation

Missing values, duplicates, invalid dates, negative prices, inconsistent category labels and wrong currencies can wreck KPIs. Define a contract first: mandatory columns, type checks, unique business IDs, acceptable range and rejection rules. Keep raw input immutable and save bad-row reports.

```python
required={"order_id","quantity","unit_price","status","order_date"}
missing=required-set(df.columns)
if missing: raise ValueError(f"Missing columns: {sorted(missing)}")
if df["order_id"].duplicated().any(): raise ValueError("Duplicate order IDs")
```

**Lab:** Inject duplicate, null and negative values into sample input. Pipeline should fail clearly or quarantine rows under documented policy. Never silently drop all invalid rows.

## 07 · Transformations, joins and groupby

Data transformation changes shape but should preserve traceability. `groupby` aggregates, `merge` joins tables. Joins can multiply rows unexpectedly when key isn't unique. Always test before/after totals and row counts.

```python
result=(df.groupby("region",as_index=False)
          .agg(orders=("order_id","nunique"), revenue=("net_amount","sum")))
```

**Lab:** Merge orders with product dimension and detect duplicate product keys. Why is `nunique(order_id)` different from row count for line items?

## 08 · SQL for analysts

SQL works close to data and handles joins/aggregations at scale. Understand `WHERE` before aggregation, `HAVING` after, window functions, CTEs and execution plans. Never build SQL queries with untrusted strings; parameterize values.

```sql
SELECT region, COUNT(DISTINCT order_id) AS orders,
       SUM(quantity * unit_price - discount) AS revenue
FROM orders WHERE status='paid'
GROUP BY region ORDER BY revenue DESC;
```

**Lab:** Compare Pandas and SQL aggregation on the same dataset; numbers must match after null/refund rules.

## 09 · Exploratory Data Analysis and statistics

EDA tests assumptions: distributions, missingness, trends, outliers and relationships. Calculate mean, median, standard deviation, quantiles; confidence intervals give uncertainty. A small sample can produce unstable conclusions. Multiple comparisons and selection bias matter.

```python
print(df["net_amount"].describe(percentiles=[.25,.5,.9,.95]))
print(df.isna().mean().sort_values(ascending=False))
```

**Lab:** Draw histogram of order values, identify long tail. Do not delete outliers just because they look unusual: could be real wholesale sales or a data bug.

## 10 · Visualization, storytelling and accessibility

Charts are tools for asking questions. Trend over time → line; comparisons → bars; distribution → histogram; relationship → scatter. Start axes honestly, label units, expose sample size and filters, avoid rainbow palettes that harm accessibility. Chart should be readable without hover.

```python
import matplotlib.pyplot as plt
series=df.groupby(df["order_date"].dt.to_period("M"))["net_amount"].sum()
series.index=series.index.astype(str)
ax=series.plot(kind="bar",title="Monthly paid revenue")
ax.set_ylabel("Revenue (example units)")
plt.tight_layout();plt.savefig("report.png",dpi=140)
```

**Lab:** Same data as misleading truncated-axis plot and honest labeled plot; describe why one can exaggerate trends.

## 11 · Business KPIs and semantic definitions

KPI is a measurable business rule. Examples: gross sales, net sales after refunds, active customers, average order value (AOV = revenue / number of paid orders), retention, funnel conversion. Define population and time window to avoid metric drift. Store definitions next to code.

```text
Paid events → Net sales = sum(valid paid amounts) - refunds
Paid orders → AOV = net sales / count(distinct paid order_id)
New customers → count(customers with first successful order in window)
```

**Lab:** Add currency and tax policy to README. Ask "Does cancellation count?" If someone can't reproduce a KPI, it isn't enterprise-ready.

## 12 · ETL/ELT pipelines and orchestration

ETL is Extract → Transform → Load. ELT loads raw data first then models it. Good pipeline has schema checks, idempotency, checkpoints, retry rules, lineage and data quality alerts. Partition by event date when practical; reprocessing should not double-count.

```text
CSV / API / DB → Raw storage → Schema/quality gate → Clean canonical model
                                              ↓
                             Aggregations → Dashboard + Reports
```

**Lab:** Run starter CLI twice with same input. Ensure results are stable and outputs replaced deterministically. Record source filename, run time, record count and validation failures.

## 13 · Dashboard with Python and Streamlit

A dashboard combines metrics, filters, charts and drill-down. Streamlit is good for fast internal prototypes; production requires authentication, authorization, deployment and secure data access. Caching must not expose one user's data to another.

```python
import streamlit as st
st.title("Sales Operations Dashboard")
st.metric("Paid orders", int((df["status"]=="paid").sum()))
st.bar_chart(df.groupby("region")["net_amount"].sum())
```

**Lab:** Run `streamlit run dashboard.py` in starter. Make region filter. Verify filtered KPI denominator is consistent.

## 14 · Analytics testing, privacy and governance

Unit-test calculation functions with tiny known examples; use contract tests for schema, nulls, uniqueness, referential integrity and boundaries. Enterprise needs access control, PII masking, retention rules, audit trail, lineage, reproducible reports and incident response.

```python
def test_aov():
    total=300; paid_orders=3
    assert total/paid_orders==100
```

**Lab:** Make a test that fails for duplicate order IDs. Include a reconciliation check between raw paid amounts and output totals.

## 15 · Forecasting, experiments and causal humility

Time series forecasting estimates future values with uncertainty. Train/test split must follow time order; random splits can leak future information. Measure MAE/MAPE carefully (MAPE fails with zero denominators); compare against a simple naive baseline. Experiments require randomization and guardrail metrics. Correlation doesn't prove a campaign caused sales to rise.

**Lab:** Forecast next week's sales using 7-day moving average, calculate MAE on a held-out period, compare to last-week baseline. State limitations in plain English.

## 16 · Enterprise capstone and career portfolio

Build **Analytics Enterprise Studio**: ingest sales CSV + dimension lookup → reject bad input → validate schema → derive monetary metrics → aggregate by day/region/category → generate CSV and PNG report → optional Streamlit UI → pytest suite → document metric definitions.

**Definition of done:** reproducible virtualenv; one command generates reports; bad inputs rejected; sample dataset included; tests pass; dashboard demonstrates filters; no real personal data; documented dependency versions and rollback.

**Enterprise expansion:** schedule with Airflow/Prefect; warehouse tables and dbt models; SLA + alerting; SSO/RBAC; data catalog/lineage; encrypted storage; column-level policies; historical backfills; dashboards as code; performance tuning; backup and restore. Treat these as planned architecture—not functionality the starter currently implements.

**Interview defense:** missing values vs zero, join cardinality, pandas vs SQL, vectorization, data leakage, SCD type 2, OLTP vs OLAP, KPI semantics, ETL retries, AOV, data quality tests, sampling and confidence intervals.
