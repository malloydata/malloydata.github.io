# SQL Sources

_SQL sources, introduced in Malloy version 0.56, replace the previous method of including SQL queries in a Malloy model, [SQL blocks](./sql_blocks.md)._

Sometimes it can be useful to base Malloy models off of SQL queries. You can do so by using the `.sql()` [connection method](./connections.md#connection-methods).

```malloy
--! {"isModel": true, "modelPath": "/inline/sql1.malloy"}
source: my_sql_source is duckdb.sql("""
  SELECT
    first_name,
    last_name,
    gender
  FROM 'data/users.parquet'
  LIMIT 10
""")
```

These SQL sources can be used any place a table source can be used:

```malloy
--! {"isRunnable": true, "showAs":"html", "source": "/inline/sql1.malloy", "size": "medium"}
run: my_sql_source -> { 
  group_by: first_name 
  aggregate: user_count is count()
}
```

Unlike other kinds of sources, SQL sources can be used like a query in some cases.

They can be run directly:

```malloy
--! {"isRunnable": true, "showAs":"html", "source": "/inline/sql1.malloy", "size": "medium"}
run: duckdb.sql("select 1 as one")
```

And they can also be defined as a query:

```malloy
--! {"isRunnable": true, "showAs":"html", "source": "/inline/sql1.malloy", "size": "medium"}
query: my_sql_query is duckdb.sql("select 1 as one")
run: my_sql_query
```

_Note: you can only run a SQL source as a query when it is defined as a `query:` or included directly in a `run:` statement._

## Extending SQL Sources

Like other kinds of source, SQL sources can be extended to add reusable computations.

```malloy
--! {"isRunnable": true, "showAs":"html", "size": "large" }
source: limited_users is duckdb.sql("""
  SELECT
    first_name,
    last_name,
    gender
  FROM 'data/users.parquet'
  LIMIT 10
""") extend {
  measure: user_count is count()
}

run: limited_users -> { aggregate: user_count }
```

## Embedding Malloy queries in an SQL block (A.K.A. "Turducken")

Malloy queries can be embedded in SQL blocks as well. When `%{` and `}` appear inside the `"""` string of a SQL source, the Malloy query between the brackets is compiled and replaced with the <code>SELECT</code> statement generated from the query.

```malloy
--! {"isRunnable": true, "showAs":"sql", "size": "large", "sqlBlockName": "malloy_in_sql_query" }
source: users is duckdb.table('data/users.parquet')

sql: malloy_in_sql_query is {
  connection: "duckdb"
  select: """
-- BEGIN MALLOY QUERY
%{
  users -> {
    top: 10 group_by: first_name, last_name, gender
    aggregate: n_with_this_name is count()
  }
}%
-- END MALLOY QUERY
"""

}
```

> _We have referred to this feature the ["Turducken"](https://en.wikipedia.org/wiki/Turducken) because you then take the SQL block and wrap it in an SQL source. It isn't the perfect name for infinte nesting, but it is amusing_
