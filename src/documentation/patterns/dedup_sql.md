# De-duplicating rows in a table using a SQL block

Sometimes data has duplicate rows. A common pattern to de-duplicate a table is to use a window function to partition the table by the combination of columns that should be unique, then take the first row. Malloy does not yet natively support this pattern, so to achieve this, we need to use a SQL Block:

```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}
source: flights is duckdb.sql("""
    SELECT * from 'data/flights.parquet'
    qualify ROW_NUMBER() over (partition by dep_time, origin, destination, flight_num) = 1
  """
) {
  measure:
    flight_count is count()
}
```

We used `duckdb.sql()` to define a SQL statement, then created a source using that SQL statement.

## Querying the Source

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
run: flights -> {aggregate: flight_count}
```