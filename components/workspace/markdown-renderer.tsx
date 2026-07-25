"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Citation } from "./chat-panel";

interface MarkdownRendererProps {
  content: string;
  citations?: Citation[];
  onCitationClick?: (citation: Citation) => void;
  isStreaming?: boolean;
  role?: "user" | "assistant";
}

function parseInline(
  text: string,
  citations: Citation[] | undefined,
  onCitationClick: ((citation: Citation) => void) | undefined
): React.ReactNode[] {
  if (!text) return [];

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let keyIndex = 0;

  while (cursor < text.length) {
    const remaining = text.slice(cursor);

    // 1. Citation [N] (not followed by '(' which would make it a markdown link)
    const citMatch = remaining.match(/^\[(\d+)\](?!\()/);
    if (citMatch) {
      const citationNum = parseInt(citMatch[1], 10);
      const citationData = citations?.[citationNum - 1];

      nodes.push(
        <button
          key={`cit_${keyIndex++}`}
          onClick={() => citationData && onCitationClick?.(citationData)}
          className="inline-flex items-center justify-center mx-0.5 px-1.5 py-0.5 rounded-md bg-accent/20 hover:bg-accent/40 border border-accent/30 text-accent text-mono-sm font-semibold transition-all duration-fast hover:scale-105 active:scale-95 cursor-pointer"
          title={
            citationData
              ? `Click to view source: ${citationData.sourceTitle}`
              : `Citation ${citationNum}`
          }
        >
          [{citationNum}]
        </button>
      );
      cursor += citMatch[0].length;
      continue;
    }

    // 2. Inline Code `code`
    const codeMatch = remaining.match(/^`([^`\n]+)`/);
    if (codeMatch) {
      nodes.push(
        <code
          key={`code_${keyIndex++}`}
          className="font-mono text-mono-sm bg-accent/10 border border-accent/20 text-accent px-1.5 py-0.5 rounded"
        >
          {codeMatch[1]}
        </code>
      );
      cursor += codeMatch[0].length;
      continue;
    }

    // 3. Link [label](url)
    const linkMatch = remaining.match(/^\[([^\]\n]+)\]\(([^)\s]+)\)/);
    if (linkMatch) {
      const label = linkMatch[1];
      const url = linkMatch[2];
      nodes.push(
        <a
          key={`link_${keyIndex++}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline font-medium"
        >
          {parseInline(label, citations, onCitationClick)}
        </a>
      );
      cursor += linkMatch[0].length;
      continue;
    }

    // 4. Strikethrough ~~text~~
    const strikeMatch = remaining.match(/^~~([^~\n]+)~~/);
    if (strikeMatch) {
      nodes.push(
        <del key={`strike_${keyIndex++}`} className="line-through text-text-muted">
          {parseInline(strikeMatch[1], citations, onCitationClick)}
        </del>
      );
      cursor += strikeMatch[0].length;
      continue;
    }

    // 5. Bold + Italic ***text*** or ___text___
    const boldItalicMatch = remaining.match(/^(\*\*\*|___)([\s\S]+?)\1/);
    if (boldItalicMatch) {
      nodes.push(
        <strong key={`bi_${keyIndex++}`} className="font-bold italic">
          {parseInline(boldItalicMatch[2], citations, onCitationClick)}
        </strong>
      );
      cursor += boldItalicMatch[0].length;
      continue;
    }

    // 6. Bold **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)([\s\S]+?)\1/);
    if (boldMatch) {
      nodes.push(
        <strong key={`b_${keyIndex++}`} className="font-semibold text-text">
          {parseInline(boldMatch[2], citations, onCitationClick)}
        </strong>
      );
      cursor += boldMatch[0].length;
      continue;
    }

    // 7. Italic *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)([^\*\_\n]+?)\1/);
    if (italicMatch) {
      nodes.push(
        <em key={`i_${keyIndex++}`} className="italic">
          {parseInline(italicMatch[2], citations, onCitationClick)}
        </em>
      );
      cursor += italicMatch[0].length;
      continue;
    }

    // Find next special character
    const nextSpecial = remaining.search(/[\[`*_~]/);
    if (nextSpecial === -1) {
      nodes.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      nodes.push(remaining[0]);
      cursor += 1;
    } else {
      nodes.push(remaining.slice(0, nextSpecial));
      cursor += nextSpecial;
    }
  }

  return nodes;
}

interface CodeBlockComponentProps {
  language: string;
  code: string;
}

function CodeBlockComponent({ language, code }: CodeBlockComponentProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-[hsl(215_25%_22%/0.6)] bg-bg/90 overflow-hidden shadow-sm font-mono text-mono-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-surface/80 border-b border-[hsl(215_25%_22%/0.4)] text-text-muted text-xs">
        <span className="font-semibold uppercase tracking-wider text-[11px] text-text-muted/80">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-text px-2 py-0.5 rounded transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              <span className="text-success font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-text font-mono text-mono-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({
  content,
  citations,
  onCitationClick,
  isStreaming,
}: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let keyIdx = 0;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 1. Fenced Code Block
    if (line.trim().startsWith("```")) {
      const match = line.trim().match(/^```(\w*)/);
      const language = match ? match[1] : "";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```

      elements.push(
        <CodeBlockComponent
          key={`codeblock_${keyIdx++}`}
          language={language}
          code={codeLines.join("\n")}
        />
      );
      continue;
    }

    // 2. Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const parsedHeading = parseInline(headingText, citations, onCitationClick);

      if (level === 1) {
        elements.push(
          <h1
            key={`h1_${keyIdx++}`}
            className="font-display text-xl font-bold text-text mt-4 mb-2 pb-1 border-b border-border/40"
          >
            {parsedHeading}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2
            key={`h2_${keyIdx++}`}
            className="font-display text-lg font-bold text-text mt-3 mb-2"
          >
            {parsedHeading}
          </h2>
        );
      } else if (level === 3) {
        elements.push(
          <h3
            key={`h3_${keyIdx++}`}
            className="font-display text-base font-semibold text-text mt-2.5 mb-1.5"
          >
            {parsedHeading}
          </h3>
        );
      } else {
        elements.push(
          <h4
            key={`h4_${keyIdx++}`}
            className="font-display text-body font-semibold text-text mt-2 mb-1"
          >
            {parsedHeading}
          </h4>
        );
      }
      i++;
      continue;
    }

    // 3. Blockquotes
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      const quoteContent = quoteLines.join("\n");
      elements.push(
        <blockquote
          key={`quote_${keyIdx++}`}
          className="border-l-4 border-primary/60 bg-surface/40 pl-3.5 py-1.5 italic text-text-muted my-2 rounded-r-lg"
        >
          {parseInline(quoteContent, citations, onCitationClick)}
        </blockquote>
      );
      continue;
    }

    // 4. Horizontal Rule
    if (/^(---|[*]{3}|_{3})$/.test(line.trim())) {
      elements.push(
        <hr key={`hr_${keyIdx++}`} className="my-4 border-border/40" />
      );
      i++;
      continue;
    }

    // 5. Markdown Tables (| Header 1 | Header 2 |)
    const isTableLine = (l: string) => /^\s*\|.*\|\s*$/.test(l);
    const isDelimiterLine = (l: string) =>
      /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(l);

    if (
      isTableLine(line) &&
      i + 1 < lines.length &&
      isDelimiterLine(lines[i + 1])
    ) {
      const headerLine = lines[i];
      const delimLine = lines[i + 1];
      i += 2;

      const parseRow = (rowStr: string) =>
        rowStr
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => c.trim());

      const headers = parseRow(headerLine);
      const delimCols = parseRow(delimLine);

      const alignments = delimCols.map((c) => {
        const startsWithColon = c.startsWith(":");
        const endsWithColon = c.endsWith(":");
        if (startsWithColon && endsWithColon) return "center";
        if (endsWithColon) return "right";
        return "left";
      });

      const bodyRows: string[][] = [];
      while (i < lines.length && isTableLine(lines[i])) {
        bodyRows.push(parseRow(lines[i]));
        i++;
      }

      elements.push(
        <div
          key={`table_${keyIdx++}`}
          className="my-3 overflow-x-auto rounded-xl border border-[hsl(215_25%_22%/0.6)] bg-surface/40 shadow-sm"
        >
          <table className="w-full text-left text-body-sm border-collapse">
            <thead className="bg-surface/80 border-b border-[hsl(215_25%_22%/0.6)]">
              <tr>
                {headers.map((h, idx) => (
                  <th
                    key={idx}
                    className="px-3.5 py-2 font-semibold text-text font-display text-mono-sm border-r border-[hsl(215_25%_22%/0.3)] last:border-r-0"
                    style={{ textAlign: (alignments[idx] || "left") as any }}
                  >
                    {parseInline(h, citations, onCitationClick)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(215_25%_22%/0.4)]">
              {bodyRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-surface/60 transition-colors"
                >
                  {headers.map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-3.5 py-2 text-text/90 border-r border-[hsl(215_25%_22%/0.3)] last:border-r-0"
                      style={{ textAlign: (alignments[cIdx] || "left") as any }}
                    >
                      {parseInline(row[cIdx] || "", citations, onCitationClick)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 6. Unordered List (- item or * item)
    if (/^\s*[-*+]\s+/.test(line)) {
      const listItems: { indent: number; text: string }[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const indent = lines[i].search(/\S/);
        const itemText = lines[i].replace(/^\s*[-*+]\s+/, "");
        listItems.push({ indent, text: itemText });
        i++;
      }
      elements.push(
        <ul
          key={`ul_${keyIdx++}`}
          className="list-disc list-outside ml-5 space-y-1.5 my-2"
        >
          {listItems.map((item, idx) => (
            <li
              key={idx}
              className="leading-relaxed"
              style={{
                marginLeft: item.indent > 0 ? `${item.indent * 0.5}rem` : undefined,
              }}
            >
              {parseInline(item.text, citations, onCitationClick)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 7. Ordered List (1. item)
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: { indent: number; text: string }[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const indent = lines[i].search(/\S/);
        const itemText = lines[i].replace(/^\s*\d+\.\s+/, "");
        listItems.push({ indent, text: itemText });
        i++;
      }
      elements.push(
        <ol
          key={`ol_${keyIdx++}`}
          className="list-decimal list-outside ml-5 space-y-1.5 my-2"
        >
          {listItems.map((item, idx) => (
            <li
              key={idx}
              className="leading-relaxed"
              style={{
                marginLeft: item.indent > 0 ? `${item.indent * 0.5}rem` : undefined,
              }}
            >
              {parseInline(item.text, citations, onCitationClick)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 8. Blank lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Accumulate consecutive paragraph lines
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].match(/^#{1,6}\s+/) &&
      !lines[i].trim().startsWith(">") &&
      !/^(---|[*]{3}|_{3})$/.test(lines[i].trim()) &&
      !isTableLine(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      pLines.push(lines[i]);
      i++;
    }

    if (pLines.length > 0) {
      elements.push(
        <p
          key={`p_${keyIdx++}`}
          className="leading-relaxed my-2 first:mt-0 last:mb-0"
        >
          {pLines.map((lineStr, lineIdx) => (
            <React.Fragment key={lineIdx}>
              {lineIdx > 0 && <br />}
              {parseInline(lineStr, citations, onCitationClick)}
            </React.Fragment>
          ))}
        </p>
      );
    }
  }

  return (
    <div className="markdown-content text-body text-text space-y-1">
      {elements.length > 0 ? elements : <p>{content}</p>}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse align-middle" />
      )}
    </div>
  );
}
