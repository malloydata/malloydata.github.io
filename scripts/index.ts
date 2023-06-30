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

import path from "path";
import fs from "fs";
import { performance } from "perf_hooks";
import { renderDoc } from "./render_document.js";
import { renderFooter, renderSidebar, Section } from "./page.js";
import {
  isMarkdown,
  readDirRecursive,
  timeString,
  watchDebounced,
  watchDebouncedRecursive,
} from "./utils.js";
import { DEPENDENCIES } from "./run_code.js";
import { log } from "./log.js";
import { exit } from "process";
import Handlebars from "handlebars";
import yaml from "yaml";
import { DEFAULT_CONTEXT } from "./context.js";

const __dirname = path.resolve("./scripts/");

const DOCS_ROOT_PATH = path.join(__dirname, "../src");
const OUT_PATH = path.join(__dirname, "../docs/");
const JS_OUT_PATH = path.join(__dirname, "../docs/js/generated");
const CONTENTS_PATH = path.join(DOCS_ROOT_PATH, "table_of_contents.json");
const MODELS_BIGQUERY_PATH = path.join(__dirname, "../models/bigquery");
const LAYOUTS_PATH = path.join(__dirname, "../layouts");
const INCLUDES_PATH = path.join(__dirname, "../includes");

for (const file of fs.readdirSync(INCLUDES_PATH)) {
  const absolutePath = path.join(INCLUDES_PATH, file);
  if (fs.statSync(absolutePath).isFile()) {
    Handlebars.registerPartial(file, fs.readFileSync(absolutePath, "utf-8"));
  }
}

const LAYOUTS = {};
for (const file of fs.readdirSync(LAYOUTS_PATH)) {
  const absolutePath = path.join(LAYOUTS_PATH, file);
  if (fs.statSync(absolutePath).isFile()) {
    LAYOUTS[file] = Handlebars.compile(fs.readFileSync(absolutePath, "utf-8"));
  }
}

const WATCH_ENABLED = process.argv.includes("--watch");

async function compileDoc(file: string, footers: Record<string, string>): Promise<{
  errors: { path: string; snippet: string; error: string }[];
  searchSegments: {
    path: string;
    titles: string[];
    paragraphs: (
      | { type: "p"; text: string }
      | { type: "code"; text: string }
    )[];
  }[];
  renderedDocument: string;
}> {
  try {
    const startTime = performance.now();
    const shortPath = file.substring(DOCS_ROOT_PATH.length);
    const shortOutPath = shortPath.replace(/\.md$/, ".html");
    const outPath = path.join(OUT_PATH, shortOutPath);
    const outDirPath = path.join(outPath, "..");
    fs.mkdirSync(outDirPath, { recursive: true });
    fs.mkdirSync(path.join(OUT_PATH, shortOutPath, ".."), { recursive: true });
    const markdown = fs.readFileSync(file, "utf8");
    // If not a standard layout, just copy
    // if (markdown.startsWith("---\n")) {
    //   fs.writeFileSync(path.join(OUT_PATH2, shortOutPath), markdown);
    //   return {
    //     errors: [],
    //     searchSegments: [],
    //   }
    // }
    const { renderedDocument, errors, searchSegments, frontmatter } = await renderDoc(
      markdown,
      shortPath
    );
    const layoutName = frontmatter.layout ?? "documentation.html";
    // TODO validate that layout exists and log an error if not.
    const compiledPage = LAYOUTS[layoutName]({
      ...DEFAULT_CONTEXT,
      page: {
        ...frontmatter,
        title: "Malloy Documentation",
        content: renderedDocument,
        footer: footers[shortPath],
      }
    });
    fs.writeFileSync(path.join(OUT_PATH, shortOutPath), compiledPage);
    log(
      `File ${outPath.substring(OUT_PATH.length)} compiled in ${timeString(
        startTime,
        performance.now()
      )}.`
    );
    return {
      errors: errors.map((error) => ({ ...error, path: shortPath })),
      searchSegments: searchSegments.map((segment) => ({
        ...segment,
        path: shortPath,
      })),
      renderedDocument
    };
  } catch(e) {
    log("Error compiling:")
    log(e)
  }
}

function rebuildSidebarAndFooters(): { toc: string; footers: Record<string, string> } {
  try {
    const tableOfContents = JSON.parse(fs.readFileSync(CONTENTS_PATH, "utf8"))
      .contents as Section[];

    const renderedSidebar = renderSidebar(tableOfContents);
    Handlebars.registerPartial("toc.html", renderedSidebar);
    log(`File _includes/toc.html written.`);

    const allFiles = readDirRecursive(DOCS_ROOT_PATH);
    const allDocs = allFiles.filter(isMarkdown);

    const footers = {};
    for (const file of allDocs) {
      const shortPath = file.substring(DOCS_ROOT_PATH.length);
      const htmlLink = shortPath.replace(/\.md$/, ".html");
      const footer = renderFooter(tableOfContents, DOCS_ROOT_PATH, htmlLink);
      footers[shortPath] = footer;
    }
    log(`Files _includes/footers/** written.`);
    return { toc: renderedSidebar, footers };
  } catch(e) {
    log(`Error parsing JSON`);
    log(e);
    return { toc: "", footers: {}};
  }
}

