# Malloy Quickstart

This guide introduces the basics of querying data and building a semantic model with the Malloy language. By the end of this tutorial, you will understand how to use Malloy to run queries, build re-usable data models, and do analysis on your data that is nearly impossible in SQL.

The easiest way to follow along is by going to the [interactive notebook version of this tutorial](https://github.dev/malloydata/quickstart/blob/main/README.md). The link will launch a browser-based VSCode environment and ask you to install the Malloy extension. Once installed, navigate back to the [quickstart notebook file](https://github.dev/malloydata/quickstart/blob/main/quickstart.malloynb), and dive in.

If you'd like to run Malloy locally on your laptop instead, follow the setup instructions to [install the VSCode extension](../setup/extension.md) and [connect to a database](../setup/connection_instructions.md).

## A simple `SELECT`

The following query is equivalent to <code>SELECT id, code, city FROM airports LIMIT 10</code> in SQL:

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true}
run: duckdb.table('data/airports.parquet') -> {
  project:
    id
    code
    city
  limit: 10
}
```

Let's break down each part of this query.
- `run:` is the opening statement that indicates we're starting to write a query
- `duckdb.table('data/airports.parquet')` defines the source for the query. The `table()` function creates a source from a table or view in the database.
  - A source is similar to a table or view in SQL, but Malloy sources can include additional information like joins and measures. We'll cover this in depth later on.
- The `->` operator begins the query. All queries take the form `source -> { ... }`, with the query logic specified inside of the curly braces.
- `project: ` is equivalent to `SELECT` in SQL. In this clause, we select the `id`, `code`, and `city` columns from the table. The `project` operator takes its name from the [projection](https://en.wikipedia.org/wiki/Projection_(relational_algebra)) operation in Relational Algebra.
- `limit: 10` limits the resultset of the query to the first 10 items

## Query Operators

In SQL, the <code>SELECT</code> command does two very different things.  A <code>SELECT</code> with a <code>GROUP BY</code> aggregates data according to the <code>GROUP BY</code> clause and produces aggregate calculation against every calculation not in the <code>GROUP BY</code>.  In Malloy, the query operator for this is `group_by`.  Calculation about data in the group are made using `aggregate`.

The second type of <code>SELECT</code> in SQL does not perform any aggregation;  All rows in the input table, unless filtered in some way, show up in the output table. In Malloy, this command is called `project`.

### Aggregate
In the query below, the data will be grouped by `state` and `county`, and will produce an aggregate calculation for `airport_count` and `average_elevation`.

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true}
run: duckdb.table('data/airports.parquet') -> {
  group_by:
    state
    county
  aggregate:
    airport_count is count()
    average_elevation is avg(elevation)
}
```

### Project
In Malloy, "project" is a verb, not a noun. As in "to project something", rather than "this is a project". `project` produces a list of fields.  For every row in the input table, there is a row in the output table. This is similar to a simple `SELECT` statement in SQL with no aggregations.

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true}
run: duckdb.table('data/airports.parquet') -> {
  project: code, full_name, city, county
  where: county = 'SANTA CRUZ'
  limit: 10
}
```

Operator statements can be placed in any order within a query. `where` can come before or after `project`, and `limit` can be placed anywhere as well. The above query could also be written:

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true}
run: duckdb.table('data/airports.parquet') -> {
  limit: 10
  where: county = 'SANTA CRUZ'
  project: code, full_name, city, county
}
```

## Everything has a Name

In Malloy, all output fields have names. This means that any time a query
includes a field with a calculated value, like a scalar or aggregate function,
it must be named. _(unlike SQL, which allows un-named expressions)_

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true}
run: duckdb.table('data/airports.parquet') -> {
  aggregate: max_elevation is max(elevation)
}
```

Notice that Malloy uses the form "_name_ `is` _value_" instead of SQL's "_value_ `as` _name_".
Having the output column name written first makes it easier for someone reading
the code to visualize the resulting query structure.

Named objects, like columns from a table, and fields defined in a source, can be included in field lists without an `is`

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true}
run: duckdb.table('data/airports.parquet') -> {
  project:
    full_name
    elevation
}
```

