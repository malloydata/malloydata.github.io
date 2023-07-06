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
import { DEFAULT_CONTEXT } from "./context.js";
import Handlebars from "handlebars";

export interface Section {
  title: string;
  items: (Section | SectionItem)[];
}

export interface SectionItem {
  title: string;
  link: string;
}

interface EnrichedSection {
  title: string;
  id: string;
  items: (EnrichedSection | EnrichedSectionItem)[];
}

interface EnrichedSectionItem {
  title: string;
  link: string;
  htmlLink: string;
  compareLink: string;
}

function isSectionItem(item: SectionItem | Section): item is SectionItem {
  return (item as SectionItem).link !== undefined;
}

function enrichTableOfContents(sections: Section[]): EnrichedSection[] {
  return sections.map((section) => {
    return {
      id: section.title.toLowerCase().replace(" ", "_"),
      title: section.title,
      items: section.items.map((item) => {
        if (isSectionItem(item)) {
          const compareLink = item.link.replace(/\.md$/, ".html");
          const htmlLinkRaw = item.link.replace(/\.md$/, "");
          const fullLink = path.join("/documentation", htmlLinkRaw);
          const htmlLink = fullLink === "/index" ? "" : fullLink;
          return { title: item.title, link: item.link, htmlLink, compareLink };
        } else {
          return enrichTableOfContents([item])[0];
        }
      }),
    };
  });
}

function extractItems(sections: (Section | SectionItem)[]): SectionItem[] {
  const items: SectionItem[] = [];
  const stack = [...sections].reverse();
  while (stack.length) {
    const section = stack.pop() as Section | SectionItem;
    if (isSectionItem(section)) {
      items.push(section);
    } else {
      stack.push(...[...section.items].reverse());
    }
  }
  return items;
}

function renderSection(section: EnrichedSection | EnrichedSectionItem): string {
  if (isSectionItem(section)) {
    return `<div class='sidebar-item {{#ifeq page.url "${section.compareLink}" }}active{{/ifeq}}'>
      <a href="{{ site.baseurl }}${section.htmlLink}">
        <img src="{{ site.baseurl }}/img/article_icon.svg" alt="document"/>
        ${section.title}
      </a>
    </div>`;
  } else {
    return `<div class="sidebar-section">
      <div id=${section.id}
        class="sidebar-section-title {% unless ${extractItems(
          section.items
        ).map(
          (item) => (item as EnrichedSectionItem).compareLink
        )} contains page.url)} %}collapsed-this-isnt-working-its-always-collapsed-ben-took-it-out{% endunless %}"
      >
        ${section.title}
        <img class="chevron-open" src="{{ site.baseurl }}/img/section_open.svg" alt="section open"/>
        <img class="chevron-closed" src="{{ site.baseurl }}/img/section_close.svg" alt="section closed"/>
      </div>
      <div class="sidebar-section-item-group">
        ${section.items
          .map((item) => {
            return renderSection(item);
          })
          .join("\n")}
      </div>
    </div>`;
  }
}

export function renderSidebar(sections: Section[]): string {
  return `<div class="sidebar" id="sidebar">
    ${enrichTableOfContents(sections)
      .map((section) => {
        return renderSection(section);
      })
      .join("\n")}
  </div>`;
}

const FOOTER_TEMPLATE_STRING = `
<div class="linear-navigation">
  <div class="item">
    {{#if previous }}
      <a href="{{ previous.relative }}"><img src="{{ site.baseurl }}/img/previous.svg" alt="previous"/>{{ previous.title }}</a>
    {{/if }}
  </div>
  <div class="item">
    {{#if next }}
      <a href="{{ next.relative }}">{{ next.title }}<img src="{{ site.baseurl }}/img/next.svg" alt="next"/></a>
    {{/if }}
  </div>
</div>`
const FOOTER_TEMPLATE = Handlebars.compile(FOOTER_TEMPLATE_STRING);

export function renderFooter(
  sections: Section[],
  rootPath: string,
  docPath: string
): string {
  const items = extractItems(sections);
  const thisIndex = items.findIndex(
    (item) => item.link.replace(/\.md$/, ".html") === docPath
  );

  const next = thisIndex > -1 ? items[thisIndex + 1] : null;
  const nextLink = next && next.link.replace(/\.md$/, ".html");
  const nextRelative =
    next &&
    path.relative(
      path.join(rootPath, docPath, ".."),
      path.join(rootPath, nextLink)
    );

  const previous = items[thisIndex - 1];
  const previousLink = previous && previous.link.replace(/\.md$/, ".html");
  const previousRelative =
    previous &&
    path.relative(
      path.join(rootPath, docPath, ".."),
      path.join(rootPath, previousLink)
    );

  return FOOTER_TEMPLATE({
    ...DEFAULT_CONTEXT,
    next: next ? {
      relative: nextRelative,
      title: next.title
    } : undefined,
    previous: previous ? {
      relative: previousRelative,
      title: previous.title
    } : undefined,
  });
}
