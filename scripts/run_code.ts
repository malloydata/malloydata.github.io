/*
 * Copyright 2023 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import Uglify from "uglify-js";
import { DataStyles, HTMLView } from "@malloydata/render";
import {
  Runtime,
  URLReader,
  QueryMaterializer,
  Result,
  ModelDef,
  annotationToTag,
} from "@malloydata/malloy";
import { DuckDBConnection } from "@malloydata/db-duckdb";
import path from "path";
import { promises as fs } from "fs";
import { performance } from "perf_hooks";
import { timeString } from "./utils";
import { log } from "./log";
import { JSDOM } from "jsdom";
import { highlight } from "./highlighter";

const MODELS_PATH = path.resolve("./models");
const DOCS_ROOT_PATH = path.resolve("./src");

export const DEPENDENCIES = new Map<string, string[]>();

/*
 * Add a known dependency to the `DEPENDENCIES` map.
 */
function addDependency(modelPath: string, documentPath: string) {
  const key = modelPath.substring(MODELS_PATH.length);
  const existing = DEPENDENCIES.get(key);
  if (existing) {
    if (!existing.includes(documentPath)) {
      existing.push(documentPath);
    }
  } else {
    DEPENDENCIES.set(key, [documentPath]);
  }
}

/*
 * Interface for the options that can appear in magic comments (`--! { ... }`)
 * at the top of Malloy snippets in documentation.
 */
interface RunOptions {
  source?: string;
  size?: string;
  pageSize?: number;
  dataStyles: DataStyles;
  showAs?: "html" | "json" | "sql";
  queryName?: string;
  exploreName?: string;
  isHidden?: boolean;
}

async function fetchFile(url: URL) {
  return fs.readFile(url, "utf8");
}

class DocsURLReader implements URLReader {
  constructor(
    private readonly documentPath: string,
    private readonly inMemoryURLs: Map<string, string>
  ) {}

  async readURL(url: URL): Promise<string> {
    const inMemoryURL = this.inMemoryURLs.get(url.toString());
    if (inMemoryURL !== undefined) {
      return inMemoryURL;
    }
    const contents = await fetchFile(url);
    addDependency(url.toString(), this.documentPath);

    return contents;
  }
}

class ConnectionManager {
  private readonly connections = new Map<string, DuckDBConnection>();

  getConnection(documentPath: string) {
    const directory = path.dirname(documentPath);
    const fullDirectory = path.join(DOCS_ROOT_PATH, directory);
    const existing = this.connections.get(fullDirectory);
    if (existing) {
      return existing;
    }
    const connection = new DuckDBConnection(
      "duckdb",
      undefined,
      fullDirectory,
      {
        rowLimit: 5,
      }
    );
    this.connections.set(fullDirectory, connection);
    return connection;
  }
}

const CONNECTIONS = new ConnectionManager();

function resolveSourcePath(sourcePath: string) {
  return `file://${path.resolve(path.join(MODELS_PATH, sourcePath))}`;
}

function mapKeys<KA, V, KB>(
  map: Map<KA, V>,
  mapKey: (key: KA) => KB
): Map<KB, V> {
  return new Map(
    [...map.entries()].map(([key, value]) => [mapKey(key), value])
  );
}

/*
 * Run a `query` appearing within a document at `documentPath` with `options`,
 * and render the result as a string (HTML).
 */
export async function runCode(
  code: string,
  documentPath: string,
  options: RunOptions,
  inlineModels: Map<string, string>
): Promise<string> {
  const urlReader = new DocsURLReader(
    documentPath,
    mapKeys(inlineModels, resolveSourcePath)
  );
  const connection = CONNECTIONS.getConnection(documentPath);
  const runtime = new Runtime({ urlReader, connection });

  // Here, we assume that docs queries that reference a model only care about
  // things _exported_ from that model. In other words, a query with
  // `"source": "something.malloy" is equivalent to prepending the query with
  // `import "something.malloy"` (and is useful only to avoid having to include
  // the import statement at the top of each code snippet). If this assumption
  // proves to be incorrect, this function should be modified to first compile
  // the source model and pass it in to translation of the query, allowing the
  // query to reference non-exported members of the model. It may be argued that
  // querying a model in this way is only useful as a developer experience,
  // because it ignores the actual specified interface of the model. Therefore,
  // it may be a good idea to force something to be exported if it needs to be
  // queried in a docs snippet.
  const fullCode = options.source
    ? `import "${resolveSourcePath(options.source)}"\n${code}`
    : code;

  const querySummary = `"${code.split("\n").join(" ").substring(0, 50)}..."`;
  log(`  >> Running query ${querySummary}`);
  const runStartTime = performance.now();

  // Docs are compiled from source, not from a URL. This means that relative
  // imports don't work. It shouldn't be necessary to show relative imports
  // in runnable docs. If this changes, the `urlReader` will need to be able to
  // handle reading a fake URL for the query as well as real URLs for local files.
  let runnable: QueryMaterializer;
  if (options.queryName && options.exploreName) {
    runnable = runtime
      .loadModel(fullCode)
      .loadExploreByName(options.exploreName)
      .loadQueryByName(options.queryName);
  } else if (options.queryName) {
    runnable = runtime.loadModel(fullCode).loadQueryByName(options.queryName);
  } else {
    runnable = runtime.loadQuery(fullCode);
  }
  const queryResult = await runnable.run({
    rowLimit: options.pageSize || 5,
  });

  log(
    `  >> Finished running query ${querySummary} in ${timeString(
      runStartTime,
      performance.now()
    )}`
  );

  return renderResult(queryResult, options);
}

