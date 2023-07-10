# Rendering Results

When Malloy runs a query, it returns two things.  The *results* of the query and *metadata* about the results.  The metadata are the schema for the results, including type information.  Malloy also provides a mechanism to tag things in the source code and return tags with this meta data. 

In Malloy, anything that can be named can be tagged.  A tag start with a `#`.  Tags that start on a new line attach the tag the thing on the following line.

Malloy's rendering library can read these tags and to change how results are rendered.

## Tagging individual elements
In the query below, the measure **percent_of_total** is tagged as a percentage.  Anytime *percent_of_total* is used in a query, Malloy's rendering library will be displayed as a percentage.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "small", "pageSize":5000}
source: flights is duckdb.table('data/flights.parquet') {
  measure:
    flight_count is count()
    # percent
    percent_of_flights is flight_count/all(flight_count)
}

run: flights ->  {
  group_by: carrier
  aggregate: 
    flight_count 
    percent_of_flights
}
```

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "small", "pageSize":5000}
run: duckdb.table('data/flights.parquet') ->  {
  group_by: carrier
  aggregate: flight_count is count()
}
```

Simply adding `# bar_chart` before the query tags it and tells the rendering library to show the result as a bar chart.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "pageSize":5000}
# bar_chart
run: duckdb.table('data/flights.parquet') ->  {
  group_by: carrier
  aggregate: flight_count is count()
}
```


Malloy's renderering library uses the [Vega-Lite](https://vega.github.io/vega-lite/) for charting, allowing visualization of results. Malloy's rendering library is a separate layer from Malloy's data access layer.:

Tags for Queries in npMalloy's renderer include:

* [Bar Chart](bar_charts.md): `bar_chart`
* [Line Chart](charts_line_chart.md): `line_chart`
* [Scatter Chart](scatter_charts.md): scatter_chart`
* [Shape Map](shape_maps.md): `shape_map`
* [Segment Map](segment_maps.md): `segment_map`
* Dashboard: `dashboard`

Tags can be applied in sources, when nested, or when queries are run.

## Example Model

```malloy
--! {"isModel": true, "modelPath": "/inline/airports_mini.malloy"}
source: airports is duckdb.table('data/airports.parquet') {
  measure: airport_count is count()
  query: by_state_and_county is {
    limit: 10
    group_by: state
    aggregate: airport_count
    # bar_chart
    nest: by_fac_type is {
      group_by: fac_type
      aggregate: airport_count
    }
  }
}
```


## Shows results as a Dashboard
The `dashboard` style can be invoked on something that will render as a table `# dashboard` tag.

Results shown as a table

```malloy
--! {"isRunnable": true, "showAs":"html", "size":"large", "isPaginationEnabled": true, "source": "/inline/airports_mini.malloy"}
run: airports -> by_state_and_county
```

Results shown as a dashboard


```malloy
--! {"isRunnable": true, "showAs":"html", "size":"large", "isPaginationEnabled": true, "source": "/inline/airports_mini.malloy"}
# dashboard
run: airports -> by_state_and_county
```

## Additional Charting with Vega Lite
The `vega` renderer allows much more customization of rendering than the default visualization options provided in the Extension, using the [Vega-Lite](https://vega.github.io/vega-lite/) library. For examples of using these in Malloy, check out the `flights_custom_vis` model and styles files in the FAA [Sample Models](../samples.md) download.
