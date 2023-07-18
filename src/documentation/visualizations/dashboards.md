# Dashboards

In Malloy, queries can get quite complex and multifaceted, so it is often hard to read information in one large (nested) table. 

```malloy
--! {"isModel": true, "modelPath": "/inline/airports_mini.malloy"}
source: airports is duckdb.table('data/airports.parquet') extend {
  measure: airport_count is count()
  query: by_state_and_county is -> {
    limit: 10
    group_by: state
    aggregate: airport_count
    # bar_chart
    nest: by_fac_type is -> {
      group_by: fac_type
      aggregate: airport_count
    }
  }
}
```

```malloy
--! {"isRunnable": true, "showAs":"html", "size":"large", "isPaginationEnabled": true, "source": "/inline/airports_mini.malloy"}
run: airports -> by_state_and_county
```

In such cases, the `# dashboard` renderer is useful for making the results easier to read:


```malloy
--! {"isRunnable": true, "showAs":"html", "size":"large", "isPaginationEnabled": true, "source": "/inline/airports_mini.malloy"}
# dashboard
run: airports -> by_state_and_county
```