## Expressions

Many SQL expressions will work unchanged in Malloy, and many functions available in Standard SQL are usable in Malloy as well. This makes expressions fairly straightforward to understand, given a knowledge of SQL.

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true, "size": "large"}
run: duckdb.table('data/airports.parquet') -> {
  group_by: county_and_state is concat(county, ', ', state)
  aggregate:
    airport_count is count()
    max_elevation is max(elevation)
    min_elevation is min(elevation)
    avg_elevation is avg(elevation)
}
```

The basic types of Malloy expressions are `string`, `number`, `boolean`, `date`, and `timestamp`.

## Sources: the Basic Structure for Modeling and Reuse

One of the main benefits of Malloy is the ability to save common calculations into a data model. The data model is made of *sources*, which can be thought of as tables or views, but with additional information, such as joins, dimensions and measures.

In the example below, we create a *source* object named `airports` and add a `dimension` calculation for `county_and_state` and `measure` calculation for `airport_count`.  Dimensions can be used in `group_by`, `project` and `where`.  Measures can be used in `aggregate` and `having`.

```malloy
--! {"isModel": true, "modelPath": "/inline/airports_mini.malloy"}
source: airports is duckdb.table('data/airports.parquet') {
  dimension: county_and_state is concat(county, ', ', state)
  measure: airport_count is count()
  measure: average_elevation is avg(elevation)
}
```

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true, "source": "/inline/airports_mini.malloy"}
run: airports -> {
  group_by: county_and_state
  aggregate: airport_count
}
```

Sources that are defined in one file can be imported into another using `import "path/to/some/file.malloy"`. For example, if the `airports` source above were defined in a file called `flights.malloy`, you could create a new file that imports it and immediately start using the `airports` source:

```malloy
import "flights.malloy"

run: airports -> {
  group_by: county_and_state
  aggregate: average_elevation
}
```

Sources can also contain named queries. These named queries are useful for building nested queries (covered later) or for saving a query so it can re-used again and again without having to rewrite it.

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true}
source: airports_with_named_query is duckdb.table('data/airports.parquet') {
    dimension: county_and_state is concat(county, ', ', state)
    measure: airport_count is count()
    measure: average_elevation is avg(elevation)

    // This is a "named query":
    query: top_county_and_state is {
        group_by: county_and_state
        aggregate: airport_count
        limit:10
    }
}

// The named query can now be referenced by name, and run without having to rewrite the logic:
run: airports_with_named_query -> top_county_and_state
```

## Joins

[Joins](../language/join.md) are declared as part of a source. When joining a source to another, it brings with it all child joins.

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true}
source: aircraft_models is duckdb.table('data/aircraft_models.parquet') {
  primary_key: aircraft_model_code
}

source: aircraft is duckdb.table('data/aircraft.parquet') {
  primary_key: tail_num
  join_one: aircraft_models on aircraft_model_code = aircraft_models.aircraft_model_code
}

source: flights is duckdb.table('data/flights.parquet') {
  join_one: aircraft on tail_num = aircraft.tail_num
}

run: flights -> {
  where: dep_time ? @2003-01
  group_by: aircraft.aircraft_models.manufacturer
  aggregate:
    flight_count is count()
    aircraft_count is aircraft.count()
    average_seats_per_model is aircraft.aircraft_models.seats.avg()
}
```

In this example, the `aircraft` source is joined to `flights`, and `aircraft_models` is joined via `aircraft`. These examples explicitly name both keys -- this same syntax can be used to write more complex joins.

Now, any query that uses the `flights` source has access to fields in both `aircraft` and `aircraft_models` without having to explicitly specify the join condition. The joins are specified once in the source, and usable by any query on `flights`.

