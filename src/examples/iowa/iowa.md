# Understanding the Iowa Liquor Market Using Malloy
Liquor sales in Iowa are state-controlled, with all liquor wholesale run by the state. All purchases and sales of liquor that stores make are a matter of public record. We are going to explore this data set to better understand the Iowa Liquor market.

All data here is stored in BigQuery, in the table `'bigquery-public-data.iowa_liquor_sales.sales'`.

_The [Malloy data model](source.md) can be reviewed in examples under ['iowa'](https://github.com/malloydata/malloy-samples/blob/main/bigquery/iowa/iowa.malloy)._

## A quick overview of the dataset:

* **Date/Time information** (`` `date` ``)
* **Store and Location** (`store_name`, `store_address`, `store_location`, `city`, `county`, and `zip_code`)
* **Vendor information** (`vendor_name`, `vendor_number`)
* **Item information** (`item_number`, `item_description`, `category`, `category_name`)
* **Volume Information** (`bottle_volume_ml`, `bottles_sold`, `volume_sold_liters`, `volume_sold_gallons`)
* **Pricing information** (`state_bottle_cost`, `state_bottle_retail`, and `sale_dollars`)

## Adding Basic Calculations to the Model
In this section, we will create a data model with a few basic calculations: `total_sale_dollars`, `item_count`, `line_item_count`, `price_per_100ml` and `avg_price_per_100ml`.  These calculations will be use in subsequent analysis.

To start, we create a source called `iowa`, based on a table in BigQuery, `malloy-data.iowa_liquor_sales.sales_deduped`:

```malloy
source: iowa is table('malloy-data.iowa_liquor_sales.sales_deduped')
```

### *total_sale_dollars* - What was the total volume of transactions?
The calculation `total_sale_dollars` will show us the total amount, in dollars, that Iowa State stores sold.

```malloy
source: iowa is table('malloy-data.iowa_liquor_sales.sales_deduped') {
  measure:
    total_sale_dollars is sale_dollars.sum()
}
```
We can now reference `total_sale_dollars` to see the top items purchased by Liquor stores.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "iowa/iowa.malloy", "isPaginationEnabled": false, "pageSize": 100, "size": "small"}
query: iowa -> {
  group_by: vendor_name, item_description
  aggregate: total_sale_dollars
}
```

### *item_count* - How many different kinds of items were sold?
This lets us understand whether a vendor sells one item, or many different kinds of items.

```malloy
source: iowa is table('malloy-data.iowa_liquor_sales.sales_deduped') {
  measure:
    total_sale_dollars is sale_dollars.sum()
    item_count is count(distinct item_number)
}
```

We can see which Vendors have the greatest breadth of products as it relates to sales volume.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "iowa/iowa.malloy", "isPaginationEnabled": false, "pageSize": 100, "size": "small"}
query: iowa -> {
  group_by: vendor_name
  aggregate: item_count, total_sale_dollars
}
```

A few observations here: Jim Bean Brands has the greatest variety of items in this dataset. Yahara Bay Distillers Inc sells 275 different items but only has $100K in sales, while Fifth Generation sells only 5 different items, yet has $3M in volume.

### *gross_margin* - How much did the state of Iowa make on this item?
We have both the bottle cost (`state_bottle_cost`) and bottle price (`state_bottle_retail`), allowing us to calculate percent gross margin on a per-item basis, giving us a new a dimension.

```malloy
source: iowa is table('malloy-data.iowa_liquor_sales.sales_deduped') {
  dimension:
    gross_margin is
      100 * (state_bottle_retail - state_bottle_cost) /
        nullif(state_bottle_retail, 0)

  measure:
    total_sale_dollars is sale_dollars.sum()
    item_count is count(distinct item_number)
}
```

