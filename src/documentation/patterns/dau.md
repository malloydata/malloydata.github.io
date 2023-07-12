# Computing Daily Active Users
In this example, we'll show how to do basic Daily Active Users, Monthly Active Users and Average Daily Active User computations.

The queries below use the following model

```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}
source: order_items is table('duckdb:data/order_items.parquet') + {
  measure: 
    user_count is count(distinct user_id)
    order_count is count()
}
```
## Weekly Active Users and Daily Active users

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "source": "/inline/e1.malloy", "pageSize":5000}
run: order_items -> {
  where: created_at ? @2022
  group_by: order_week is created_at.week
  aggregate: 
    weekly_active_users is user_count
  nest: by_day is {
    group_by: order_date is created_at.day
    aggregate: daily_active_users is user_count
  }
}
```


## Weekly Active Users and Average Daily Active Users

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "source": "/inline/e1.malloy", "pageSize":5000}
run: order_items -> {
  where: created_at ? @2022
  group_by: order_week is created_at.week
  aggregate: 
    weekly_active_users is user_count
  nest: by_day is {
    group_by: order_date is created_at.day
    aggregate: daily_active_users is user_count
  }
}
-> {
  group_by: 
    order_week
    weekly_active_users
  aggregate:
    average_daily_active_users is by_day.daily_active_users.avg()
}
```

