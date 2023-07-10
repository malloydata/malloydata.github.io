
# Shape Maps

The plugin currently supports US maps and state names. The model and data styles for the subsequent examples are:

```malloy
--! {"isModel": true, "modelPath": "/inline/e.malloy"}
source: airports is duckdb.table('data/airports.parquet') {
  primary_key: code
  measure: airport_count is count()
  query: by_state is {
    group_by: state
    aggregate: airport_count
  }
  # shape_map
  query: by_state_shaped is by_state
}
```


## Run a query and tag the reusults as a shape map

We can explicitly return a result as a shape map.

```malloy
--! {"isRunnable": true, "size": "medium", "source": "/inline/e.malloy"}
# shape_map
run: airports -> by_state
```

## The tag is in the semantic model 

In the query below the tag is in the semantic model.

```malloy
--! {"isRunnable": true, "size": "medium", "source": "/inline/e.malloy"}
run: airports -> by_state_shaped {where: fac_type='SEAPLANE BASE'}
```


## Run as a trellis
By calling the configured map as a nested subtable, a trellis is formed.


```malloy
--! {"isRunnable": true, "size": "medium", "source": "/inline/e.malloy"}
run: airports -> {
  group_by: faa_region
  aggregate: airport_count
  # shape_map
  nest: by_state
}
```

## Run as a trellis, repeated with different filters

```malloy
--! {"isRunnable": true, "size": "large", "source": "/inline/e.malloy" }
query: airports -> {
  group_by: faa_region
  aggregate: airport_count
  nest:
    // shape map is declared in the model
    heliports is by_state_shaped { where: fac_type = 'HELIPORT' }
    # shape_map
    seaplane_bases is by_state { where: fac_type = 'SEAPLANE BASE' }
}
```
