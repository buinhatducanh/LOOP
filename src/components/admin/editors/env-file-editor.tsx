"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface EnvFileEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

const VAR_COLOR = "#93C5FD";       // light blue — KEY=
const STRING_COLOR = "#86EFAC";     // green — "value"
const COMMENT_COLOR = "#6B7280";    // gray — # comment
const URL_COLOR = "#FCD34D";        // yellow — URLs
const EQUALS_COLOR = "#F9FAFB";    // white — =

export function EnvFileEditor({ value, onChange, readOnly = false, className = "" }: EnvFileEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);

  const lines = value.split("\n");

  useEffect(() => {
    setLineCount(value.split("\n").length);
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  // Sync scroll between textarea and line numbers
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current!;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);
      // Restore cursor after React re-render
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }, [value, onChange]);

  // Highlight a single line: colorize KEY="VALUE" patterns
  const highlightLine = (line: string): React.ReactNode => {
    const trimmed = line.trimStart();
    const indent = line.length - line.trimStart().length;

    if (trimmed === "") return <span key="empty" />;

    // Comment
    if (trimmed.startsWith("#")) {
      return (
        <span key="all">
          {" ".repeat(indent)}
          <span style={{ color: COMMENT_COLOR }}>{trimmed}</span>
        </span>
      );
    }

    // KEY=value pattern
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx);
      const rest = trimmed.substring(eqIdx); // includes =
      // Check for quoted value
      const qMatch = rest.match(/^=(["'])(.*)(\1)$/);
      const urlMatch = rest.match(/^=(https?:\/\/[^\s]+)/);
      return (
        <span key="all">
          {" ".repeat(indent)}
          <span style={{ color: VAR_COLOR }}>{key}</span>
          <span style={{ color: EQUALS_COLOR }}>=</span>
          {qMatch
            ? <span style={{ color: STRING_COLOR }}>{qMatch[1]}{qMatch[2]}{qMatch[1]}</span>
            : urlMatch
              ? <span style={{ color: URL_COLOR }}>{urlMatch[1]}</span>
              : <span style={{ color: STRING_COLOR }}>{rest}</span>
          }
        </span>
      );
    }

    return <span key="all" style={{ color: "#F9FAFB" }}>{line}</span>;
  };

  return (
    <div
      className={`flex rounded-xl overflow-hidden border ${className}`}
      style={{ borderColor: "rgba(255,255,255,0.08)", background: "#0a0a14" }}
    >
      {/* Line numbers */}
      <div
        ref={lineNumbersRef}
        className="py-3 px-3 select-none text-right shrink-0 overflow-hidden"
        style={{
          width: 48,
          background: "rgba(255,255,255,0.02)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.2)",
          fontSize: 12,
          fontFamily: "monospace",
          lineHeight: "1.6",
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      {/* Editor area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Syntax-highlighted overlay */}
        <div
          className="absolute inset-0 pointer-events-none py-3 px-4 overflow-auto"
          style={{
            fontFamily: "monospace",
            fontSize: 13,
            lineHeight: "1.6",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            color: "transparent",
          }}
          aria-hidden
        >
          {lines.map((line, i) => (
            <div key={i}>{highlightLine(line)}</div>
          ))}
        </div>

        {/* Actual textarea (transparent text) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          readOnly={readOnly}
          spellCheck={false}
          className="absolute inset-0 w-full h-full py-3 px-4 resize-none outline-none"
          style={{
            fontFamily: "monospace",
            fontSize: 13,
            lineHeight: "1.6",
            color: "#F9FAFB",
            background: "transparent",
            caretColor: "#A78BFA",
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
