"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon, Undo, Redo } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCallback, useEffect } from 'react'

interface EditorProps {
    content: string
    onChange: (html: string) => void
    editable?: boolean
}

export default function Editor({ content, onChange, editable = true }: EditorProps) {
    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file)

            if (uploadError) {
                console.error('Error uploading image:', uploadError)
                alert('Failed to upload image')
                return null
            }

            const { data } = supabase.storage.from('images').getPublicUrl(filePath)
            return data.publicUrl
        } catch (error) {
            console.error('Error uploading image:', error)
            return null
        }
    }

    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'underline underline-offset-4',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg border border-border max-w-full',
                },
            }),
        ],
        content,
        editable,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose max-w-none focus:outline-none min-h-[300px] p-4',
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                    const file = event.dataTransfer.files[0]
                    if (file.type.startsWith('image/')) {
                        event.preventDefault()
                        uploadImage(file).then(url => {
                            if (url) {
                                const { schema } = view.state
                                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
                                if (coordinates) {
                                    const node = schema.nodes.image.create({ src: url })
                                    const transaction = view.state.tr.insert(coordinates.pos, node)
                                    view.dispatch(transaction)
                                }
                            }
                        })
                        return true
                    }
                }
                return false
            },
            handlePaste: (view, event, slice) => {
                const items = event.clipboardData?.items
                if (items) {
                    for (const item of items) {
                        if (item.type.indexOf('image') === 0) {
                            event.preventDefault()
                            const file = item.getAsFile()
                            if (file) {
                                uploadImage(file).then(url => {
                                    if (url) {
                                        const { schema } = view.state
                                        const node = schema.nodes.image.create({ src: url })
                                        const transaction = view.state.tr.replaceSelectionWith(node)
                                        view.dispatch(transaction)
                                    }
                                })
                            }
                            return true
                        }
                    }
                }
                return false
            }
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
    })

    // Update editor content when content prop changes (e.g. from Markdown import)
    useEffect(() => {
        if (editor && content && editor.getHTML() !== content) {
            editor.commands.setContent(content)
        }
    }, [editor, content])

    const setLink = useCallback(() => {
        if (!editor) return
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        if (url === null) return
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    const addImageButton = useCallback(() => {
        if (!editor) return
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async () => {
            if (input.files?.length) {
                const file = input.files[0]
                const url = await uploadImage(file)
                if (url) {
                    editor.chain().focus().setImage({ src: url }).run()
                }
            }
        }
        input.click()
    }, [editor])

    if (!editor) {
        return null
    }

    return (
        <div className="border border-input rounded-lg bg-background overflow-hidden">
            <div className="flex flex-wrap gap-1 p-2 border-b border-input bg-muted/30">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('bold') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                    title="Bold"
                    type="button" // Prevent form submission
                >
                    <Bold className="h-4 w-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('italic') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                    title="Italic"
                    type="button"
                >
                    <Italic className="h-4 w-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('strike') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                    title="Strikethrough"
                    type="button"
                >
                    <Strikethrough className="h-4 w-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    disabled={!editor.can().chain().focus().toggleCode().run()}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('code') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                    title="Inline Code"
                    type="button"
                >
                    <Code className="h-4 w-4" />
                </button>

                <div className="w-px h-6 bg-border mx-1 self-center"></div>

                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('heading', { level: 1 }) ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                    title="Heading 1"
                    type="button"
                >
                    <Heading1 className="h-4 w-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('heading', { level: 2 }) ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                    title="Heading 2"
                    type="button"
                >
                    <Heading2 className="h-4 w-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('heading', { level: 3 }) ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                    title="Heading 3"
                    type="button"
                >
                    <Heading3 className="h-4 w-4" />
                </button>

                <div className="w-px h-6 bg-border mx-1 self-center"></div>

                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('bulletList') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                    title="Bullet List"
                    type="button"
                >
                    <List className="h-4 w-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('orderedList') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                    title="Ordered List"
                    type="button"
                >
                    <ListOrdered className="h-4 w-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('blockquote') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                    title="Blockquote"
                    type="button"
                >
                    <Quote className="h-4 w-4" />
                </button>

                <div className="w-px h-6 bg-border mx-1 self-center"></div>

                <button
                    onClick={setLink}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('link') ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
                    title="Link"
                    type="button"
                >
                    <LinkIcon className="h-4 w-4" />
                </button>
                <button
                    onClick={addImageButton}
                    className="p-2 rounded hover:bg-muted text-muted-foreground"
                    title="Image"
                    type="button"
                >
                    <ImageIcon className="h-4 w-4" />
                </button>

                <div className="w-px h-6 bg-border mx-1 self-center"></div>

                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().chain().focus().undo().run()}
                    className="p-2 rounded hover:bg-muted text-muted-foreground disabled:opacity-50"
                    title="Undo"
                    type="button"
                >
                    <Undo className="h-4 w-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().chain().focus().redo().run()}
                    className="p-2 rounded hover:bg-muted text-muted-foreground disabled:opacity-50"
                    title="Redo"
                    type="button"
                >
                    <Redo className="h-4 w-4" />
                </button>
            </div>
            <EditorContent editor={editor} />
        </div>
    )
}
