"use client";

import { Fragment, useMemo, type ReactNode } from "react";

type Block =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ol"; items: string[] }
  | { kind: "ul"; items: string[] };

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<strong key={`b-${k++}`}>{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : [text];
}

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trim = line.trim();
    if (!trim) {
      i++;
      continue;
    }

    if (/^##\s+/.test(trim)) {
      blocks.push({ kind: "h2", text: trim.replace(/^##\s+/, "") });
      i++;
      continue;
    }
    if (/^###\s+/.test(trim)) {
      blocks.push({ kind: "h3", text: trim.replace(/^###\s+/, "") });
      i++;
      continue;
    }

    const title = trim.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (title) {
      blocks.push({ kind: "h3", text: title[1] });
      i++;
      continue;
    }

    if (/^\d+\.\s/.test(trim)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s*/, ""));
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    if (/^[-*]\s/.test(trim)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s*/, ""));
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    const para: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) break;
      if (/^##\s+/.test(t) || /^###\s+/.test(t) || /^\d+\.\s/.test(t) || /^[-*]\s/.test(t)) break;
      const onlyBold = t.match(/^\*\*(.+?)\*\*:?\s*$/);
      if (onlyBold && para.length === 0) {
        blocks.push({ kind: "h3", text: onlyBold[1] });
        i++;
        break;
      }
      para.push(lines[i]);
      i++;
    }
    if (para.length) blocks.push({ kind: "p", text: para.join("\n") });
  }

  return blocks;
}

export default function UstadMarkdown({ content }: { content: string }) {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <div className="ustad-md">
      {blocks.map((b, idx) => {
        switch (b.kind) {
          case "h2":
            return (
              <h2 key={idx} className="ustad-md-h2">
                {inline(b.text)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={idx} className="ustad-md-h3">
                {inline(b.text)}
              </h3>
            );
          case "p":
            return (
              <p key={idx} className="ustad-md-p">
                {b.text.split("\n").map((ln, j) => (
                  <Fragment key={j}>
                    {j > 0 && <br />}
                    {inline(ln)}
                  </Fragment>
                ))}
              </p>
            );
          case "ol":
            return (
              <ol key={idx} className="ustad-md-ol">
                {b.items.map((item, j) => (
                  <li key={j}>{inline(item)}</li>
                ))}
              </ol>
            );
          case "ul":
            return (
              <ul key={idx} className="ustad-md-ul">
                {b.items.map((item, j) => (
                  <li key={j}>{inline(item)}</li>
                ))}
              </ul>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
