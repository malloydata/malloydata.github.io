# Nested Subtotals

Nested subtotals are [quite painful to do in SQL](https://gist.github.com/carlineng/82866612beeb86632f8c23d458a1a5bc), requiring either self-joins or window functions. Unfortunately for analysts, it's also a very common type of analysis requested by business owners; for example, determing which segments of a population drove revenue growth, and drilling down into more granular segmentations.

To see how we do this in Malloy, let's look at the following simple model:

```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}

source: order_items is duckdb.table('data/order_items.parquet') {
  primary_key: id

  join_one: inventory_items is table('duckdb:data/inventory_items.parquet') on inventory_item_id = inventory_items.id

  measure:
    total_sales is sale_price.sum()
    sales_2022 is total_sales { where: created_at.year = @2022 }
    sales_2021 is total_sales { where: created_at.year = @2021}

  query: sales_summary_yoy is {
      aggregate:
        sales_2022
        sales_growth is sales_2022 - sales_2021
        sales_yoy is sales_2022 / nullif(sales_2021, 0) - 1
  }
}
```

This contains a single table of order items, and some measures to calculate sales and sales growth. The `sales_summary_yoy` query calculates overall sales for the most recent year, sales growth, and sales growth percentage:

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "source": "/inline/e1.malloy", "pageSize":5000}
run: order_items -> sales_summary_yoy
```

Now suppose we want to drill into the sales numbers. In addition to overall sales growth, we want to calculate year-over-year sales growth by department. To do this in SQL would require either a window functions or a self-join to compute the overall total, and join to the grouped total. In Malloy, none of this is necessary, we simply use a `nest` clause, combined with a [query refinement](../language/query.md#refinement).

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "source": "/inline/e1.malloy", "pageSize":5000}
run: order_items -> sales_summary_yoy + {
  nest: by_department is sales_summary_yoy + {
    group_by: inventory_items.product_department
    order_by: product_department
  }
}
```

Query refinement is similar to extending a class in object-oriented programming. It allows us to add additional fields to an already-existing query. In this case, we nest the `sales_summary_yoy` query, and refine it with an additional group-by on `product_department`. This allows us to look at revenue, growth, and growth percentage for each department.

To drill down even further, it's trivial to repeat this pattern once again. The following query looks at revenue, growth, and growth percentage for the top 5 product categories for each of the departments:

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "source": "/inline/e1.malloy", "pageSize":5000}
run: order_items -> sales_summary_yoy + {
  nest: by_department is sales_summary_yoy + {
    group_by: inventory_items.product_department
    order_by: product_department
    nest: by_category is sales_summary_yoy + {
      group_by: inventory_items.product_category
      order_by: sales_growth desc
      limit: 5
    }
  }
}
```

These queries are trivial to implement, and easy to understand. If you'd like a challenge, try implementing the same thing in SQL and see what it looks like.
