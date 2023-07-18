# Dashboards

The `dashboard` style can be invoked on something that will render as a table `# dashboard` tag. When a query is rendered as a dashboard, dimensions aligned at the top, and agregates and nested queries float within the dashboard.

```malloy
--! {"isModel": true, "modelPath": "/inline/airports_mini.malloy"}
source: airports is duckdb.table('data/airports.parquet') extend {
  measure: airport_count is count()

  # dashboard
  query: by_state_and_county is -> {
    limit: 10
    group_by: state
    aggregate: airport_count
    nest: by_fac_type is -> {
      group_by: fac_type
      aggregate: airport_count
    }
  }
}
```

Queries in Malloy are often very complex and multifaceted, which makes them difficult to read in one nested table:

```malloy
--! {"isRunnable": true, "size":"medium", "isPaginationEnabled": true, "source": "/inline/airports_mini.malloy"}
run: airports -> by_state_and_county
```

In such cases, the `# dashboard` renderer is useful for making the results easier to read:

```malloy
--! {"isRunnable": true, "size":"large", "isPaginationEnabled": true, "source": "/inline/airports_mini.malloy"}
# dashboard
run: airports -> by_state_and_county
```

