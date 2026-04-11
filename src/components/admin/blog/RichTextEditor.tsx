"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Youtube } from "@tiptap/extension-youtube";
import CodeBlock from "@tiptap/extension-code-block";
import { DS } from "@/lib/design-tokens";
import {
  Bold, Italic, Strikethrough, Code, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link2, ImageIcon,
  Video, Terminal, Undo, Redo,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  label?: string;
}

const inpStyle: React.CSSProperties = {
  width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
  borderRadius: 8, padding: "8px 10px", color: DS.text, fontSize: 13,
  outline: "none", boxSizing: "border-box" as const, fontFamily: DS.body,
};

// ─── Toolbar Button ───────────────────────────────────────────────────────────

function ToolBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: active ? "rgba(59,130,246,0.15)" : "transparent",
        color: active ? DS.blue : DS.text4,
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={e => {
        if (!disabled && !active)
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(148,163,184,0.1)";
      }}
      onMouseLeave={e => {
        if (!disabled && !active)
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: DS.border, margin: "0 2px" }} />;
}

// ─── Link Modal ───────────────────────────────────────────────────────────────

function LinkModal({
  onConfirm, onCancel,
}: {
  onConfirm: (url: string, text: string) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, width: 340 }}>
        <p style={{ color: DS.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Chèn liên kết</p>
        <input
          autoFocus
          placeholder="https://..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{ ...inpStyle, marginBottom: 8 }}
          onKeyDown={e => { if (e.key === "Enter") onConfirm(url, text); }}
        />
        <input
          placeholder="Văn bản hiển thị (tùy chọn)"
          value={text}
          onChange={e => setText(e.target.value)}
          style={inpStyle}
          onKeyDown={e => { if (e.key === "Enter") onConfirm(url, text); }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${DS.border}`, background: "transparent", color: DS.text3, cursor: "pointer", fontSize: 13 }}>Hủy</button>
          <button onClick={() => onConfirm(url, text)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: DS.blue, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Chèn</button>
        </div>
      </div>
    </div>
  );
}

// ─── Image URL Modal ────────────────────────────────────────────────────────────

function ImageModal({
  onConfirm, onCancel,
}: {
  onConfirm: (url: string, alt: string) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, width: 360 }}>
        <p style={{ color: DS.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Chèn ảnh</p>
        <input autoFocus placeholder="URL ảnh (https://...)" value={url} onChange={e => setUrl(e.target.value)} style={{ ...inpStyle, marginBottom: 8 }} />
        <input placeholder="Mô tả ảnh (alt text)" value={alt} onChange={e => setAlt(e.target.value)} style={inpStyle} />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${DS.border}`, background: "transparent", color: DS.text3, cursor: "pointer", fontSize: 13 }}>Hủy</button>
          <button
            onClick={() => onConfirm(url, alt)}
            disabled={!url}
            style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: url ? DS.blue : DS.text4, color: "#fff", cursor: url ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600 }}
          >Chèn</button>
        </div>
      </div>
    </div>
  );
}

// ─── YouTube Modal ─────────────────────────────────────────────────────────────

