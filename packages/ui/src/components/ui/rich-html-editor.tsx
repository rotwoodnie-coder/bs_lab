"use client";

import * as React from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import { Bold, ImagePlus, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react";

import { Button } from "./button";
import { sonnerToast } from "./sonner";
import type { RichMediaUploadContext } from "./rich-media-editor";
import { cn } from "../../lib/utils";

export type RichHtmlEditorUploadFn = (
  file: File,
  ctx?: RichMediaUploadContext,
) => Promise<{ src: string } | null>;

export type RichHtmlEditorProps = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  title?: React.ReactNode;
  onUploadImage: RichHtmlEditorUploadFn;
};

export type RichHtmlEditorHandle = {
  insertImageFromUrl: (src: string) => void;
};

function normalizeInitialHtml(html: string): string {
  const t = (html ?? "").trim();
  if (!t) return "<p></p>";
  if (t.startsWith("<")) return t;
  const esc = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<p>${esc}</p>`;
}

export const RichHtmlEditor = React.forwardRef<RichHtmlEditorHandle, RichHtmlEditorProps>(function RichHtmlEditor(
  props,
  ref,
) {
  const uploadRef = React.useRef(props.onUploadImage);
  React.useEffect(() => {
    uploadRef.current = props.onUploadImage;
  }, [props.onUploadImage]);

  const onChangeRef = React.useRef(props.onChange);
  React.useEffect(() => {
    onChangeRef.current = props.onChange;
  }, [props.onChange]);

  const disabledRef = React.useRef(props.disabled);
  React.useEffect(() => {
    disabledRef.current = props.disabled;
  }, [props.disabled]);

  const editorRef = React.useRef<Editor | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { HTMLAttributes: { class: "list-disc pl-5" } },
        orderedList: { HTMLAttributes: { class: "list-decimal pl-5" } },
        link: { openOnClick: false, autolink: true, linkOnPaste: true },
      }),
      Table.configure({ resizable: false, HTMLAttributes: { class: "border-collapse w-full text-sm" } }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: props.placeholder || "请输入内容，支持粘贴图片。" }),
    ],
    content: normalizeInitialHtml(props.value),
    editable: !props.disabled,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none min-h-[200px] px-3 py-2 outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/40 rounded-b-md",
          "text-[15px] text-foreground [&_p]:leading-[1.75] [&_li]:leading-[1.75]",
          "[&_p]:my-2 [&_p]:min-h-[1.25em]",
          "[&_ul]:my-2 [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:pl-6",
          "[&_li]:my-0.5",
          "[&_h1]:mt-4 [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:leading-snug",
          "[&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:leading-snug",
          "[&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:leading-snug",
          "[&_table]:my-3 [&_table]:border-collapse [&_table]:w-full",
          "[&_th]:border [&_td]:border [&_th]:border-border [&_td]:border-border [&_th]:bg-muted/50 [&_th]:px-2 [&_td]:px-2 [&_th]:py-1.5 [&_td]:py-1.5",
          "[&_img]:my-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md",
        ),
      },
      handlePaste(_view, event) {
        const cd = event.clipboardData;
        if (!cd || disabledRef.current) return false;
        const imageFiles = Array.from(cd.files).filter((f) => f.type.startsWith("image/"));
        if (!imageFiles.length) return false;
        event.preventDefault();
        void (async () => {
          try {
            const ed = editorRef.current;
            if (!ed) return;
            for (const file of imageFiles) {
              const r = await uploadRef.current(file);
              const src = r?.src?.trim();
              if (src) ed.chain().focus().setImage({ src }).run();
            }
          } catch (e) {
            console.error(e);
            sonnerToast.error("图片粘贴失败", {
              description: e instanceof Error ? e.message : "请重试或使用工具栏插入图片。",
            });
          }
        })();
        return true;
      },
    },
    onUpdate({ editor: ed }) {
      onChangeRef.current(ed.getHTML());
    },
    onCreate({ editor: ed }) {
      editorRef.current = ed;
    },
  });

  React.useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  React.useEffect(() => {
    if (!editor) return;
    editor.setEditable(!props.disabled);
  }, [editor, props.disabled]);

  React.useEffect(() => {
    if (!editor) return;
    const next = normalizeInitialHtml(props.value);
    const cur = editor.getHTML();
    if (next === cur) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [props.value, editor]);

  React.useImperativeHandle(ref, () => ({
    insertImageFromUrl(src: string) {
      const s = src.trim();
      if (!s || !editorRef.current) return;
      editorRef.current.chain().focus().setImage({ src: s }).run();
    },
  }));

  if (!editor) return <div className="min-h-[220px] rounded-md border border-border bg-muted/30" aria-hidden />;

  return (
    <div className={cn("rounded-md border border-border bg-background", props.className)}>
      {props.title ? <div className="border-b border-border px-3 py-2 text-sm font-medium text-foreground">{props.title}</div> : null}
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/40 px-2 py-1">
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={props.disabled} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="加粗"><Bold className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={props.disabled} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="斜体"><Italic className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={props.disabled} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="无序列表"><List className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={props.disabled} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="有序列表"><ListOrdered className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={props.disabled} onClick={() => editor.chain().focus().undo().run()} aria-label="撤销"><Undo2 className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={props.disabled} onClick={() => editor.chain().focus().redo().run()} aria-label="重做"><Redo2 className="h-4 w-4" /></Button>
        <label className="ml-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-muted">
          <input type="file" accept="image/*" className="sr-only" disabled={props.disabled} onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f || props.disabled) return;
            const r = await uploadRef.current(f);
            const src = r?.src?.trim();
            if (src) editor.chain().focus().setImage({ src }).run();
          }} />
          <ImagePlus className="h-4 w-4" aria-hidden />
          <span className="sr-only">插入图片</span>
        </label>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
});
