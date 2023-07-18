# Transforming Data

Malloy can be used to for data transformation.  Files with the extension `.malloysql` are interpreted as a combination of both Malloy and SQL.  Each language is blocked by a preceeding `>>>`.  Each block can do anything that is appropriate in the language.  In Malloy, for example, you can import other Malloy files.  In SQL, you can execute any DDL command.

In the example below, we create a simple semantic model for the table `airports`.  There are two SQL sections, one creates a CSV file of the major airports, the other creates a view in the database that return the table as a list of states, whe the facility types nested below.

This meachanim can be used to create governed datasets for use in other tooling.  As the code for these transformed tables is centralized and this techniqute takes advantage of Malloy's reusibility.


File: `airports.malloysql`:
```malloysql
>>>malloy
source: airports is duckdb.table('data/airports.parquet') extend {
  measure: airport_count is count()

  query: major_airports is -> {
    where: major = 'Y'
    project: *
  }

  query: by_state is -> {
    group_by: state
    aggregate: airport_count
    nest: by_fac_type is -> {
      group_by: fac_type
      aggregate: airport_count
    }
  }
}

>>>sql connection:duckdb

-- create a table using a Malloy query

COPY (
%{
  airports -> major_airports
}%
) TO 'major_airports.csv' (HEADER) 

>>>sql

-- create a view using a Malloy query

CREATE OR REPLACE VIEW  by_state as (
%{
  airports -> by_state
}%
) 
```