An ad hoc join can also be specified in a query block. In the query below, we join in the `airports` table using the `destination` column as a join key, then compute the top 5 destination airports by flight count.

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true}
source: airports is duckdb.table('data/airports.parquet')

source: flights is duckdb.table('data/flights.parquet')

run: flights -> {
  join_one: airports on destination = airports.code
  group_by: airports.full_name
  aggregate: flight_count is count()
  top: 5
}
```

## Filtering

When working with data, filtering is something you do in almost every query. Malloy provides consistent syntax for filtering everywhere within a query. The most basic type of filter is applied using a `where:` clause, very similar to a <code>WHERE</code> clause in SQL.

The following query grabs the top 5 counties in California with the highest airport count:

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true}
run: duckdb.table('data/airports.parquet') -> {
  where: state = 'CA'
  top: 5
  group_by: county
  aggregate: airport_count is count()
}
```

Filters can also be applied to sources:

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true}
source: airports_in_california is duckdb.table('data/airports.parquet') {
  where: state = 'CA'
}

run: airports_in_california -> {
  top: 5
  group_by: county
  aggregate: airport_count is count()
}
```

Any query run on the `airports_in_california` source will run against the `airports` table, and always include the filter in `state = 'CA'`.

### Filtering Measures

A filter on an aggregate calculation (a _measure_) narrows down the data used in that specific calculation. In the example below, the calculations for `airports` and `heliports` are filtered separately.

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true}
run: duckdb.table('data/airports.parquet') -> {
  group_by: state
  aggregate:
    airports is count() { where: fac_type = 'AIRPORT' }
    heliports is count() { where: fac_type = 'HELIPORT' }
    total is count()
}
```

In SQL, this same calculation is often done using <code>CASE</code> statements inside of the aggregates, which is verbose and difficult to read. A query like the above would look like:

```sql
SELECT
   state
   , SUM(CASE WHEN fac_type = 'AIRPORT' THEN 1 ELSE 0 END) AS airports
   , SUM(CASE WHEN fac_type = 'HELIPORT' THEN 1 ELSE 0 END) AS heliports
   , COUNT(*) AS total
FROM `malloy-data.faa.airports`
GROUP BY state
```

## Nested Queries

The next several examples will use this simple source definition:

```malloy
source: airports is duckdb.table('data/airports.parquet') {
  measure: airport_count is count()
};
```

### Nested Queries

In Malloy, queries can be [nested](../language/nesting.md) to produce subtables on each output row.

```malloy
--! {"isRunnable": true, "showAs":"html", "source": "airports.malloy", "isPaginationEnabled": true}

run: airports -> {
  group_by: state
  aggregate: airport_count
  nest: by_facility is {
    group_by: fac_type
    aggregate: airport_count
    top: 3
  }
}
```

Here we can see that the `by_facility` column of the output table contains a nested subtable on each row. `by_facility` contains the counts for the top 3 facility types for each state, i.e., the number of airports, heliports, and stolports in Texas, the number of airports, heliports, and seaplane bases in California, etc.

When a query is nested inside another query, each output row of the outer query will have a nested table for the inner query which only includes data limited to that row.

Queries can be nested infinitely, allowing for rich, complex output structures. A query may always include another nested query, regardless of depth.

