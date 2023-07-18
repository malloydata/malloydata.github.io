# Rendering Results

When Malloy runs a query, it returns two things; the *results* of the query and *metadata* about the results. The metadata contains the schema for the results, including type information. Malloy also provides a mechanism to tag fields and queries in the source code with additional metadata. 

In Malloy, anything that can be named can be tagged. A tag starts with a `#`. Tags that start on a new line attach to the definition on the following line. For more details about how tagging works, see the [Tags](../language/tags.md) section.

Malloy's rendering library interprets these tags to change how results are rendered.

## Tagging Individual Fields
In the query below, the measure **percent_of_total** is tagged as a percentage.  Anytime *percent_of_total* is used in a query, Malloy's rendering library will be displayed as a percentage.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "small", "pageSize":5000}
source: flights is duckdb.table('data/flights.parquet') extend {
  measure:
    flight_count is count()
    # percent
    percent_of_flights is flight_count / all(flight_count)
}

run: flights -> {
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

Simply adding `# bar_chart` before the query tags it and tells the rendering library to show the result as a bar chart. See the docs on the [Bar Chart tag](./bar_charts.md) for more information.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "pageSize":5000}
# bar_chart
run: duckdb.table('data/flights.parquet') ->  {
  group_by: carrier
  aggregate: flight_count is count()
}
```

Malloy's renderering library uses [Vega-Lite](https://vega.github.io/vega-lite/) for charting, allowing visualization of results. Malloy's rendering library is a separate layer from Malloy's data access layer.

Tags for Queries in Malloy's renderer include:

* [Bar Chart](bar_charts.md): `bar_chart`
* [Line Chart](charts_line_chart.md): `line_chart`
* [Scatter Chart](scatter_charts.md): `scatter_chart`
* [Shape Map](shape_maps.md): `shape_map`
* [Segment Map](segment_maps.md): `segment_map`
* [Dashboard](dashboards.md): `dashboard`

Tags can be applied to queries where they are defined in sources, when nested, or when run.

## Additional Charting with Vega Lite
The `vega` renderer allows much more customization of rendering than the default visualization options provided in the Extension, using the [Vega-Lite](https://vega.github.io/vega-lite/) library. For examples of using these in Malloy, check out the `flights_custom_vis` model and styles files in the FAA [Sample Models](../samples.md) download.
