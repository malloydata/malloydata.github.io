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

/*
 * A markdown document, as returned from unified when parsing Remark with GFM.
 */
export type Markdown =
  | Root
  | Strong
  | HTML
  | Break
  | Heading
  | Text
  | Paragraph
  | Link
  | Emphasis
  | List
  | ListItem
  | Table
  | TableRow
  | TableCell
  | InlineCode
  | Code
  | Blockquote
  | Image
  | Delete
  | ThematicBreak;

export interface Position {
  start: { line: number, column: number, offset: number },
  end: { line: number, column: number, offset: number }
};

export interface Node {
  position: Position;
}

export interface Root extends Node {
  type: "root";
  children: Markdown[];
}

export interface Break extends Node {
  type: "break";
}

export interface Image extends Node {
  type: "image";
  url: string;
  title: string | null;
  alt: string;
}

export interface Delete extends Node {
  type: "delete";
  children: Markdown[];
}

export interface Blockquote extends Node {
  type: "blockquote";
  children: Markdown[];
}

export interface Heading extends Node {
  type: "heading";
  children: Markdown[];
  depth: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface Text extends Node {
  type: "text";
  value: string;
}

export interface HTML extends Node {
  type: "html";
  value: string;
}

export interface Code extends Node {
  type: "code";
  lang: string;
  meta: string | null;
  value: string;
}

export interface Link extends Node {
  type: "link";
  title: string | null;
  url: string;
  children: Markdown[];
}

export interface Paragraph extends Node {
  type: "paragraph";
  children: Markdown[];
}

export interface Emphasis extends Node {
  type: "emphasis";
  children: Markdown[];
}

export interface Strong extends Node {
  type: "strong";
  children: Markdown[];
}

export interface List extends Node {
  type: "list";
  ordered: boolean;
  start: number | null;
  spread: boolean;
  children: Markdown[];
}

export interface ListItem extends Node {
  type: "listItem";
  checked: boolean | null;
  spread: boolean;
  children: Markdown[];
}

export interface Table extends Node {
  type: "table";
  align: ("left" | "right" | null)[];
  children: Markdown[];
}

export interface TableRow extends Node {
  type: "tableRow";
  children: Markdown[];
}

export interface TableCell extends Node {
  type: "tableCell";
  children: Markdown[];
}

export interface InlineCode extends Node {
  type: "inlineCode";
  value: string;
}

export interface ThematicBreak extends Node {
  type: "thematicBreak";
}
