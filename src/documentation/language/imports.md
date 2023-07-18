# Imports

In order to reuse or extend a source from another file, you can include all the
exported sources from another file using `import "path/to/some/file.malloy"`.

For example, if you wanted to create a file <code>samples/flights_by_carrier.malloy</code> with a query from the `flights` source, you could write:

```malloy
import "faa/flights.malloy"

query: flights -> { top: 5; group_by: carrier; aggregate: flight_count }
```

## Import Locations

Imported files may be specified with relative or absolute URLs.

| Import Statement | Meaning from `"file:///f1/a.malloy"` |
| ---------------- | --------|
| `import "b.malloy"` | `"file:///f1/b.malloy"` |
| `import "./c.malloy"` | `"file:///f1/c.malloy"` |
| `import "/f1/d.malloy"` | `"file:///f1/d.malloy"` |
| `import "file:///f1/e.malloy"` | `"file:///f1/e.malloy"` |
| `import "../f2/f.malloy"` | `"file:///f2/f.malloy"` |
| `import "https://example.com/g.malloy"` | `"https://example.com/g.malloy"` |