```malloy
--! {"isRunnable": true, "showAs":"html", "source": "airports.malloy", "size": "large"}
run: airports -> {
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

### Filtering Nested Queries

Filters can be isolated to any level of nesting. In the following example, we limit the `major_facilities` query to only airports where `major` is `'Y'`. This particular filter applies _only_ to `major_facilities`, and not to other parts of the outer query.

```malloy
--! {"isRunnable": true, "showAs":"html", "source": "airports.malloy", "size": "large"}
run: airports -> {
  where: state = 'CA'
  group_by: county
  aggregate: airport_count
  nest: major_facilities is {
    where: major = 'Y'
    group_by: name is concat(code, ' (', full_name, ')')
  }
  nest: by_facility is {
    group_by: fac_type
    aggregate: airport_count
  }
}
```

## Dates and Timestamps

Working with time in data is often needlessly complex; Malloy has built in constructs to simplify many time-related operations. This section gives a brief introduction to some of these tools, but for more details see the [Time Ranges](../language/time-ranges.md) section.

### Time Literals

Literals of type `date` and `timestamp` are notated with an `@`, e.g. `@2003-03-29` or `@1994-07-14 10:23:59`. Similarly, years (`@2021`), quarters (`@2020-Q1`), months (`@2019-03`), weeks (`@WK2021-08-01`), and minutes (`@2017-01-01 10:53`) can be expressed.

Time literals can be used as values, but are more often useful in filters. For example, the following query
shows the number of flights in 2003.

```malloy
--! {"isRunnable": true, "showAs":"html"}
run: duckdb.table('data/flights.parquet') { where: dep_time ? @2003 } -> {
  aggregate: flight_count is count()
}
```

There is a special time literal `now`, referring to the current timestamp, which allows for relative time filters.

```malloy
query: duckdb.table('data/flights.parquet') { where: dep_time > now - 6 hours } -> {
  aggregate: flights_last_6_hours is count()
}
```

### Truncation

Time values can be truncated to a given timeframe, which can be `second`, `minute`, `hour`, `day`, `week`, `month`, `quarter`, or `year`.

```malloy
--! {"isRunnable": true, "showAs":"html"}
run: duckdb.table('data/flights.parquet') -> {
  group_by:
    flight_year is dep_time.year
    flight_month is dep_time.month
  aggregate: flight_count is count()
}
```

### Extraction

Numeric values can be extracted from time values, e.g. `day_of_year(some_date)` or `minute(some_time)`. See the full list of extraction functions [here](../language/timestamp-operations.md#extraction).

```malloy
--! {"isRunnable": true, "showAs":"html", "pageSize": 7, "size": "large"}
run: duckdb.table('data/flights.parquet') -> {
  order_by: 1
  group_by: day_of_week is day(dep_time)
  aggregate: flight_count is count()
}
```

<!-- TODO it may be worth having a doc describing what the JSON+Metadata
output of these look like, i.e. that the JSON just includes a regular date,
but the metadata specifies that it's in that given timeframe.
And likewise for any other data type that has interesting output metadata. -->

### Time Ranges

Two kinds of time ranges are given special syntax: the range between two times and the range starting at some time for some duration. These are represented like `@2003 to @2005` and `@2004-Q1 for 6 quarters` respectively. These ranges can be used in filters just like time literals.

```malloy
--! {"isRunnable": true, "showAs":"html"}
run: duckdb.table('data/flights.parquet') { where: dep_time ? @2003 to @2005 } -> {
  aggregate: flight_count is count()
}
```

Time literals and truncations can also behave like time ranges. Each kind of time literal has an implied duration that takes effect when it is used in a comparison, e.g. `@2003` represents the whole of the year 2003, and `@2004-Q1` lasts the whole 3 months of the quarter. Similarly, when a time value is truncated, it takes on the
timeframe from the truncation, e.g. `now.month` means the entirety of the current month.

When a time range is used in a comparison, `=` checks for "is in the range", `>` "is after", and `<` "is before." So `some_time > @2003` filters dates starting on January 1, 2004, while `some_time = @2003` filters to dates in the year 2003.

```malloy
--! {"isRunnable": true, "showAs":"html"}
run: duckdb.table('data/flights.parquet') { where: dep_time > @2003 } -> {
  top: 3; order_by: departure_date asc
  group_by: departure_date is dep_time.day
  aggregate: flight_count is count()
}
```

## Pipelines and Multi-stage Queries

The output from one stage of a query can be passed into another stage using `->`. For example, we'll start with this query which outputs, for California and New York, the total number of airports, as well as the number of airports in each county.

```malloy
--! {"isRunnable": true, "showAs":"html", "source": "airports.malloy", "size": "small"}
run: airports -> {
  where: state = 'CA' | 'NY'
  group_by: state
  aggregate: airport_count
  nest: by_county is {
    group_by: county
    aggregate: airport_count
  }
}
```

Next, we'll use the output of that query as the input to another, where we determine which counties have the highest
percentage of airports compared to the whole state, taking advantage of the nested structure of the data to to so.

```malloy
--! {"isRunnable": true, "showAs":"html", "source": "airports.malloy", "size": "large", "dataStyles": { "percent_in_county": { "renderer": "percent" }}}
run: airports -> {
  where: state = 'CA' | 'NY'
  group_by: state
  aggregate: airport_count
  nest: by_county is {
    group_by: county
    aggregate: airport_count
  }
} -> {
  top: 10; order_by: 4 desc
  project:
    by_county.county
    airports_in_county is by_county.airport_count
    airports_in_state is airport_count
    percent_in_county is by_county.airport_count / airport_count
}
```

_**NOTE:**: to pipeline a named query, the syntax to reference that named query is `-> query_name`. An example of this can be found in the [Query Doc](../language/query.md#multi-stage-pipelines)._

## Aggregate Locality

 When computing `sum`, `avg`, and `count` on fields in joined sources with one-to-many relationships, Malloy will automatically handle the duplication of rows that occurs in the join, and compute accurate aggregations on the fanned-out table. See the [Aggregate Locality](../language/aggregates.md#aggregate-locality) section for more information.

```malloy
--! {"isRunnable": true, "showAs":"html", "source": "flights.malloy"}
run: aircraft -> {
  aggregate:
    // The average number of seats on models of registered aircraft
    models_avg_seats is aircraft_models.seats.avg()
    // The average number of seats on registered aircraft
    aircraft_avg_seats is avg(aircraft_models.seats)
}
```

## Comments

Malloy code can include both line and block comments. Line comments, which begin with `--` or `//`,
may appear anywhere within a line, and cause all subsequent characters on that line to be ignored.
Block comments, which are enclosed between <code>/\*</code> and <code>\*/</code>, cause all enclosed characters to be ignored
and may span multiple lines.

