# SQL Blocks

Sometimes it is useful to add SQL statements into a Malloy file. You can do so by using the `sql:` keyword.
An SQL statement has two properties.

* `select:` -- Has a string value which is bracketed with triple quotes `"""`
* `connection:` -- A string value which is the name of the connection
   _(if not specified the default connection will be used)_


```malloy
--! {"isRunnable": true, "showAs":"html", "size": "large", "sqlBlockName": "my_sql_query" }
sql: my_sql_query is {
  select: """
    SELECT
      first_name,
      last_name,
      gender
    FROM 'data/users.parquet'
    LIMIT 10
  """
  connection: "duckdb"
}
```

## Sources from SQL Blocks

Sources can be created from a SQL block, e.g.

```malloy
--! {"isRunnable": true, "showAs":"html", "size": "large" }
sql: my_sql_query is {
  select: """
    SELECT
      first_name,
      last_name,
      gender
    FROM 'data/users.parquet'
    LIMIT 10
  """
  connection: "duckdb"
}

source: limited_users is from_sql(my_sql_query) {
  measure: user_count is count()
}

query: limited_users -> {
  aggregate: user_count
}
```


## Embedding Malloy queries in an SQL block ( Turducken )

Malloy queries can be embedded in SQL blocks as well. When `%{` and `}` appear inside the `"""` string of a `select:` statement, the Malloy query between the brackets is compiled and replaced with the <code>SELECT</code> statement generated from the query.

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

> _We have referred to this feature the ["Turducken"](https://en.wikipedia.org/wiki/Turducken) because you then take the SQL block and wrap it in an SQL source. It isn't the perfect name for infinte nesting, but it is amusing..._
