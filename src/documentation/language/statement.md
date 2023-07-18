# Models

Malloy recognizes modeling as a key aspect of data analytics and provides tools that allow for modularity and reusability of definitions. Whereas in SQL, queries generally define all metrics inline, requiring useful snippets to be saved and managed separately, in Malloy,
_dimensions_, _measures_, and _queries_ can be saved and attached to a modeled source, which itself is defined as part of a Malloy document, often referred to as a _model_.

A Malloy document is a collection of [statements](#statements), [comments](#comments), and [tags](#tags). These can be separated with an optional semi-colon for clarity, which helps readability when statements appear on the same line.

## Statements

There are four kinds of statements that can appear in a Malloy model:

* [Import Statements](#import-statements)
* [Query Statements](#query-statements)
* [Source Statements](#source-statements)
* [Run Statements](#run-statements)


### Import Statements

Import statements allow you to import sources from another <code>.malloy</code> file. 

```malloy
import "flights.malloy"
```

See the [Imports](imports.md) section for more information.

### Query Statements

A query statement defines a query as a named entity within a model, allowing it to be reused as the basis for other queries.

```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}
query: flights_by_carrier is duckdb.table('data/flights.parquet') -> {
  group_by: carrier
  aggregate: flight_count is count()
}
```

See the [Queries](query.md) section for more information on queries.

### Source Statements

In Malloy, a source is the basic unit of reusability for calculations, join relationships, and queries, and can be thought of as a table and a collection of computations and relationships which are relevant to that table.

A source statement defines a source as a reusable part of the model.

```malloy
--! {"isModel": true, "modelPath": "/inline/e2.malloy"}
source: flights is duckdb.table('data/flights.parquet') extend {
  dimension: distance_km is distance / 1.609344

  measure: flight_count is count()

  query: by_carrier is -> {
    group_by: carrier
    aggregate: flight_count
  }
}
```

See the [Sources](source.md) section for more information on sources.

### Run Statements

Run statements allow you to write queries in a model without naming them, or to indicate to the host application that a particular named query should be run. You'll see run statements all over the documentation, usually followed by the results of running that query. 

Any query can be run by including it in a run statement.

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true, "source": "/inline/e2.malloy"}
run: flights -> { 
  group_by: origin
  aggregate: destination_count is count(distinct destination) 
}
```

See the [Queries](query.md) section for more information on queries.

## Comments

Comments in Malloy can be written with `--` (as in SQL) or `//`. A comment continues until the end of the line.

```malloy
// This is a comment
-- This is also a comment
```

## Tags

Tags are a general-purpose feature of Malloy that allow arbitrary metadata to be attached to various Malloy objects (queries, sources, fields, etc.). One use case for tagging is to attach rendering information to a query:

```malloy
--! {"isRunnable": true, "source": "flights.malloy", "size": "large"}
# json
run: flights -> {
  group_by: carrier
  aggregate: flight_count
  limit: 2
}
```

For more information about the rendering tags used in the Malloy rendering library, see the [Visualizations](../visualizations/overview.md) section.

For more information about tag semantics, see the [Tags](./tags.md) section.