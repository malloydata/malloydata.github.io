# Nested Queries

Nested queries, more formally known as "aggregating subqueries" are queries included in other queries. A nested query produces a subtable per row in the query in which it is embedded. In Malloy, queries can be named and referenced in other queries. The technical term "aggregating subquery" is a bit of a mouthful, so we more often refer to it as a "nested query."

When a named query is nested inside of another query, it produces an aggregating subquery and the results include a nested subtable.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "source": "faa/airports.malloy"}
query: airports -> {
  group_by: state
  aggregate: airport_count
  nest: by_facility is {
    group_by: fac_type
    aggregate: airport_count
  }
}
```

## Nesting Nested Queries

Aggregating subqueries can be nested infinitely, meaning that a nested query can contain another nested query.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "source": "faa/airports.malloy", "size": "large"}
query: airports -> {
  group_by: state
  aggregate: airport_count
  nest: top_5_counties is {
    top: 5
    group_by: county
    aggregate: airport_count
    nest: by_facility is {
      group_by: fac_type
      aggregate: airport_count
    }
  }
}
```

## Filtering Nested Queries

Filters can be applied at any level within nested queries.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "source": "faa/airports.malloy", "size": "large"}
query: airports -> {
  where: state ? 'CA' | 'NY' | 'MN'
  group_by: state
  aggregate: airport_count
  nest: top_5_counties is {
    top: 5
    group_by: county
    aggregate: airport_count
    nest: major_facilities is {
      where: major = 'Y'
      group_by: name is concat(code, ' - ', full_name)
    }
    nest: by_facility is {
      group_by: fac_type
      aggregate: airport_count
    }
  }
}
```

## Un-nesting in a pipeline flattens the table

Queries can be chained together (pipelined), the output of one becoming the input of the next one, by simply adding another `->` operator and a new query definition. When fields within a nested subtable are accessed using dot-notation, the resulting value is a standard, non-nested, field.

```malloy
--! {"isRunnable": true,   "isPaginationEnabled": false, "pageSize": 100}

source: airports is table('malloy-data.faa.airports') {
  measure: airport_count is count()
}

query: airports -> {
  where: fac_type = 'HELIPORT'
  group_by: state
  aggregate: airport_count
  nest: top_3_county is {
    limit: 3
    group_by: county
    aggregate: airport_count
  }
}
-> {
  project:
    state
    top_3_county.county
    airports_in_state is airport_count
    airports_in_county is top_3_county.airport_count
    percent_of_state is top_3_county.airport_count/airport_count
}
```

In this example, `top_3_county` is a nested subtable in the output of the first part of the pipeline. In the second part of the pipeline, `airports_in_county` is a scalar number, created by accessing the `airport_count` field from the `top_3_county` subtable.