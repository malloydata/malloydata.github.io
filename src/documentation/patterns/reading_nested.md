# Working with Nested Data

Data often comes in a nested structure, where information is organized hierarchically. BigQuery and DuckDB have built-in support for reading tables with nested data and extracting information from these nested structures.

When working with nested data in Malloy, it becomes remarkably simple. In Malloy, a nested array or struct is treated as a built-in join_many operation. You can effortlessly access the desired data using dot notation.

For example, in Google Analytics data, the top level object is sessions. There are repeated structures such as hits, pageviews, and products and more. Querying this data in SQL is difficult.

Below is the _partial_ schema for Google Analytics.

<img src="./ga_schema.webp" style="width: 100%">

To perform aggregate calculation in Malloy, you can simply specify the complete path to the numeric value and select the appropriate aggregate function. Malloy refers to this as aggregate locality, ensuring accurate calculations regardless of the join pattern used.

When writing a query, you can group by any path in this heiracy. Malloy ensures reliable aggregate calculations regardless of how the query is prespress..

## A simple Google Analytics Semantic model

And a very simple Malloy model describing the interesting some interesting calculations.

```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}
source:ga_sessions is table('duckdb:data/ga_sample.parquet'){
  measure:
    user_count is count(distinct fullVisitorId)
    percent_of_users is user_count/all(user_count)*100
    session_count is count()
    total_visits is totals.visits.sum()
    total_hits is totals.hits.sum()
    total_page_views is totals.pageviews.sum()
    t2 is totals.pageviews.sum()
    total_productRevenue is hits.product.productRevenue.sum()
    hits_count is hits.count()
    sold_count is hits.count() { where: hits.product.productQuantity > 0 }
}
```

## Show Data by Traffic Source

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
 query: ga_sessions -> {
    where: trafficSource.source != '(direct)'
    group_by: trafficSource.source
    aggregate:
      user_count
      percent_of_users
      hits_count
      total_visits
      session_count
    limit: 10
  }
```

## Show Data By Browser

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
  query: ga_sessions -> {
    group_by: device.browser
    aggregate:
      user_count
      percent_of_users
      total_visits
      total_hits
      total_page_views
      sold_count
  }
```

## With Nested Results

// disabled for now

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
  query: ga_sessions -> {
    group_by: device.browser
    aggregate:
      user_count
      percent_of_users
      total_visits
      total_hits
      total_page_views
      sold_count
    nest: by_source is {
      where: trafficSource.source != '(direct)'
      group_by: trafficSource.source
      aggregate:
        user_count
        percent_of_users
        hits_count
        total_visits
        session_count
      limit: 10
    }
  }
```
