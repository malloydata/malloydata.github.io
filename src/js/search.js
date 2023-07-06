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

function textContent(html) {
  const dummyElement = document.createElement("div");
  dummyElement.innerHTML = html;
  return dummyElement.textContent;
}

function getTerms(query) {
  return query
    .toLowerCase()
    .split(/\s/)
    .filter((term) => term.length > 0);
}

function search(segments, query) {
  const terms = getTerms(query);
  const scoredSegments = [];
  for (const segment of segments) {
    let score = 0;
    const matchingParagraphs = [];
    let lastMatched = false;
    segment.paragraphs.forEach((paragraph) => {
      let found = false;
      let paragraphScore = 0;
      for (const term of terms) {
        if (textContent(paragraph.text).toLowerCase().includes(term)) {
          paragraphScore += 10;
          found = true;
        }
      }
      if (found) {
        matchingParagraphs.push(paragraph);
        lastMatched = true;
      } else {
        if (lastMatched) {
          matchingParagraphs.push({ type: "p", text: "..." });
        }
        lastMatched = false;
      }
      score = Math.max(score, paragraphScore);
    });

    if (
      segment.titles.some((title) =>
        terms.some((term) => title.toLowerCase().includes(term))
      )
    ) {
      score += 100;
    }
    if (!lastMatched) {
      matchingParagraphs.pop();
    }
    scoredSegments.push({
      score,
      segment: {
        path: segment.path,
        titles: segment.titles,
        paragraphs: matchingParagraphs,
      },
    });
  }
  return scoredSegments
    .filter(({ score }) => score > 0)
    .sort(({ score: score1 }, { score: score2 }) => score2 - score1);
}

function highlight(paragraphElement, query) {
  const terms = getTerms(query);
  const newNodes = [];
  for (const node of paragraphElement.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const newNode = document.createElement("span");
      let content = node.textContent;
      for (const term of terms) {
        content = content.replace(
          new RegExp(term, "gi"),
          (m) => `<mark class="search-highlight">${m}</mark>`
        );
      }
      newNode.innerHTML = content;
      newNodes.push(...newNode.childNodes);
    } else {
      newNodes.push(highlight(node, query));
    }
  }
  paragraphElement.innerHTML = "";
  for (const node of newNodes) {
    paragraphElement.appendChild(node);
  }
  return paragraphElement;
}

const LINES_AROUND_TO_INCLUDE = 2;

function collapseCode(paragraphElement, query) {
  const terms = getTerms(query);
  const termRegexes = terms.map((term) => new RegExp(term, "gi"));
  const includeLines = {};
  const lines = paragraphElement.querySelectorAll("span.line");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineMatchesQuery = termRegexes.some((regex) =>
      line.textContent.match(regex)
    );
    if (lineMatchesQuery) {
      for (
        let j = i - LINES_AROUND_TO_INCLUDE;
        j <= i + LINES_AROUND_TO_INCLUDE;
        j++
      ) {
        includeLines[j] = true;
      }
    }
  }
  const newLines = [];
  let needsElipsis = false;
  let leadingSpace = "";
  for (let i = 0; i < lines.length; i++) {
    if (includeLines[i]) {
      const line = lines[i];
      leadingSpace = line.textContent.match(/^\s*/)[0];
      if (needsElipsis) {
        newLines.push(document.createTextNode(leadingSpace + "..."));
      }
      newLines.push(line);
      needsElipsis = false;
    } else {
      needsElipsis = true;
    }
  }
  if (needsElipsis) {
    newLines.push(document.createTextNode(leadingSpace + "..."));
  }
  const preElement = paragraphElement.querySelector("pre");
  preElement.innerHTML = "";
  for (const line of newLines) {
    preElement.appendChild(line);
    preElement.appendChild(document.createTextNode("\n"));
  }
}

const urlParams = new URLSearchParams(window.location.search);
const query = urlParams.get("query");

const results = search(window.SEARCH_SEGMENTS, query);

const resultsElement = document.getElementById("search-results");
resultsElement.innerHTML = "";

for (const result of results) {
  const resultElement = document.createElement("div");
  {
    const headingElement = document.createElement("h2");
    result.segment.titles.forEach((title, index) => {
      const linkElement = document.createElement("a");
      const anchor = title.toLowerCase().replace(/[^\w]+/g, "-");
      linkElement.innerHTML = title;
      linkElement.href =
        result.segment.path
          .replace(".md", ".html")
          .replace(/^\//, "documentation/") + (index > 0 ? "#" + anchor : "");
      highlight(linkElement, query);
      headingElement.appendChild(linkElement);
      if (index != result.segment.titles.length - 1) {
        const caret = document.createElement("span");
        caret.innerText = " › ";
        headingElement.appendChild(caret);
      }
    });
    resultElement.appendChild(headingElement);
  }
  {
    const previewElement = document.createElement("div");
    for (const paragraph of result.segment.paragraphs) {
      const pElement = document.createElement("p");
      pElement.innerHTML = paragraph.text;
      if (paragraph.type === "code") {
        collapseCode(pElement, query);
      }
      highlight(pElement, query);
      previewElement.appendChild(pElement);
    }
    if (result.segment.paragraphs.length === 0) {
      const iElement = document.createElement("i");
      iElement.innerHTML = "Title matches term";
      highlight(iElement, query);
      previewElement.appendChild(iElement);
    }
    resultElement.appendChild(previewElement);
  }
  resultsElement.appendChild(resultElement);
}

if (results.length === 0) {
  const emptyElement = document.createElement("div");
  emptyElement.innerHTML = "No results";
  resultsElement.appendChild(emptyElement);
}
