## Documentation Development

Documentation is a static site built using entirely custom generation.

Source for documentation lives in the `/src` directory. Any `.md`
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

Your system must be authenticated to a BigQuery instance with access to all the public tables referenced in the `/models` models.

### Develop

For developing the documentation:

```
npm run serve
```

This will build the docs, watch for file changes in any of the docs, static files, or sample models, and serve the result at [http://127.0.0.1:4000](http://127.0.0.1:4000).

Jekyll hot-reloading is enabled, so pages should automatically refresh when changes are made. When initial compilation is complete, a browser should open to the home page.

Code blocks in the documentation may begin with a command string to indicate
whether the code should be run, and how the query should be compiled or the results
formatted. This command string is JSON-formatted and must appear on the first
line in a comment with an `!`, like: `--! { "isRunnable": true }`. For example,

````
```malloy
--! {"isRunnable": true, "source": "flights.malloy", "size": "large"}
flights -> sessionize
```
````

Currently, options include `isRunnable` (which must be `true` for the snippet
to run), `project` (which refers to a directory in `/models`), `model` (
which refers to a file (not including the `.malloy` extension inside that
directory), and `size` (which adjusts the maximum scroll size of the results).

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
