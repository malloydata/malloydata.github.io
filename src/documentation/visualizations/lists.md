# Lists
Tables with one or two elements can be rendered as lists.  Lists improve information density.

The examples below use the following models

```malloy
--! {"isModel": true, "modelPath": "/inline/airports_mini.malloy"}
source: airports is duckdb.table('data/airports.parquet') extend {
  measure: airport_count is count()
}
```

## Normal Table

```malloy
--! {"isRunnable": true, "size":"medium",  "source": "/inline/airports_mini.malloy"}
run: airports -> {
  group_by: faa_region
  aggregate: airport_count
  nest: by_state is -> {
    group_by: state
    aggregate: airport_count 
  }
}
```

##  # list
With a `list`, just the first element in the table is shown.

```malloy
--! {"isRunnable": true, "size":"small",  "source": "/inline/airports_mini.malloy"}
run: airports -> {
  group_by: faa_region
  aggregate: airport_count
  # list
  nest: by_state is -> {
    group_by: state
    aggregate: airport_count
  }
}
```


##  # list_detail
With `list_detail` the element and value are shown.

```malloy
--! {"isRunnable": true, "size":"small",  "source": "/inline/airports_mini.malloy"}
run: airports -> {
  group_by: faa_region
  aggregate: airport_count
  # list_detail
  nest: by_state is -> {
    group_by: state
    aggregate: airport_count
  }
}
```