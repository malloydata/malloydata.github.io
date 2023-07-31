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
  convertDocPathToHTML,
  hashForHeading,
  isMalloySQL,
  isMarkdown,
  isMarkdownOrMalloySQL,
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
import { Position } from "./markdown_types.js";

const __dirname = path.resolve("./scripts/");

const DOCS_ROOT_PATH = path.join(__dirname, "../src");
const OUT_PATH = path.join(__dirname, "../docs/");
const JS_OUT_PATH = path.join(__dirname, "../docs/js/generated");
const CONTENTS_PATH = path.join(DOCS_ROOT_PATH, "table_of_contents.json");
const MODELS_PATH = path.join(__dirname, "../models");
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

Handlebars.registerHelper('ifeq', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

const WATCH_ENABLED = process.argv.includes("--watch");

async function compileDoc(file: string, footers: Record<string, string>): Promise<{
  errors: { path: string; snippet: string; error: string; position: Position }[];
  searchSegments: {
    path: string;
    titles: string[];
    paragraphs: (
      | { type: "p"; text: string }
      | { type: "code"; text: string }
    )[];
  }[];
  links: {link: string, style: "md" | "html", position: Position}[];
  file: string;
  hashes: string[];
  renderedDocument: string;
}> {
  try {
    const startTime = performance.now();
    const shortPath = file.substring(DOCS_ROOT_PATH.length);
    const shortOutPath = convertDocPathToHTML(shortPath);
    const outPath = path.join(OUT_PATH, shortOutPath);
    const outDirPath = path.join(outPath, "..");
    fs.mkdirSync(outDirPath, { recursive: true });
    fs.mkdirSync(path.join(OUT_PATH, shortOutPath, ".."), { recursive: true });
    const markdown = fs.readFileSync(file, "utf8");
    const template = Handlebars.compile(markdown);
    const templatedMarkdown = template({
      ...DEFAULT_CONTEXT
    });
    const { 
      renderedDocument, 
      errors, 
      searchSegments, 
      frontmatter, 
      links, 
      hashes 
    } = await renderDoc(
      templatedMarkdown,
      shortPath
    );
    const layoutName = frontmatter.layout ?? "documentation.html";
    // TODO validate that layout exists and log an error if not.
    const compiledPage = LAYOUTS[layoutName]({
      ...DEFAULT_CONTEXT,
      page: {
        ...frontmatter,
        url: shortOutPath,
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
      links,
      file,
      hashes,
      renderedDocument
    };
  } catch(e) {
    log("Error compiling:", 'error')
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
    const allDocs = allFiles.filter(isMarkdownOrMalloySQL);

    const footers = {};
    for (const file of allDocs) {
      const shortPath = file.substring(DOCS_ROOT_PATH.length);
      const htmlLink = convertDocPathToHTML(shortPath);
      const footer = renderFooter(tableOfContents, DOCS_ROOT_PATH, htmlLink);
      footers[shortPath] = footer;
    }
    log(`Files _includes/footers/** written.`);
    return { toc: renderedSidebar, footers };
  } catch(e) {
    log(`Error parsing JSON`, 'error');
    log(e, 'error');
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

function validateLinks(
  links: Record<string, {link: string, style: "md" | "html", position: Position}[]>, 
  docs: string[], 
  hashes?: Record<string, string[]>
): { file: string, error: string, position: Position }[] {
  const linkErrors = [];
  const docsRootedPaths = docs.map(f => f.substring(DOCS_ROOT_PATH.length));
  function validateHash(origFile: string, origLink: string, file: string, hash: string, position: Position) {
    if (hashes === undefined) return;
    const hashesForFile = hashes[file];
    if (!hashesForFile || !hashesForFile.includes(hash.slice(1))) {
      linkErrors.push({
        file: origFile.substring(DOCS_ROOT_PATH.length),
        error: `Link ${origLink} is invalid: hash ${hash} doesn't exist in doc ${file.substring(DOCS_ROOT_PATH.length)}`,
        position,
      });
    }
  }
  function checkLink(file: string, originalLink: string, style: "md" | "html", rootedLink: string, position: Position) {
    const linkWithoutHash = rootedLink.replace(/#.*$/, '');
    const hashMatch = rootedLink.match(/#.*$/);
    const hash = hashMatch ? hashMatch[0] : undefined;
    const linkHasExtension = linkWithoutHash.endsWith(".html") || linkWithoutHash.endsWith(".md");
    const linkWithExtension = linkHasExtension ? linkWithoutHash : (linkWithoutHash + ".md");
    if (!docsRootedPaths.includes(linkWithExtension)) {
      const mdVersion = linkWithExtension.replace(/\.html$/, ".md");
      const existsInMd = docsRootedPaths.includes(mdVersion);
      linkErrors.push({ 
        file: file.substring(DOCS_ROOT_PATH.length), 
        error: `Link '${originalLink}' is invalid${existsInMd ? style === "html" ? ' (remove .html extension)' : '(use .md instead)' : ''}.`,
        position,
      });
    } else if (linkHasExtension && style === 'html') {
      linkErrors.push({ 
        file: file.substring(DOCS_ROOT_PATH.length), 
        error: `HTML Link '${originalLink}' should not end with file extension.`,
        position
      });
    } else if (style === 'md' && !linkWithoutHash.endsWith(".md")) {
      linkErrors.push({ 
        file: file.substring(DOCS_ROOT_PATH.length), 
        error: `Markdown Link '${originalLink}' should end with .md`,
        position
      });
    } else if (hash && hashes) {
      validateHash(file, originalLink, path.join(DOCS_ROOT_PATH, linkWithExtension), hash, position);
    }

    // TODO check in section info
  }
  for (const file in links) {
    for (const link of links[file]) {
      if (link.link.startsWith("https://") || link.link.startsWith("http://")) {
        continue;
      }
      if (link.link.startsWith("/")) {
        linkErrors.push({ 
          file: file.substring(DOCS_ROOT_PATH.length), 
          error: `HTML Link '${link.link}' is invalid (absolute links can't be followed in dev environments)`,
          position: link.position
        });
      } else if (link.link.startsWith("#")) {
        if (hashes) {
          validateHash(file, link.link, file, link.link, link.position);
        }
      } else {
        const resolvedLink = path.resolve(file, '..', link.link);
        const rootedLink = resolvedLink.substring(DOCS_ROOT_PATH.length);
        checkLink(file, link.link, link.style, rootedLink, link.position);
      }
    }
  }
  return linkErrors;
}

(async () => {
  const allFiles = readDirRecursive(DOCS_ROOT_PATH);
  const allDocs = allFiles.filter(isMarkdownOrMalloySQL);
  const staticFiles = allFiles.filter((file) => !isMarkdownOrMalloySQL(file));
  let { toc, footers } = rebuildSidebarAndFooters();
  for (const file of staticFiles) {
    handleStaticFile(file);
  }
  const startTime = performance.now();
  const results = await Promise.all(allDocs.map(async f => {
    const result = await compileDoc(f, footers);
    const linkErrors = validateLinks({ [f]: result.links}, allDocs);
    for (const error of linkErrors) {
      log(`Error in file ${error.file}:${error.position.start.line}:${error.position.start.column}: ${error.error}`, 'error');
    }
    return result;
  }));
  const snippetErrors = results.map(({ errors }) => errors).flat();
  const allLinks = Object.fromEntries(results.map(({ links, file }) => [file, links]));
  const allHashes = Object.fromEntries(results.map(({ file, hashes }) => [file, hashes]));
  const linkErrors = validateLinks(allLinks, allDocs, allHashes);
  const allSegments = results
    .map(({ searchSegments }) => searchSegments)
    .flat();
  // TODO make this update in watch mode
  outputSearchSegmentsFile(allSegments);
  log(`All docs compiled in ${timeString(startTime, performance.now())}`, 'success');
  if (WATCH_ENABLED) {
    log(`\nWatching /documentation and /models for changes...`);
    watchDebouncedRecursive(DOCS_ROOT_PATH, (type, file) => {
      const fullPath = path.join(DOCS_ROOT_PATH, file);
      if (isMarkdownOrMalloySQL(file)) {
        log(`Documentation file ${file} ${type}d. Recompiling...`);
        compileDoc(fullPath, footers);
      } else {
        if (fs.existsSync(fullPath)) {
          handleStaticFile(fullPath);
        } else {
          fs.unlinkSync(path.join(OUT_PATH, file));
          log(`Static file ${file} deleted. Removed.`);
        }
      }
    });
    watchDebouncedRecursive(MODELS_PATH, (type, file) => {
      log(`Model file ${file} ${type}d. Recompiling dependent documents...`);
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
    const anyErrors = snippetErrors.length > 0 || linkErrors.length > 0;
    if (linkErrors.length > 0) {
      log(
        `Failure: ${linkErrors.length} link${
          linkErrors.length === 1 ? " was" : "s were"
        } invalid`,
        'error'
      );
      for (const error of linkErrors) {
        log(`Error in file ${error.file}:${error.position.start.line}:${error.position.end.column}: ${error.error}`, 'error');
      }
    }
    if (snippetErrors.length > 0) {
      log(
        `Failure: ${snippetErrors.length} example snippet${
          snippetErrors.length === 1 ? "" : "s"
        } had errors`,
        'error'
      );
      snippetErrors.forEach((error) => {
        log(`Error in file ${error.path}:${error.position.start.line}:${error.position.end.column}: ${error.error}`, 'error');
        log("```");
        log(error.snippet);
        log("```");
      });
    }
    if (anyErrors) exit(1);
  }
})();
