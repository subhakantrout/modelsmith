interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
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
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
