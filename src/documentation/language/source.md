# Sources

Sources, and in particular, [extended sources](#source-extensions), are Malloy's primary unit of reusability for defining computations, join relationships, and queries.

Malloy separates queries from the source of their data. A source can be thought of as a table and a collection extensions that are relevant to that table, including measures (aggregate functions), dimensions (scalar calculations), query definitions, and join relationships to other sources. 

A source can be any of the following:

|Source type| Example|
|---|---|
| [A SQL table or view](#sources-from-tables-or-views)| `duckdb.table('data/flights.parquet')` |
| [A Malloy query](#sources-from-malloy-queries) | `flights -> { group_by: carrier }` |
| [A SQL query](#sources-from-sql-queries) | `duckdb.sql("""select 1 as one""")` |

A source can be used directly in a query:

```malloy
--! {"isRunnable": true}
run: duckdb.table('data/flights.parquet') -> {
  aggregate: flight_count is count()
}
```

Or, more commonly, it can be declared with a name so that it can be reused:

```malloy
--! {"isRunnable": true}
source: flights is duckdb.table('data/flights.parquet')

run: flights -> { aggregate: flight_count is count() }
```

Any of these kinds of sources can be [extended](#source-extensions) to add reusable definitions or other modifications.

```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}
source: flights is duckdb.table('data/flights.parquet') extend {
  measure: flight_count is count()
}
```

### Sources from Tables or Views

A source can be created from a SQL table or view from a connected database.

```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}
source: flights is duckdb.table('data/flights.parquet')
```

When defining a source in this way, all the columns from
the source table are available for use in field definitions
or queries.

```malloy
--! {"isRunnable": true,  "source": "/inline/e1.malloy"}
run: flights -> {
  // Columns from the source table are available
  group_by:
    carrier
    origin
  aggregate: flight_count is count()
  limit: 3
}
```

### Sources from Malloy Queries

In Malloy, every query has an associated output schema, so it can be used as a source for other queries. 

For example, in this model we define a query `flights_by_carrier`:

```malloy
--! {"isModel": true, "modelPath": "/inline/e2.malloy"}
query: flights_by_carrier is duckdb.table('data/flights.parquet') -> {
  group_by: carrier
  aggregate: lifetime_flights is count()
}
```

And here, we use the query `flights_by_carrier` as a source:

```malloy
--! {"isRunnable": true,  "source": "/inline/e2.malloy"}
run: flights_by_carrier -> {
  project: 
    carrier
    lifetime_flights_bucketed is round(lifetime_flights, -4)
    lifetime_flights
  limit: 3
}
```

We can also explicitly define the query as a source, which is useful when adding reusable computations: 

```malloy
--! {"isRunnable": true,  "source": "/inline/e2.malloy"}
source: carrier_facts is flights_by_carrier extend {
  dimension:
    lifetime_flights_bucketed is round(lifetime_flights, -4)
}

run: carrier_facts -> {
  project: 
    carrier
    lifetime_flights_bucketed
    lifetime_flights
  limit: 3
}
```

Here we referenced the query name `flights_by_carrier`, but we can also define a source by writing a query inline and then `extend`ing it:

```malloy
--! {"isModel": true, "modelPath": "/inline/e3.malloy"}
source: carrier_facts is duckdb.table('data/flights.parquet') -> {
  group_by: carrier
  aggregate: lifetime_flights is count()
} extend {
  dimension: lifetime_flights_bucketed is round(lifetime_flights, -4)
}
```

```malloy
--! {"isRunnable": true,  "source": "/inline/e3.malloy"}
run: carrier_facts -> {
  project: carrier, lifetime_flights_bucketed, lifetime_flights
  limit: 3
}
```

### Sources from SQL Queries

Sources can be created from a SQL query, e.g.

```malloy
--! {"isRunnable": true, "showAs":"html", "size": "large" }
source: limited_users is duckdb.sql("""
  SELECT
    first_name,
    last_name,
    gender
  FROM 'data/users.parquet'
  LIMIT 100
""")

query: limited_users -> {
  group_by: first_name
  aggregate: user_count is count()
}
```

Like with `duckdb.table('data/users.parquet')`, Malloy fetches the schema from the database to make columns of the resulting table accessible in computations.

_Note: this replaces an older [SQL Block syntax](./sql_blocks.md) using `sql: { ... }`._

## Source Extensions

Any source can be extended to add filters, specify a primary key, add fields and joins, rename fields, or limit which fields are available. 

Extensions are often added when defining a source for the first time:

```malloy
--! {"isModel": true, "modelPath": "/inline/e4.malloy"}
source: flights is duckdb.table('data/flights.parquet') extend {
  measure: flight_count is count()
}
```

But they may also be added to an existing source before giving the resulting source a name or using it in a query.

```malloy
--! {"isRunnable": true}
source: flights is duckdb.table('data/flights.parquet')

source: flights_ext is flights extend {
  measure: flight_count is count()
}

run: flights extend { 
  measure: total_distance is sum(distance) 
  # percent
  measure: percent_distance is total_distance / all(total_distance)
} -> {
  group_by: carrier
  aggregate: total_distance, percent_distance
}
```

The following subsections document the various kinds of source extensions.

### Adding Fields

Fields—dimensions, measures, and queries—may be defined as
part of a source extension, allowing for them to be used in any
query against the source, or in other fields within that source.

```malloy
--! {"isRunnable": true, "size": "large"}
source: airports is duckdb.table('data/airports.parquet') extend {
  dimension: has_control_tower is cntl_twr = 'Y'

  measure:
    airport_count is count()
    average_elevation is avg(elevation)

  query: average_elevation_by_control_tower is -> {
    group_by: has_control_tower
    aggregate: average_elevation
  }
}

run: airports -> {
  group_by: state
  aggregate: airport_count
  nest: average_elevation_by_control_tower
  limit: 2
}
```

### Filtering Sources

Filters can be added as a source extension with a `where:` clause. These filters apply to any query against the source.

```malloy
--! {"isRunnable": true}
source: flights is duckdb.table('data/flights.parquet')

source: long_sfo_flights is flights extend {
  where: origin = 'SFO' and distance > 1000
}

run: long_sfo_flights -> { 
  group_by: destination
  aggregate: flight_count is count()
  limit: 3 
}
```

### Primary Keys

To be used in joins to other sources, a source must
have a primary key specified as an extension.

```malloy
source: carriers is duckdb.table('data/carriers.parquet') extend {
  primary_key: code
}
```

### Joins

When sources are joined as part of their definition, queries can reference fields in the joined sources without having to specify the join relationship each time.

```malloy
--! {"isRunnable": true}
source: carriers is duckdb.table('data/carriers.parquet') extend {
  primary_key: code
}

source: flights is duckdb.table('data/flights.parquet') extend {
  join_one: carriers with carrier
  measure: flight_count is count()
}

query: flights -> {
  group_by: carriers.nickname
  aggregate: flight_count
  limit: 3
}
```

See the [Joins](join.md) section for more information on working with joins.

### Renaming Fields

Fields from a source may be renamed in the context of the
new source. This is useful when the original name is not descriptive, or has a different meaning in the new context.
```malloy
source: flights is duckdb.table('data/flights.parquet') extend {
  rename: facility_type is fac_type
  rename: origin_code is origin

  join_one: origin is airports with origin_code
}
```

### Limiting Access to Fields

The list of fields available in a source  can be limited. This can be done either by `accept`ing a list of fields to include (in which case any other field from the source is excluded, i.e. an "allow list") or by `except`ing a list of fields to exclude (any other field is included, i.e. a "deny list"). These cannot be used in conjunction with one another.

In this example, we define `airports` to `extend` the <code>airports.parquet</code> table, but we limit the included columns to only `id`, `name`, `code`, `city`, `state`, and `elevation`.

```malloy
--! {"isModel": true, "modelPath": "/inline/e4.malloy"}
source: airports is duckdb.table('data/airports.parquet') extend {
  accept: id, name, code, city, state, elevation
}
```

Here, we do the same, but instead of specifying which columns to include, we specify to include all columns except `c_ldg_rts`, `aero_cht`, and `cntl_twr`.

```malloy
--! {"isModel": true, "modelPath": "/inline/e4.malloy"}
source: airports is duckdb.table('data/airports.parquet') extend {
  except: c_ldg_rts, aero_cht, cntl_twr
}
```
