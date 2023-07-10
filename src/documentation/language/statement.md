# Modeling With Malloy

Malloy recognizes modeling as a key aspect of data analytics and provides tools that allow for modularity and reusability of definitions. Whereas in SQL, queries generally define all metrics inline, requiring useful snippets to be saved and managed separately, in Malloy,
_dimensions_, _measures_, and _queries_ can be saved and attached to a modeled source.

A Malloy document is a collection of [statements](#statements), [comments](#comments), and [tags](#tags)

## Statements

* [Import Statements](imports.md)
* [Source Statements](#sources)
* [Query Statements](#queries)

A semicolon can optionally separate two statements

```malloy
// These are all legal
source: s1 is s2
query: q2 is s1 -> { project: * }

// Semicolon allowed
source: s1 is s2; query: q2 is s1 -> { project: * }

// Semicolon is not required
source: s1 is s2 query: q2 is s1 -> { project: * }

```

## Sources

A Malloy model file can contain several _sources_, which can be thought of as a table and a collection of computations and relationships which are relevant to that table.

```malloy
--! {"isModel": true, "modelPath": "/inline/e.malloy"}
source: flights is duckdb.table('data/flights.parquet') {
  dimension: distance_km is distance / 1.609344

  measure: flight_count is count()

  query: by_carrier is {
    group_by: carrier
    aggregate: flight_count
  }
}
```
See [Source Documentation](source.md) for more information on sources.

## Queries

### Referencing a modeled query
```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true, "source": "/inline/e.malloy"}
query: flights -> by_carrier
```

### Running a named query with a filter
```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true, "source": "/inline/e.malloy"}
query: flights { where: origin = 'SFO' } -> by_carrier
```


### Adding a limit on the Query
```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true, "source": "/inline/e.malloy"}
query: flights { where: origin = 'SFO' } -> by_carrier { limit: 2 }
```

### Putting it all together
First, we'll create a brand new query:
```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true, "source": "/inline/e.malloy"}
query: flights -> {
  group_by: destination
  aggregate:
    flight_count
    average_distance_in_km is distance_km.avg()
}
```

Now we'll compose a query which contains both modeled and ad-hoc components:

```malloy
--! {"isRunnable": true, "showAs":"html", "isPaginationEnabled": true, "source": "/inline/e.malloy"}
query: flights -> {
  group_by: destination
  aggregate:
    flight_count
    average_distance_in_km is distance_km.avg()
  nest: top_carriers is by_carrier { limit: 2 }
}
```
See [Query Documentation](query.md) for more information on queries.

## Comments

Comments in Malloy can be written with `--` (as in SQL) or `//`.
A comment continues untli the end of the line containing a comment.

## Tags

Tags look like comments, they begin with the `#` (hash, octothorpe, numbersign),
the tag texts are collected and distributed to objects defined after the tag,
with the following rules

* Tags with `##` are collected and attached to the document
* All other tags are attached the the object defined after the tag
* Statements which define multiple objects, distribute their tags to
  each object defined in the statement.

```malloy
// This tag is attached to the document/model
## tag_1

// This will be attached top the next query
# tag_2
query: myQuery is someSource -> { project: * }

// This tag will be applied to both "a" and "b"
# tag_3
dimension:
  // This tag will only be applied to "a"
  # tag_4
  a is 'a'
  // This tag will only be applied to "b"
  # tag_5
  b is 'b'
```

Tags are collected by the Malloy parser but their contents are parsed by the application (e.g. VSCode). This makes annotations extensible for many use cases. In VSCode, annotations are interpreted in two ways:
* As rendering instructions: `# bar_chart`
* As documentation comments: `#" This query calculates ...`

Other formats of tags are ignored:
* `#bar_chart` without a space after the `#`
* `#! custom="application" values="here"`