Looking at gross margin across top selling items, we see that the gross margin is a *consistent 33.3 percent*.  A quick google search reveals that Iowa state law dictates the state can mark up liquor by up to 50% of the price from the vendor, so this makes sense!

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "iowa/iowa.malloy", "isPaginationEnabled": false, "pageSize": 100, "size": "small"}
query: iowa -> {
  group_by: item_description, state_bottle_retail, state_bottle_cost, gross_margin
  aggregate: total_sale_dollars
}
```

### *total_bottles* - How many individual bottles were sold?

```malloy
total_bottles is bottles_sold.sum()
```

### *line_item_count* - How many line items were on the purchase orders?
This is basically what a single record represents in this data set.

```malloy
line_item_count is count()
```

### *price_per_100ml* - How expensive is this booze?
Given the price of a bottle and its size (in ml), we can compute how much 100ml costs.  This becomes an attribute of an individual line item (a dimension, not a measure).

```malloy
price_per_100ml is state_bottle_retail / nullif(bottle_volume_ml, 0) * 100
```

### *avg_price_per_100ml* - How expensive is this class of booze?
Using our newly defined `price_per_100ml` as an attribute of a line item in a purchase order, we might like an average that we can use over a group of line items.  This is a simple example using line_items as the denominator, but an argument could be made to use per bottle something more complex.

```malloy
avg_price_per_100ml is price_per_100ml.avg()
```

With all of these measures and dimensions defined, our model looks like this:

```malloy
source: iowa is table('malloy-data.iowa_liquor_sales.sales_deduped') {
  dimension:
    gross_margin is
      100 * (state_bottle_retail - state_bottle_cost) / nullif(state_bottle_retail, 0)
    price_per_100ml is state_bottle_retail / nullif(bottle_volume_ml, 0) * 100

  measure:
    total_sale_dollars is sale_dollars.sum()
    item_count is count(distinct item_number)
    total_bottles is bottles_sold.sum()
    line_item_count is count()
    avg_price_per_100ml is price_per_100ml.avg()
}
```

## First Analysis, What are the top Brands and Price Points?

Now we'll use the measures we defined in the last section to write some basic queries to understand the Vodka market, and answer a few questions:  *What are the most popular brands?  Which is the most expensive?  Does a particular county favor expensive or cheap Vodka?*  We will then learn how to save a named query and use it as a basic **Nested Query**.

### Most popular vodka by dollars spent
We start by [filtering the data](../../language/filters.md) to only include purchase records where the category name contains `'VODKA'`.  We group the data by vendor and description, and calculate the various totals. Note that Malloy [automatically orders](../../language/order_by.md) the results by the first measure descending (in this case).

Notice that the greatest sales by dollar volume is *Hawkeye Vodka*, closely followed by *Absolut*.  A lot more bottles of *Hawkeye* were sold, as it is 1/3 the price by volume of *Absolut*.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "iowa/iowa.malloy", "isPaginationEnabled": false, "pageSize": 100, "size": "large"}
query: iowa { where: category_name ~ r'VODKA' } -> {
  top: 5
  group_by: vendor_name, item_description
  aggregate: total_sale_dollars, total_bottles, avg_price_per_100ml
}
```
### Adding a Query to the model.
This particular view of the data is pretty useful, an something we expect to re-use.  We can add this query to the model by incorporating it into the source definition:

```malloy
source: iowa is table('bigquery-public-data.iowa_liquor_sales.sales'){
  dimension:
    gross_margin is
      100 * (state_bottle_retail - state_bottle_cost) / nullif(state_bottle_retail, 0)
    price_per_100ml is state_bottle_retail / nullif(bottle_volume_ml, 0) * 100

  measure:
    total_sale_dollars is sale_dollars.sum()
    total_bottles is sum(bottles_sold)
    price_per_100ml is state_bottle_retail / nullif(bottle_volume_ml, 0) * 100
    avg_price_per_100ml is price_per_100ml.avg()

  query: top_sellers_by_revenue is {
    top: 5
    group_by: vendor_name, item_description
    aggregate: total_sale_dollars, total_bottles, avg_price_per_100ml
  }
}
```

### Examining Tequila

Once the query is in the model we can simply call it by name, adjusting our filtering to ask questions about Tequila instead:

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "iowa/iowa.malloy", "isPaginationEnabled": false, "pageSize": 100, "size": "medium"}
query: iowa { where: category_name ~ r'TEQUILA' } -> top_sellers_by_revenue
```

Here we can see that *Patron Tequila Silver* is the most premium brand, followed by *Jose Cuervo* as a mid-tier  brand, with *Juarez Tequila Gold* more of an economy brand.

### Nested Subtables: A deeper look at a Vendor offerings
The magic happens when we call a named query in the same way we would use any other field [nesting](../../language/nesting.md). In the below query, we can see our vendors sorted automatically by amount purchased, as well as the top 5 items for each vendor.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "iowa/iowa.malloy", "isPaginationEnabled": false, "pageSize": 100, "size": "medium"}
query: iowa { where: category_name ~ r'TEQUILA' } -> {
  group_by: vendor_name
  aggregate: total_sale_dollars, avg_price_per_100ml
  nest: top_sellers_by_revenue // entire query is a field
}
```

### Bucketing the data
The `price_per_100ml` calculation, defined in the previous section, combines with our new named query to allow for some interesting analysis. Let's take a look at the entire Tequila category, and see the leaders within each price range.  We'll bucket `price_per_100ml` into even dollar amounts, and nest our `top_sellers_by_revenue` query to create a subtable for each bucket.

