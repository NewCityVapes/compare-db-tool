"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useState } from "react";
import { Iframe } from "./IframeExtension";

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 rounded text-sm min-w-[28px] ${
        active ? "bg-gray-800 text-white" : "hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [moreOpen, setMoreOpen] = useState(false);

  function currentBlockValue(): string {
    if (editor.isActive("heading", { level: 2 })) return "h2";
    if (editor.isActive("heading", { level: 3 })) return "h3";
    if (editor.isActive("heading", { level: 4 })) return "h4";
    return "p";
  }

  function setBlock(value: string) {
    if (value === "p") editor.chain().focus().setParagraph().run();
    else if (value === "h2")
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    else if (value === "h3")
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    else if (value === "h4")
      editor.chain().focus().toggleHeading({ level: 4 }).run();
  }

  function setLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }

  function insertImage() {
    const url = window.prompt("Image URL");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }

  function insertVideo() {
    const url = window.prompt(
      "Video embed URL (e.g. a YouTube/Vimeo embed link)",
    );
    if (!url) return;
    editor.chain().focus().insertContent({ type: "iframe", attrs: { src: url } }).run();
  }

  function insertTable() {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border border-b-0 rounded-t p-2 bg-gray-50">
      <select
        value={currentBlockValue()}
        onChange={(e) => setBlock(e.target.value)}
        className="text-sm border rounded px-1 py-1 bg-white"
      >
        <option value="p">Paragraph</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
      </select>

      <span className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <input
        type="color"
        title="Text color"
        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        className="w-7 h-7 p-0 border rounded cursor-pointer"
      />

      <span className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton
        title="Align left"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        ≡
      </ToolbarButton>
      <ToolbarButton
        title="Align center"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        ≣
      </ToolbarButton>
      <ToolbarButton
        title="Align right"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        ≡
      </ToolbarButton>

      <span className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton title="Link" active={editor.isActive("link")} onClick={setLink}>
        🔗
      </ToolbarButton>
      <ToolbarButton title="Image" onClick={insertImage}>
        🖼
      </ToolbarButton>
      <ToolbarButton title="Video embed" onClick={insertVideo}>
        ▶
      </ToolbarButton>
      <ToolbarButton title="Table" onClick={insertTable}>
        ⊞
      </ToolbarButton>

      <span className="w-px h-5 bg-gray-300 mx-1" />

      <div className="relative">
        <ToolbarButton title="More" onClick={() => setMoreOpen((v) => !v)}>
          •••
        </ToolbarButton>
        {moreOpen && (
          <div className="absolute z-10 top-full left-0 mt-1 bg-white border rounded shadow-md flex flex-col min-w-[140px]">
            <button
              type="button"
              className="text-left text-sm px-3 py-2 hover:bg-gray-100"
              onClick={() => {
                editor.chain().focus().toggleBulletList().run();
                setMoreOpen(false);
              }}
            >
              Bullet list
            </button>
            <button
              type="button"
              className="text-left text-sm px-3 py-2 hover:bg-gray-100"
              onClick={() => {
                editor.chain().focus().toggleOrderedList().run();
                setMoreOpen(false);
              }}
            >
              Numbered list
            </button>
            <button
              type="button"
              className="text-left text-sm px-3 py-2 hover:bg-gray-100"
              onClick={() => {
                editor.chain().focus().toggleBlockquote().run();
                setMoreOpen(false);
              }}
            >
              Quote
            </button>
            <button
              type="button"
              className="text-left text-sm px-3 py-2 hover:bg-gray-100"
              onClick={() => {
                editor.chain().focus().toggleCodeBlock().run();
                setMoreOpen(false);
              }}
            >
              Code block
            </button>
            <button
              type="button"
              className="text-left text-sm px-3 py-2 hover:bg-gray-100"
              onClick={() => {
                editor.chain().focus().setHorizontalRule().run();
                setMoreOpen(false);
              }}
            >
              Divider
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const [htmlMode, setHtmlMode] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Iframe,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose max-w-none p-3 min-h-[400px] focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  function toggleHtmlMode() {
    if (!editor) return;
    if (!htmlMode) {
      setHtmlDraft(editor.getHTML());
    } else {
      editor.commands.setContent(htmlDraft);
      onChange(htmlDraft);
    }
    setHtmlMode((v) => !v);
  }

  if (!editor) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Toolbar editor={editor} />
        <button
          type="button"
          onClick={toggleHtmlMode}
          title="Toggle HTML source"
          className={`border rounded px-2 py-1 text-sm font-mono mb-0 ${
            htmlMode ? "bg-gray-800 text-white" : "hover:bg-gray-200"
          }`}
        >
          {"</>"}
        </button>
      </div>

      {htmlMode ? (
        <textarea
          value={htmlDraft}
          onChange={(e) => {
            setHtmlDraft(e.target.value);
            onChange(e.target.value);
          }}
          rows={18}
          className="w-full p-3 border rounded-b font-mono text-sm"
        />
      ) : (
        <div className="border rounded-b">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}
