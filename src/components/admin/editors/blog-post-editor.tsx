"use client";

import { useState, useCallback, useRef } from "react";

interface BlogPostEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

type FormatMode = "paragraph" | "h1" | "h2" | "h3" | "bold" | "italic" | "link" | "ul" | "ol" | "code" | "quote";

const TOOLBAR_BUTTONS: Array<{ mode: FormatMode; label: string; title: string }> = [
  { mode: "paragraph", label: "P", title: "Paragraph" },
  { mode: "h1", label: "H1", title: "Heading 1" },
  { mode: "h2", label: "H2", title: "Heading 2" },
  { mode: "h3", label: "H3", title: "Heading 3" },
  { mode: "bold", label: "B", title: "Bold" },
  { mode: "italic", label: "I", title: "Italic" },
  { mode: "link", label: "🔗", title: "Insert Link" },
  { mode: "ul", label: "≡", title: "Bullet List" },
  { mode: "ol", label: "1.", title: "Numbered List" },
  { mode: "code", label: "<>", title: "Inline Code" },
  { mode: "quote", label: '"', title: "Blockquote" },
];

function insertMarkdown(textarea: HTMLTextAreaElement, mode: FormatMode) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);

  let newText = textarea.value;
  let newCursorStart = start;
  let newCursorEnd = end;

  const lineStart = before.lastIndexOf("\n") + 1;

  switch (mode) {
    case "paragraph":
      newText = before + after;
      newCursorStart = newCursorEnd = start;
      break;
    case "h1":
      newText = before + "# " + selected + after;
      newCursorStart = start + 2;
      newCursorEnd = newCursorStart + selected.length;
      break;
    case "h2":
      newText = before + "## " + selected + after;
      newCursorStart = start + 3;
      newCursorEnd = newCursorStart + selected.length;
      break;
    case "h3":
      newText = before + "### " + selected + after;
      newCursorStart = start + 4;
      newCursorEnd = newCursorStart + selected.length;
      break;
    case "bold":
      if (selected) {
        newText = before + `**${selected}**` + after;
        newCursorStart = start + 2;
        newCursorEnd = end + 2;
      } else {
        newText = before + "**bold text**" + after;
        newCursorStart = start + 2;
        newCursorEnd = start + 12;
      }
      break;
    case "italic":
      if (selected) {
        newText = before + `*${selected}*` + after;
        newCursorStart = start + 1;
        newCursorEnd = end + 1;
      } else {
        newText = before + "*italic text*" + after;
        newCursorStart = start + 1;
        newCursorEnd = start + 12;
      }
      break;
    case "link":
      if (selected) {
        newText = before + `[${selected}](url)` + after;
        newCursorStart = start + selected.length + 3;
        newCursorEnd = start + selected.length + 6;
      } else {
        newText = before + "[link text](url)" + after;
        newCursorStart = start + 1;
        newCursorEnd = start + 10;
      }
      break;
    case "ul":
      newText = before.substring(0, lineStart) + "- " + before.substring(lineStart) + selected + after;
      newCursorStart = start + 2;
      newCursorEnd = newCursorStart + selected.length;
      break;
    case "ol":
      newText = before.substring(0, lineStart) + "1. " + before.substring(lineStart) + selected + after;
      newCursorStart = start + 3;
      newCursorEnd = newCursorStart + selected.length;
      break;
    case "code":
      if (selected) {
        newText = before + "`" + selected + "`" + after;
        newCursorStart = start + 1;
        newCursorEnd = end + 1;
      } else {
        newText = before + "`code`" + after;
        newCursorStart = start + 1;
        newCursorEnd = start + 5;
      }
      break;
    case "quote":
      newText = before + "> " + selected + after;
      newCursorStart = start + 2;
      newCursorEnd = newCursorStart + selected.length;
      break;
  }

  return { newText, newCursorStart, newCursorEnd };
}

export function BlogPostEditor({ value, onChange, placeholder = "Viết nội dung bài viết...", className = "" }: BlogPostEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = useCallback((mode: FormatMode) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const { newText, newCursorStart, newCursorEnd } = insertMarkdown(ta, mode);
    onChange(newText);

    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = newCursorStart;
      ta.selectionEnd = newCursorEnd;
    });
  }, [onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current;
    if (!ta) return;

    // Ctrl/Cmd+B = bold, I = italic, K = link
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") { e.preventDefault(); applyFormat("bold"); }
      if (e.key === "i") { e.preventDefault(); applyFormat("italic"); }
      if (e.key === "k") { e.preventDefault(); applyFormat("link"); }
    }

    // Tab = indent
    if (e.key === "Tab") {
      e.preventDefault();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.substring(0, start) + "  " + value.substring(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }, [applyFormat, value, onChange]);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className={className}>
      {/* Toolbar */}
      <div
        className="flex items-center gap-1 px-3 py-2 border-b flex-wrap"
        style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        {TOOLBAR_BUTTONS.map(btn => (
          <button
            key={btn.mode}
            type="button"
            title={btn.title}
            onClick={() => applyFormat(btn.mode)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all hover:bg-white/10"
            style={{
              color: btn.mode === "bold" ? "#fff" : btn.mode === "italic" ? "#A78BFA" : "rgba(209,213,219,0.6)",
              fontSize: btn.label.length === 1 ? 16 : 11,
            }}
          >
            {btn.label}
          </button>
        ))}

        {/* Word count */}
        <div className="ml-auto text-[10px]" style={{ color: "rgba(209,213,219,0.3)" }}>
          {wordCount} words · {charCount} chars
        </div>
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-4 text-sm text-white resize-none outline-none min-h-[300px]"
        style={{
          background: "#0f0f1a",
          fontFamily: "Georgia, serif",
          fontSize: 15,
          lineHeight: 1.8,
          minHeight: 300,
        }}
      />
    </div>
  );
}
