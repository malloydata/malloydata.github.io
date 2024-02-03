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

import * as shiki from "shiki";
import * as fs from "fs";

const malloyTMGrammar = JSON.parse(
  fs.readFileSync(
    "./node_modules/@malloydata/syntax-highlight/grammars/malloy/malloy.tmGrammar.json",
    "utf-8"
  )
);

const malloyDocsTMGrammar = {
  ...malloyTMGrammar,
  patterns: [...malloyTMGrammar.patterns, { include: "#docvar" }],
  repository: {
    ...malloyTMGrammar.repository,
    docvar: {
      patterns: [
        {
          match: "\\<\\<[^(\\>\\>)]*\\>\\>",
          beginCaptures: {
            0: { name: "punctuation.definition.comment.begin" },
          },
          endCaptures: {
            0: { name: "punctuation.definition.comment.end" },
          },
          name: "markup.italic.markdown",
        },
      ],
    },
  },
};

const malloySQLTMGrammar = JSON.parse(
  fs.readFileSync(
    "./node_modules/@malloydata/syntax-highlight/grammars/malloy-sql/malloy-sql.tmGrammar.json",
    "utf-8"
  )
);

const HIGHLIGHTER = shiki.getHighlighter({
  theme: "light-plus",
  paths: {
    themes: "node_modules/shiki/themes/", 
    languages: "node_modules/shiki/languages/"
  },
  langs: [
    "sql",
    "json",
    {
      id: "malloy",
      scopeName: "source.malloy",
      embeddedLangs: ["sql"],
      grammar: malloyDocsTMGrammar as any,
    },
    {
      id: "malloysql",
      scopeName: "source.malloy-sql",
      embeddedLangs: ["sql"],
      grammar: malloySQLTMGrammar as any,
    },
  ],
});

export async function highlight(
  code: string,
  lang: string,
  { inline }: { inline?: boolean } = {}
): Promise<string> {
  const highlighter = await HIGHLIGHTER;
  if (!highlighter.getLoadedLanguages().includes(lang as shiki.Lang)) {
    lang = "txt";
  }
  const highlightedRaw = highlighter.codeToHtml(code, { lang });
  // In docs, the highlighter recognizes <<foo>> as a way to make
  // "foo" look like a meta-variable. Here we remove the << and >>
  const removeDocVarEnclosing = highlightedRaw.replace(
    /(>)(&lt;&lt;)(.*?)(&gt;&gt;)(<)/g,
    "$1$3$5"
  );
  if (inline) {
    return removeDocVarEnclosing
      .replace(/^<pre class="shiki"/, `<code class="language-${lang}"`)
      .replace("<code>", "")
      .replace(/<\/pre>$/, "")
      .replace("background-color: #FFFFFF", "background-color: #FBFBFB");
  } else {
    return removeDocVarEnclosing
      .replace(/^<pre class="shiki"/, `<pre class="language-${lang}"`)
      .replace("<code>", "")
      .replace(/<\/code><\/pre>$/, "</pre>")
      .replace("background-color: #FFFFFF", "background-color: #FBFBFB");
  }
}
