## Documentation Development

Documentation is a static site built using entirely custom generation.

Source for documentation lives in the `/src` directory. Any `.malloynb`
files will be included in compiled documentation, `table_of_contents.json`
specifies the sidebar, and any other files will be copied as static files,
with some handlebars replacement.

Custom preprocessing is done in `/scripts/index.ts`.

### Installation

Jekyll and Ruby are no longer required! Just install `npm` and then install dependencies:

```
npm install
```

### Compile

To compile the documentation, run:

```
 npm run build
 ```

### Develop

For developing the documentation:

```
npm run serve
```

This will build the docs, watch for file changes in any of the docs, static files, or sample models, and serve the result at [http://127.0.0.1:4000](http://127.0.0.1:4000).

Jekyll hot-reloading is enabled, so pages should automatically refresh when changes are made. When initial compilation is complete, a browser should open to the home page.

Malloy sections in the documentation notebooks may contain tags to indicate how queries should be run and rendered, e.g.

````
```malloy
#(docs) size=large limit=100
flights -> sessionize
```
````

Options:
* `#(docs) size=small`: change the height of the query results view; options are `small` (default), `medium`, and `large`
* `#(docs) limit=100`: set the limit for top-level number of rows to fetch; default is `5`; useful for top-level charts
* `#(docs) html`: show the results as HTML (default)
* `#(docs) json`: show the results as JSON
* `#(docs) sql`: show the results as SQL
* `##(docs) hidden`: do not show this code block (useful for imports and modeling)

### Style

The following list describes style conventions used in the docs.

- Use headers (`# Foo`, `## Bar`, etc.) to organize document structure, not for
  emphasis. If you want to show emphasis, do it with `**bold**` or `_italics_`.
- Code spans (`` `source flights` ``) are by default _Malloy_ syntax-highlighted. If
  you are writing a code span with code in any other language, use an HTML code tag,
  e.g. `<code>SELECT *</code>`

### Deploy

To deploy the docs, use the following steps:

1. Merge any docs changes into `main`
2. A CloudBuild trigger will automatically publish the changes once they are built,
   which can take around 2-4 minutes.
