# Iowa Liquor Malloy Model

This is the malloy model used for the Analysis example.  It should be used as a reference when looking at the [Iowa Liquor analysis](iowa.md).

```malloy
source: iowa is table('malloy-data.iowa_liquor_sales.sales_deduped'){

  -- dimensions
  dimension:
    gross_margin is 100 * (state_bottle_retail - state_bottle_cost) / nullif(state_bottle_retail, 0)
    price_per_100ml is state_bottle_retail / nullif(bottle_volume_ml, 0) * 100

    category_class is category_name :
      pick 'WHISKIES' when ~ r'(WHISK|SCOTCH|BOURBON|RYE)'
      pick 'VODKAS' when ~ r'VODKA'
      pick 'RUMS' when ~ r'RUM'
      pick 'TEQUILAS' when ~ r'TEQUILA'
      pick 'LIQUEURS' when ~ r'(LIQUE|AMARETTO|TRIPLE SEC)'
      pick 'BRANDIES' when ~ r'BRAND(I|Y)'
      pick 'GINS' when ~ r'GIN'
      pick 'SCHNAPPS' when ~ r'SCHNAP'
      else 'OTHER'

    bottle_size is bottle_volume_ml ?
      pick 'jumbo (over 1000ml)' when > 1001
      pick 'liter-ish' when >= 750
      else 'small or mini (under 750ml)'

  -- measures
  measure:
    total_sale_dollars is sale_dollars.sum()
    item_count is count(distinct item_number)
    total_bottles is bottles_sold.sum()
    line_item_count is count()
    avg_price_per_100ml is price_per_100ml.avg()

  -- turtles
  query: by_month is {
    order_by: 1
    group_by: purchase_month is `date`.week
    aggregate: total_sale_dollars
  }

  query: top_sellers_by_revenue is {
    top: 5
    group_by:
      vendor_name
      item_description
      total_sale_dollars
    aggregate:
      total_bottles
      avg_price_per_100ml
  }

  query: most_expensive_products is {
    top: 10
    order_by: avg_price_per_100ml desc
    group_by:
      vendor_name
      item_description
    aggregate:
      total_sale_dollars
      total_bottles
      avg_price_per_100ml
  }

  query: by_vendor_bar_chart is {
    top: 10
    group_by: vendor_name
    aggregate:
      total_sale_dollars
      total_bottles
  }

  query: by_class is {
    top: 10
    group_by: category_class
    aggregate:
      total_sale_dollars
      item_count
  }

  query: by_category is {
    top: 10
    group_by: category_name
    aggregate:
      total_sale_dollars
      item_count
  }

  query: by_sku is {
    group_by: item_description
    aggregate: total_sale_dollars
    limit: 5
  }

  query: vendor_dashboard is {
    group_by: vendor_count is count(distinct vendor_number)
    aggregate:
      total_sale_dollars
      total_bottles
    nest: by_month
    nest: by_class
    nest: by_vendor_bar_chart
    nest: top_sellers_by_revenue
    nest: most_expensive_products
    nest: by_vendor_dashboard is {
      top: 10
      group_by: vendor_name
      aggregate: total_sale_dollars
      nest: by_month
      nest: top_sellers_by_revenue
      nest: most_expensive_products
    }
  }
}
```

## Schema Overview
The schema for the table `bigquery-public-data.iowa_liquor_sales.sales` as well as descriptions of each field can be found on the [Iowa Data site](https://data.iowa.gov/Sales-Distribution/Iowa-Liquor-Sales/m3tr-qhgy).