```malloy
-- The total number of flight entries
run: flights -> {
  aggregate: flight_count // Defined simply as `count()`
}

/*
 * A comparison of the total number of flights
 * for each of the tracked carriers.
 */
 run: flights -> {
  group_by: carrier
  aggregate: flight_count /* , total_distance */
}
```

## Ordering and Limiting

In Malloy, ordering and limiting work pretty much the same way they do in SQL, though Malloy introduces some [reasonable defaults](../language/order_by.md).

The `top:` and `limit:` statements are synonyms and limits the number of rows returned. Results below are sorted by the first measure descending--in this case, `airport_count`.

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true}
run: duckdb.table('data/airports.parquet') -> {
  top: 2
  group_by: state
  aggregate: airport_count is count()
}
```

Default ordering can be overridden with `order_by:`, as in the following query, which shows the states in alphabetical order.  `order_by:` can take a field index number or the name of a field.

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true}
run: duckdb.table('data/airports.parquet') -> {
  order_by: state
  group_by: state
  aggregate: airport_count is count()
}
```

## Next Steps

This was a whirlwind tour of the syntax and features of Malloy. To continue on your Malloy journey:

- Explore sample analyses and data models built in Malloy in our [Patterns Github repo](https://github.com/malloydata/patterns).
- Learn how to [connect Malloy to your own database](../setup/connection_instructions.md).
- Take a look at our [guide for translating SQL to Malloy](../language/sql_to_malloy.md).
- Join the [Malloy community Slack channel](https://join.slack.com/t/malloy-community/shared_invite/zt-1t32mufpy-THwP1o1ADJVkd3o2L2zaZw)!

<!-- ## Joins are between primary and foreign keys.


## Full graph of the data is available to query

## Sums and Counts and average are a little different.

## Calculations can correctly occur anywhere in the graph -->



<!--

## Removed things
- Commas are optional.
- Count can be written without the `*`.

-->