function outputSearchSegmentsFile(
  searchSegments: {
    path: string;
    titles: string[];
    paragraphs: (
      | { type: "p"; text: string }
      | { type: "code"; text: string }
    )[];
  }[]
) {
  const file = `window.SEARCH_SEGMENTS = ${JSON.stringify(
    searchSegments,
    null,
    2
  )}`;
  fs.mkdirSync(JS_OUT_PATH, { recursive: true });
  fs.writeFileSync(path.join(JS_OUT_PATH, "search_segments.js"), file);
  log(`File js/generated/search_segments.js written.`);
}

function extractFrontmatter(contents: string) {
  if (contents.startsWith("---\n")) {
    const afterFirstLine = contents.slice(4);
    const endFrontmatter = afterFirstLine.indexOf("\n---\n");
    const frontmatterRaw = afterFirstLine.slice(0, endFrontmatter + 1);
    const rest = afterFirstLine.slice(endFrontmatter + 4);
    return {frontmatterRaw, rest};
  } else {
    return {frontmatterRaw: "", rest: contents};
  }
}

function compileOtherFile(contents: string): string {
  const { frontmatterRaw, rest } = extractFrontmatter(contents);
  const frontmatter = yaml.parse(frontmatterRaw);
  const template = Handlebars.compile(rest);
  const compiledContents = template({
    ...DEFAULT_CONTEXT,
    page: {
      ...frontmatter,
    }
  });
  if (frontmatter?.layout) {
    const template = LAYOUTS[frontmatter.layout];
    const compiledFile = template({
      ...DEFAULT_CONTEXT,
      page: {
        content: compiledContents,
        ...frontmatter,
      }
    });
    return compiledFile;
  } else {
    return compiledContents;
  }
}

function handleStaticFile(file: string) {
  const destination = path.join(
    OUT_PATH,
    file.substring(DOCS_ROOT_PATH.length)
  );
  fs.mkdirSync(path.join(destination, ".."), { recursive: true });
  if (
    ["html", "js", "css"].some(ext => file.endsWith("." + ext))
  ) {
    const contents = fs.readFileSync(file, 'utf-8');
    const compiledContents = compileOtherFile(contents);
    fs.writeFileSync(destination, compiledContents);
  } else {
    fs.copyFileSync(file, destination);
  }
}

(async () => {
  const allFiles = readDirRecursive(DOCS_ROOT_PATH);
  const allDocs = allFiles.filter(isMarkdown);
  const staticFiles = allFiles.filter((file) => !isMarkdown(file));
  let { toc, footers } = rebuildSidebarAndFooters();
  for (const file of staticFiles) {
    handleStaticFile(file);
  }
  const startTime = performance.now();
  const results = await Promise.all(allDocs.map(f => compileDoc(f, footers)));
  const allErrors = results.map(({ errors }) => errors).flat();
  const allSegments = results
    .map(({ searchSegments }) => searchSegments)
    .flat();
  // TODO make this update in watch mode
  outputSearchSegmentsFile(allSegments);
  log(`All docs compiled in ${timeString(startTime, performance.now())}`);
  fs.writeFileSync(path.join(OUT_PATH, "done.txt"), "done");
  if (WATCH_ENABLED) {
    log(`\nWatching /documentation and /models for changes...`);
    watchDebouncedRecursive(DOCS_ROOT_PATH, (type, file) => {
      const fullPath = path.join(DOCS_ROOT_PATH, file);
      if (isMarkdown(file)) {
        log(`Markdown file ${file} ${type}d. Recompiling...`);
        compileDoc(fullPath, footers);
      } else {
        if (fs.existsSync(fullPath)) {
          handleStaticFile(file);
        } else {
          fs.unlinkSync(path.join(OUT_PATH, file));
          log(`Static file ${file} deleted. Removed.`);
        }
      }
    });
    watchDebouncedRecursive(MODELS_BIGQUERY_PATH, (type, file) => {
      log(`Model file ${file} ${type}d. Recompiling dependent documents...`);
      console.log(DEPENDENCIES);
      for (const doc of DEPENDENCIES.get(file) || []) {
        const fullPath = path.join(DOCS_ROOT_PATH, doc);
        compileDoc(fullPath, footers);
      }
    });
    watchDebounced(CONTENTS_PATH, (type) => {
      log(`Table of contents ${type}d. Recompiling...`);
      const result = rebuildSidebarAndFooters();
      footers = result.footers;
      // TODO rebuild all docs to have the new toc....
    });
  } else {
    if (allErrors.length > 0) {
      log(
        `Failure: ${allErrors.length} example snippet${
          allErrors.length === 1 ? "" : "s"
        } had errors`
      );
      allErrors.forEach((error) => {
        log(`Error in file ${error.path}: ${error.error}`);
        log("```");
        log(error.snippet);
        log("```");
      });
      exit(1);
    }
  }
})();