function YoutubeModal({
  onConfirm, onCancel,
}: {
  onConfirm: (url: string) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, width: 400 }}>
        <p style={{ color: DS.text, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Nhúng video YouTube</p>
        <input
          autoFocus
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={inpStyle}
          onKeyDown={e => { if (e.key === "Enter") onConfirm(url); }}
        />
        <p style={{ color: DS.text4, fontSize: 11, marginTop: 4, marginBottom: 0 }}>Dán link YouTube hoặc Vimeo</p>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${DS.border}`, background: "transparent", color: DS.text3, cursor: "pointer", fontSize: 13 }}>Hủy</button>
          <button
            onClick={() => onConfirm(url)}
            disabled={!url}
            style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: url ? DS.blue : DS.text4, color: "#fff", cursor: url ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600 }}
          >Nhúng</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Editor Component ────────────────────────────────────────────────────

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Nội dung bài viết...",
  minHeight = 280,
  label,
}: RichTextEditorProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showYtModal, setShowYtModal] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({ placeholder }),
      Youtube.configure({ width: 640, height: 360, nocookie: true }),
      CodeBlock.configure({ HTMLAttributes: { class: "not-prose" } }),
    ],
    content: value,
    onUpdate({ editor: ed }) {
      onChange?.(ed.getHTML());
    },
    editorProps: {
      attributes: {
        style: `min-height:${minHeight}px; max-height:600px; overflow-y:auto;`,
      },
    },
  });

  // Sync external value changes (locale tab switch)
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value || "");
    }
  }, [value]);

  const insertLink = useCallback(
    (url: string, linkText: string) => {
      if (!editor) return;
      if (!url) { setShowLinkModal(false); return; }
      if (linkText) {
        editor.chain().focus().insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`).run();
      } else {
        const { from, to } = editor.state.selection;
        if (from === to) {
          editor.chain().focus().insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`).run();
        } else {
          editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
        }
      }
      setShowLinkModal(false);
    },
    [editor],
  );

  if (!editor) return null;

  const charCount = editor.getText().length;
  const wordCount = editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0;
  const readTime = Math.ceil(wordCount / 200) || 1;

  return (
    <div style={{ border: `1px solid ${DS.border}`, borderRadius: 10, overflow: "hidden", background: DS.bg }}>
      {label && (
        <div style={{ padding: "8px 12px 0", color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em" }}>
          {label}
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2,
        padding: "6px 8px",
        borderBottom: `1px solid ${DS.border}`,
        background: DS.bgCard,
      }}>
        {/* Format */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Đậm (Ctrl+B)"><Bold size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Nghiêng (Ctrl+I)"><Italic size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Gạch ngang"><Strikethrough size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Code inline"><Code size={14} /></ToolBtn>
        <Divider />
        {/* Block */}
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Tiêu đề 2"><Heading2 size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Tiêu đề 3"><Heading3 size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Danh sách"><List size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Danh sách số"><ListOrdered size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Trích dẫn"><Quote size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Đường phân cách"><Minus size={14} /></ToolBtn>
        <Divider />
        {/* Insert */}
        <ToolBtn onClick={() => setShowLinkModal(true)} active={editor.isActive("link")} title="Chèn liên kết"><Link2 size={14} /></ToolBtn>
        <ToolBtn onClick={() => setShowImageModal(true)} title="Chèn ảnh"><ImageIcon size={14} /></ToolBtn>
        <ToolBtn onClick={() => setShowYtModal(true)} title="Nhúng YouTube"><Video size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block"><Terminal size={14} /></ToolBtn>
        <Divider />
        {/* Undo/Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Hoàn tác (Ctrl+Z)"><Undo size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Làm lại (Ctrl+Y)"><Redo size={14} /></ToolBtn>
      </div>

      {/* Editor Styles */}
      <style>{`
        .tiptap-editor-area .ProseMirror {
          padding: 14px 16px;
          outline: none;
          color: ${DS.text};
          font-family: ${DS.body};
          font-size: 14px;
          line-height: 1.8;
          min-height: ${minHeight}px;
        }
        .tiptap-editor-area .ProseMirror p { margin-bottom: 12px; }
        .tiptap-editor-area .ProseMirror h2 { font-size: 20px; font-weight: 700; color: ${DS.text}; margin: 20px 0 10px; border-bottom: 1px solid ${DS.border}; padding-bottom: 6px; }
        .tiptap-editor-area .ProseMirror h3 { font-size: 16px; font-weight: 600; color: ${DS.text}; margin: 16px 0 8px; }
        .tiptap-editor-area .ProseMirror ul, .tiptap-editor-area .ProseMirror ol { padding-left: 24px; margin-bottom: 12px; }
        .tiptap-editor-area .ProseMirror li { margin-bottom: 4px; }
        .tiptap-editor-area .ProseMirror blockquote { border-left: 3px solid ${DS.pink}; padding: 8px 16px; margin: 12px 0; background: rgba(236,72,153,0.06); border-radius: 0 8px 8px 0; font-style: italic; color: ${DS.text3}; }
        .tiptap-editor-area .ProseMirror code { background: rgba(107,61,245,0.12); padding: 2px 5px; border-radius: 4px; font-family: ${DS.mono}; font-size: 13px; color: ${DS.cosmicPurple}; }
        .tiptap-editor-area .ProseMirror pre { background: #0d1117; border-radius: 8px; padding: 14px 16px; margin: 12px 0; overflow-x: auto; }
        .tiptap-editor-area .ProseMirror pre code { background: none; padding: 0; color: #e2e8f0; font-size: 13px; line-height: 1.6; }
        .tiptap-editor-area .ProseMirror img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
        .tiptap-editor-area .ProseMirror iframe { width: 100%; border-radius: 8px; border: none; margin: 12px 0; aspect-ratio: 16/9; }
        .tiptap-editor-area .ProseMirror a { color: ${DS.blue}; text-decoration: underline; }
        .tiptap-editor-area .ProseMirror hr { border: none; border-top: 1px solid ${DS.border}; margin: 20px 0; }
        .tiptap-editor-area .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: ${DS.text4};
          pointer-events: none;
          float: left;
          height: 0;
        }
        .tiptap-editor-area .ProseMirror strong { font-weight: 700; }
      `}</style>

      <div className="tiptap-editor-area">
        <EditorContent editor={editor} />
      </div>

      {/* Footer stats */}
      <div style={{
        display: "flex", gap: 12, padding: "6px 12px",
        borderTop: `1px solid ${DS.border}`,
        background: DS.bgCard,
      }}>
        <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
          {charCount.toLocaleString()} ký tự · {wordCount.toLocaleString()} từ · ~{readTime} phút đọc
        </span>
      </div>

      {/* Modals */}
      {showLinkModal && (
        <LinkModal onConfirm={insertLink} onCancel={() => setShowLinkModal(false)} />
      )}
      {showImageModal && (
        <ImageModal
          onConfirm={(url, alt) => {
            if (url) editor?.chain().focus().setImage({ src: url, alt }).run();
            setShowImageModal(false);
          }}
          onCancel={() => setShowImageModal(false)}
        />
      )}
      {showYtModal && (
        <YoutubeModal
          onConfirm={url => {
            if (url) editor?.chain().focus().setYoutubeVideo({ src: url }).run();
            setShowYtModal(false);
          }}
          onCancel={() => setShowYtModal(false)}
        />
      )}
    </div>
  );
}