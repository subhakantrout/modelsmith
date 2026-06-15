import { Fragment } from "react";

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc ml-4 my-1 space-y-0.5">
          {listItems.map((item, i) => (
            <li key={i} className="text-xs text-gray-300">{parseInline(item.replace(/^[-*+]\s+/, ""))}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  }

  const codeBlocks = content.split(/(```[\s\S]*?```)/g);

  if (codeBlocks.length > 1) {
    return (
      <div className="text-xs leading-relaxed break-words">
        {codeBlocks.map((part, i) => {
          if (part.startsWith("```") && part.endsWith("```")) {
            const code = part.slice(3, -3).replace(/^\w+\n/, "");
            return (
              <pre
                key={i}
                className="bg-gray-950 border border-gray-700 rounded-md p-2 my-1 overflow-x-auto text-[11px] font-mono text-gray-200"
              >
                <code>{code.trim()}</code>
              </pre>
            );
          }
          return <span key={i} className="whitespace-pre-wrap">{part}</span>;
        })}
      </div>
    );
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      elements.push(<div key={`br-${i}`} className="h-1.5" />);
      continue;
    }

    if (/^#{1,3}\s/.test(trimmed)) {
      flushList();
      const level = trimmed.match(/^#+/)![0].length;
      const text = trimmed.replace(/^#+\s+/, "");
      const Tag = level === 1 ? "h4" : level === 2 ? "h5" : "h6";
      elements.push(
        <Tag key={`h-${i}`} className="font-semibold text-gray-100 mt-2 mb-1 text-xs">
          {text}
        </Tag>
      );
      continue;
    }

    if (/^[-*+]\s/.test(trimmed)) {
      inList = true;
      listItems.push(trimmed);
      continue;
    }

    if (/^\d+[.)]\s/.test(trimmed)) {
      flushList();
      elements.push(
        <div key={`ol-${i}`} className="flex gap-1.5 ml-4 my-0.5">
          <span className="text-gray-500 text-[10px] shrink-0">{trimmed.match(/^\d+[.)]/)![0]}</span>
          <span className="text-xs text-gray-300">{parseInline(trimmed.replace(/^\d+[.)]\s+/, ""))}</span>
        </div>
      );
      continue;
    }

    flushList();

    if (/^---/.test(trimmed)) {
      elements.push(<hr key={`hr-${i}`} className="border-gray-700 my-2" />);
      continue;
    }

    if (/^>.+/.test(trimmed)) {
      elements.push(
        <blockquote key={`bq-${i}`} className="border-l-2 border-gray-600 pl-3 my-1 text-xs text-gray-400 italic">
          {parseInline(trimmed.replace(/^>\s*/, ""))}
        </blockquote>
      );
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="text-xs text-gray-300 my-0.5 leading-relaxed">
        {parseInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className="break-words">{elements}</div>;
}

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const boldRe = /\*\*(.+?)\*\*/g;
  const italicRe = /\*(.+?)\*/g;
  const codeRe = /`([^`]+)`/g;

  let lastIndex = 0;
  const matches: { index: number; length: number; html: React.ReactNode }[] = [];

  let m: RegExpExecArray | null;
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\*(.+?)\*/g;

  while ((m = re.exec(remaining)) !== null) {
    if (m[1]) {
      matches.push({ index: m.index, length: m[0].length, html: <strong key={`b-${key++}`} className="text-gray-100 font-semibold">{m[1]}</strong> });
    } else if (m[2]) {
      matches.push({ index: m.index, length: m[0].length, html: <code key={`c-${key++}`} className="bg-gray-800 text-gray-200 px-1 rounded text-[10px] font-mono">{m[2]}</code> });
    } else if (m[3]) {
      matches.push({ index: m.index, length: m[0].length, html: <em key={`i-${key++}`} className="text-gray-400 italic">{m[3]}</em> });
    }
  }

  if (matches.length === 0) {
    return text;
  }

  let pos = 0;
  for (const match of matches) {
    if (match.index > pos) {
      parts.push(remaining.slice(pos, match.index));
    }
    parts.push(match.html);
    pos = match.index + match.length;
  }
  if (pos < remaining.length) {
    parts.push(remaining.slice(pos));
  }

  return <>{parts}</>;
}
