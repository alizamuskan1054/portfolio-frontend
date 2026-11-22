import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// HTML string in, HTML string out.
//   <RichTextEditor value={html} onChange={setHtml} placeholder="Write..." />
// React Hook Form: <Controller ... render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} />} />
function ToolButton({ label, active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // editor ka focus na jaye
      onClick={onClick}
      className={cn(
        'text-muted hover:bg-surface hover:text-heading flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-40',
        active && 'bg-primary-soft text-primary',
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  invalid = false,
  className,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'rte-content min-h-40 px-3 py-2 outline-none',
        'data-placeholder': placeholder ?? '',
      },
    },
    onUpdate: ({ editor: e }) => onChange?.(e.isEmpty ? '' : e.getHTML()),
  })

  // Bahar se value badle (form reset) to editor update ho
  useEffect(() => {
    if (!editor) return
    const current = editor.isEmpty ? '' : editor.getHTML()
    if ((value || '') !== current)
      editor.commands.setContent(value || '', { emitUpdate: false })
  }, [value, editor])

  if (!editor) return null

  const setLink = () => {
    const previous = editor.getAttributes('link').href ?? ''
    const url = window.prompt('Link URL (leave empty to remove)', previous)
    if (url === null) return
    if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div
      className={cn(
        'border-line bg-card focus-within:border-primary focus-within:ring-primary/30 overflow-hidden rounded-lg border focus-within:ring-2',
        invalid && 'border-danger',
        className,
      )}
    >
      <div className="border-line bg-surface flex flex-wrap items-center gap-0.5 border-b p-1">
        <ToolButton
          label="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolButton>
        <ToolButton
          label="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolButton>
        <ToolButton
          label="Heading"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </ToolButton>
        <ToolButton
          label="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolButton>
        <ToolButton
          label="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolButton>
        <ToolButton
          label="Quote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolButton>
        <ToolButton label="Link" active={editor.isActive('link')} onClick={setLink}>
          <Link2 className="size-4" />
        </ToolButton>
        <span className="bg-line mx-1 h-5 w-px" aria-hidden="true" />
        <ToolButton
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </ToolButton>
        <ToolButton
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </ToolButton>
      </div>
      <EditorContent editor={editor} className="text-body text-sm" />
    </div>
  )
}
