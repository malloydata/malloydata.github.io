# Cohort Analysis

One of the most powerful way of understanding what is happening using data is to use *cohort analysis*.
Fundamentally, cohort analysis is used to group people into sets and to analyze the success,
attributes, or characteristics of that group as compared to the population in general.

To understand this, we're going to use data from our make-believe eCommerce website.

We have a table `users` with `first_name`, `gender`, and `state` and we can compute the `total_population is count()` of users with those characteristics.

In the simplest form, a cohort calculation is a [percentage of total calculation](percent_of_total.md).
For example, if we were interested in the name 'Jean' as it relates to location. We could filter on `first_name = 'JEAN'` and look at states as it relates to total population.

We can see that in the population of the the people named 'Jean', the cohort of the Jeans from California makes up 13% of the total userbase of Jeans.

```malloy
--! {"isRunnable": true, "showAs":"html",   "isPaginationEnabled": true, "pageSize":20, "size":"small" }
query: duckdb.table('data/users.parquet') -> {
  where: first_name = 'JEAN'
  aggregate: total_population is count()
  nest: main_query is {
    group_by: state
    aggregate: total_population is count()
  }
} -> {
  project:
    main_query.state
    main_query.total_population
    state_as_percent_of_population is main_query.total_population / total_population * 100.0
  order_by: state_as_percent_of_population desc
}
```

We could run this same query, but instead look by `gender` to see the breakdown of male vs female Jeans.

Using the query below we can see that 93% of all Jeans in the database are female.

```malloy
--! {"isRunnable": true, "showAs":"html",   "isPaginationEnabled": true, "pageSize":20, "size":"small" }
query: duckdb.table('data/users.parquet') -> {
  where: first_name = 'JEAN'
  aggregate: total_population is count()
  nest: main_query is {
    group_by: gender
    aggregate: total_population is count()
  }
} -> {
  project:
    main_query.gender
    main_query.total_population
    gender_as_percent_of_population is main_query.total_population / total_population * 100.0
  order_by: gender_as_percent_of_population desc
}
```

## Names as Cohorts

In the above example, the population was *People named Jean* and we used *state* or *gender* for our cohort (grouping).
Lets flip it around and look at people born with a particular name as a cohort and the other attributes to limit our population.
Let's limit our population to women in California and look at the largest cohorts (people with a given name).  We are also going
to measure a little differently. Instead of looking at a percentage, let's look at the number of users in that cohort per 100,000 users.

```malloy
--! {"isRunnable": true, "showAs":"html",   "isPaginationEnabled": true, "pageSize":20, "size":"small" }
query: duckdb.table('data/users.parquet') -> {
  where: state = 'California' and gender = 'Female'
  aggregate: total_population is count()
  nest: main_query is {
    group_by: first_name
    aggregate: total_population is count()
  }
} -> {
  project:
    main_query.first_name
    main_query.total_population
    per_100k is floor(main_query.total_population / total_population * 100000)
  order_by: per_100k desc
}
```