At the top we see our lowest cost options at under $1/mL, with the more pricey beverages appearing as we scroll down.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "iowa/iowa.malloy", "isPaginationEnabled": false, "pageSize": 100, "size": "medium"}
query: iowa { where: category_name ~ r'TEQUILA' } -> {
  group_by: price_per_100ml_bucket is floor(price_per_100ml)
  nest: top_sellers_by_revenue
}
```

## Bucketing and Mapping: Categories and Bottles

Our previous analysis of price per mL brings to mind questions around bottle size. How many different sizes do bottles come in?  Are there standards and uncommon ones?  Do vendors specialize in different bottle sizes?

### Building *category_class*, a simplified version of *category_name*

Using the query below, we can see that there are 68 different category names in the data set.  We can notice there is *80 Proof Vodka*, *Flavored Vodka* and more.  It would be helpful if we just could have all of these categorized together as vodkas.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "iowa/iowa.malloy", "isPaginationEnabled": false, "pageSize": 100, "size": "small"}
query: iowa -> {
  aggregate: distinct_number_of_category_names is count(distinct category_name)
  nest: sizes is {
    group_by: category_name
    aggregate: item_count, line_item_count
  }
}
```

Malloy provides a simple way to map all these values, using `pick` expressions.  In our source definition for `iowa`, let's add the following field as a dimension, `category_class`.  Each pick expression tests `category_name` for a regular expression.  If it matches, it returns the name pick'ed.

```malloy
category_class is category_name ?
  pick 'WHISKIES' when ~ r'(WHISK|SCOTCH|BURBON|RYE)'
  pick 'VODKAS' when ~ r'VODKA'
  pick 'RUMS' when ~ r'RUM'
  pick 'TEQUILAS' when ~ r'TEQUILA'
  pick 'LIQUEURS' when ~ r'(LIQUE|AMARETTO|TRIPLE SEC)'
  pick 'BRANDIES' when ~ r'BRAND(I|Y)'
  pick 'GINS' when ~ r'GIN'
  pick 'SCHNAPPS' when ~ r'SCHNAP'
  else 'OTHER'
```

Let's take a look at each category class and see how many individual items it has.  We'll also build a nested query that shows the `category_name`s that map into that category class.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "iowa/iowa.malloy", "isPaginationEnabled": false, "pageSize": 100, "size": "small", "dataStyles": { "names_list": { "renderer": "list_detail" } } }
query: iowa -> {
  group_by: category_class
  aggregate: item_count
  nest: names_list is {
    group_by: category_name
    aggregate: item_count
  }
}
```

With our new lens, we can now see the top sellers in each `category_class`, allowing us to get an entire market summary with a single simple query.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "iowa/iowa.malloy", "isPaginationEnabled": false, "pageSize": 100, "size": "small"}
query: iowa -> {
  group_by: category_class
  aggregate: total_sale_dollars
  nest: top_sellers_by_revenue
}
```

### Understanding Bottle Sizes

In this data set, there is a column called `bottle_volume_ml`, which is the bottle size in mL. Let's take a look.

A first query reveals that there are 34 distinct bottle sizes in this data set, and that 750ml, 1750ml and 1000ml are by far the most common.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "iowa/iowa.malloy", "isPaginationEnabled": false, "pageSize": 100, "size": "small"}
query: iowa -> {
  aggregate: distinct_number_of_sizes is count(distinct bottle_volume_ml)
  nest: sizes is {
    group_by: bottle_volume_ml
    aggregate: line_item_count
  }
}
```

Visualizing this query suggests that we might wish to create 3 distinct buckets to approximate small, medium and large bottles.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "iowa/iowa.malloy", "isPaginationEnabled": false, "pageSize": 100, "size": "medium", "dataStyles": { "sizes": { "renderer": "bar_chart" } } }
query: iowa -> {
  aggregate: distinct_number_of_sizes is count(distinct bottle_volume_ml)
  nest: sizes is {
    group_by: bottle_volume_ml
    aggregate: line_item_count
    where: bottle_volume_ml < 6000
  }
}
```

Looking at the above chart and table we can see that there are a bunch of small values, several big values at 750 and 1000, and then a bunch of larger values.  We can clean this up by bucketing bottle size into three groups using a Malloy `pick` expression that maps these values to strings. Let's add a new `bottle_size` dimension to the `iowa` source:

```malloy
bottle_size is bottle_volume_ml ?
  pick 'jumbo (over 1000ml)' when > 1001
  pick 'liter-ish' when >= 750
  else 'small or mini (under 750ml)'
```

And now look at the data with this new dimension:

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "iowa/iowa.malloy", "isPaginationEnabled": false, "pageSize": 100, "size": "small"}
query: iowa -> {
  group_by: bottle_size
  aggregate: total_sale_dollars, line_item_count, item_count
  order_by: bottle_size
}
```

## Putting It All Together With a Dashboard

Malloy can render a full dashboard with many elements, combining several of the different measures and dimensions we defined above. This is a single Malloy query that will render what you see below:

```malloy
query: vendor_dashboard is {
  group_by: vendor_count is count(distinct vendor_number)
  aggregate:
    total_sale_dollars
    total_bottles
  nest:
    top_sellers_by_revenue
}
```

Here, we run the query with a filter on `VODKAS`:

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "iowa/iowa.malloy", "isPaginationEnabled": false, "pageSize": 100, "size": "large"}
query: iowa { where: category_class = 'VODKAS' } -> vendor_dashboard
```
