# Deduping rows in a table using a SQL block

Sometime data can have duplicate rows.  Malloy can have sources and queries based on SQL queries.  The following example partitions the database by what should be unique and selects just uses the first row it finds.
```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}
source: flights is duckdb.sql("""
  SELECT * from 'data/flights.parquet'
  qualify ROW_NUMBER() over (partition by dep_time, origin, destination, flight_num) = 1
""") extend {
  measure: flight_count is count()
}
```

## Querying the Source

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
run: flights -> { aggregate: flight_count }
```