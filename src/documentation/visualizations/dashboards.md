# Dashboards

The `dashboard` style can be invoked on something that will render as a table `# dashboard` tag.  The dimensions of a dashboard are aligned at the top.  Aggregates and nested queries float within the dashboard.

## Example Model

```malloy
--! {"isModel": true, "modelPath": "/inline/airports_mini.malloy"}
source: airports is duckdb.table('data/airports.parquet') {
  measure: airport_count is count()

  # dashboard
  query: by_state_and_county is {
    limit: 10
    group_by: state
    aggregate: airport_count
    nest: by_fac_type is {
      group_by: fac_type
      aggregate: airport_count
    }
  }
}
```

## Shows results as a Dashboard


Results shown as a table

```malloy
--! {"isRunnable": true, "size":"medium", "isPaginationEnabled": true, "source": "/inline/airports_mini.malloy"}
run: airports -> by_state_and_county
```

Results shown as a dashboard


```malloy
--! {"isRunnable": true, "size":"large", "isPaginationEnabled": true, "source": "/inline/airports_mini.malloy"}
# dashboard
run: airports -> {
    limit: 10
    group_by: state
    aggregate: airport_count
    nest: by_fac_type is {
      group_by: fac_type
      aggregate: airport_count
    }
  }

```

