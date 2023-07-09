# Query from an API Endpoint (json)
Malloy, using DuckDB, can query an API endpoint and transform it.  The example below reads exchange rate data from the US Treasury and shows the data by currency over time.

## The Semantic Data Model


```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}
source: exchange_rates is 
  duckdb.table('https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/rates_of_exchange?fields=country_currency_desc,exchange_rate,record_date&page[size]=10000&filter=country_currency_desc.json')
```

## Query by Country
Build a line chart showing values by date.  The rate comes back as a string and we convert it into a number.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
run: exchange_rates -> {
  group_by: data.country_currency_desc
  # line_chart
  nest: by_date is {
    group_by: 
      data.record_date
      rate is data.exchange_rate::number
  }
}
```