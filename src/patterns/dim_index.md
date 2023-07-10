# Malloy Dimensional Indexes
Malloy has a special query operator that builds dimensional search indexes for sources.  Search indexes are generally used by Malloy Composer (Malloy's BI interface), but can also be used for other things.

When filtering data, you might know a term, but not necessarily which column in the one of the join data contains it.  Indexing the data on field names and high cardinality fields let's you qucikly find the term and the associated value.

Indexing could be used by LLMs to find the interesting column/term mapping in the data set.

## Simple Example
We're going to take the airports table and index it.  Some things to notice.

* The query operator `index:` takes a list of dimensions we would like in our index.  
* The results of an index are unordered, so we pass the result to another stage to order the results.  
* In this case, `weight` is the row count of the results returned.  
* non-string -type fields are represented as ranges across all rows.
* Click `ShowSQL` to see how this query works in SQL.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "pageSize":5000}
run: duckdb.table('data/airports.parquet') -> {
  index: *
} -> {
  project: *
  where: fieldType = 'string' and fieldValue != null
  order_by: weight desc
}
```

## Index For filtering queries

Indexes can be used find the best way to filter a dataset.  For example supposed we'd like to find 'SANTA CRUZ' in the dataset, but we don't quite know how to filter for it.  In a UI you might imagine that you type 'SANTA' and let have suggestons for values that might be appropriate.  In the results we can see that top value, 'SANTA ROSA', appears as county on 26 rows in the table.  We can also see that 'SANTA CRUZ' is both a `city` and a `county`..

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "pageSize":5000}
run: duckdb.table('data/airports.parquet') -> {
  index: *
} -> {
  where: fieldValue ~ r'SANTA'
  project: *
  order_by: weight desc
  limit: 15
}
```

We can then write a simple query to show the rows.  It turns out that 'SANTA CRUZ' is a county in both California and Arizona.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "pageSize":5000}
run: duckdb.table('data/airports.parquet') -> {
  where: county ~ 'SANTA CRUZ'
  project: *
}
```

## Indexing to show top values for each dimension
It is often difficult to approach a new dataset.  The index operator provides an intersting way to quickly gain an understanding of the dataset.  By piping the results of an index another stage, we can quickly see all the interesting values for each of the interesting dimesions.  Again, the weight shows the number of rows for that particular dimension/value.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "pageSize":5000}
run: duckdb.table('data/airports.parquet') -> {
  index: *
} -> {
  group_by: fieldName
  nest: values is {
    group_by: fieldValue, weight
    order_by: weight desc
    limit: 10
  }
  order_by: fieldName
}
```

## Weights can be any measure
Suppose we are looking at the Aircraft Models table and we'd like to produce an index.  In our world, big planes so we are going to weight the values for bigger planes higher.  The query name `search_index` is special.  Composer looks for a query named `search_index` to use to suggest search terms.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "pageSize":5000}
source: aircraft_models is duckdb.table('data/aircraft_models.parquet') + {
  measure: total_seats is seats.sum()

  query: search_index is {
    index: * by total_seats
  } -> {
    project: *
    order_by: weight desc
  }

}
run:  aircraft_models -> search_index 
```

## Index the entire graph
Indexing can work across an entire network of joins.  In this case we are going to join flights and airports and carriers.  To speed things up we are going to only sample 5000 rows.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "pageSize":5000}
source: flights is duckdb.table('data/flights.parquet') {
  join_one: carriers is duckdb.table('data/carriers.parquet') on carrier = carriers.code
  join_one: dest is duckdb.table('data/airports.parquet') on destination = dest.code
  join_one: orig is duckdb.table('data/airports.parquet') on origin = orig.code

  query: search_index is {
    index: *, dest.*, orig.* carriers.*
    sample: 5000
  }
}

// use the search index to look up values for 'SAN'
run: flights-> search_index -> {
  where: fieldValue ~ r'SAN'
  project: *
  order_by: weight desc
}
```