// Simple check to prevent dropping sources named "location"
const isLocation = (value: unknown) => {
  return value && typeof value === "object" && "url" in value;
};

const stripLocation = (modelDef: ModelDef): ModelDef => {
  return JSON.parse(JSON.stringify(modelDef), (key, value) => {
    if (["location", "at"].includes(key) && isLocation(value)) {
      return undefined;
    } else {
      return value;
    }
  });
};

async function renderResult(
  queryResult: Result,
  options: RunOptions
): Promise<string> {
  const showAs = options.showAs || "html";
  const isNextRenderer = !queryResult.modelTag.has("renderer_legacy");
  const resultContainerId = crypto.randomUUID();
  let htmlResult = "";
  if (isNextRenderer) {
    const script = /* javascript */ `
    (function() {
      const modelDef = ${JSON.stringify(stripLocation(queryResult._modelDef))};
      const queryResult = ${JSON.stringify(queryResult._queryResult)};
      const element = document.getElementById("${resultContainerId}");
      const malloyRender = document.createElement("malloy-render");
      malloyRender.modelDef = modelDef;
      malloyRender.queryResult = queryResult;
      element.appendChild(malloyRender);
    })();`;
    htmlResult += `<script>${Uglify.minify(script).code}</script>`;
  } else {
    const document = new JSDOM().window.document;
    const element = await new HTMLView(document).render(queryResult, {
      dataStyles: {},
    });
    htmlResult = element.outerHTML;
  }
  const jsonResult = await highlight(
    JSON.stringify(queryResult.data.toObject(), null, 2),
    "json"
  );
  const sqlResult = await highlight(queryResult.sql, "sql");

  const htmlSelected = showAs === "html" ? "selected" : "";
  const jsonSelected = showAs === "json" ? "selected" : "";
  const sqlSelected = showAs === "sql" ? "selected" : "";

  return `<div class="result-outer ${options.size || "small"}">
    <div class="result-controls-bar">
      <span class="result-label">QUERY RESULTS</span>
      <div class="result-controls">
        <button class="result-control" ${htmlSelected} data-result-kind="html">HTML</button>
        <button class="result-control" ${jsonSelected} data-result-kind="json">JSON</button>
        <button class="result-control" ${sqlSelected} data-result-kind="sql">SQL</button>
      </div>
    </div>
    <div class="result-middle" data-result-kind="html" ${htmlSelected}>
      <div class="result-inner" id="${resultContainerId}">
        ${htmlResult}
      </div>
    </div>
    <div class="result-middle" data-result-kind="json" ${jsonSelected}>
      <div class="result-inner">
        <pre>${jsonResult}</pre>
      </div>
    </div>
    <div class="result-middle" data-result-kind="sql" ${sqlSelected}>
      <div class="result-inner">
        <pre>${sqlResult}</pre>
      </div>
    </div>
  </div>`;
}

const DOCS_M_TAG_PREFIX = /##\(docs\)\s/;
const DOCS_Q_TAG_PREFIX = /#\(docs\)\s/;

export async function runNotebookCode(
  code: string,
  showCode: string,
  documentPath: string,
  options: RunOptions,
  modelDef: ModelDef
): Promise<{ rendered: string; newModel: ModelDef; isHidden: boolean }> {
  const fakeURL = new URL("file://" + path.join(DOCS_ROOT_PATH, documentPath));
  const urlReader = new DocsURLReader(
    documentPath,
    new Map([[fakeURL.toString(), code]])
  );
  const connection = CONNECTIONS.getConnection(documentPath);
  const runtime = new Runtime({ urlReader, connection });

  const querySummary = `"${showCode
    .split("\n")
    .join(" ")
    .substring(0, 50)}..."`;
  log(`  >> Running (notebook) query ${querySummary}`);
  const runStartTime = performance.now();
  const newModel = runtime
    ._loadModelFromModelDef(modelDef)
    .extendModel(fakeURL);
  const model = await newModel.getModel();
  // TODO this is a quick hack to make each snippet only use its own
  // tags and not those from other cells, unsure if this is the right approach
  // long term, but it prevents `##(docs) hidden` from affecting subsequent cells
  const modelTagParse = annotationToTag(
    {
      notes: model._modelDef?.annotation?.notes,
    },
    { prefix: DOCS_M_TAG_PREFIX }
  );
  const modelTags = modelTagParse.tag;
  const newModelDef = model._modelDef;
  let hasQuery = false;
  try {
    // TODO this is ugly, and there should be a way to ask "how many queries are there?"
    model.preparedQuery;
    hasQuery = true;
  } catch {}
  options.isHidden = modelTags.has("hidden");

  if (hasQuery) {
    const runnable = newModel.loadFinalQuery();
    const query = await runnable.getPreparedQuery();
    const tags = query.tagParse({ prefix: DOCS_Q_TAG_PREFIX }).tag;
    options.pageSize = tags.numeric("limit");
    options.size = tags.text("size");
    options.showAs = tags.has("html")
      ? "html"
      : tags.has("sql")
      ? "sql"
      : tags.has("json")
      ? "json"
      : "html";
    const queryResult = await runnable.run({
      rowLimit: options.pageSize || 5,
    });

    log(
      `  >> Finished running query ${querySummary} in ${timeString(
        runStartTime,
        performance.now()
      )}`
    );

    const rendered = await renderResult(queryResult, options);
    return {
      rendered,
      newModel: newModelDef,
      isHidden: options.isHidden,
    };
  } else {
    return {
      rendered: "",
      newModel: newModelDef,
      isHidden: options.isHidden,
    };
  }
}
