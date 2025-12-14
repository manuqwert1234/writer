'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useOptimizedDocument } from '@/hooks/useOptimizedDocument';
import { useAppStore } from '@/store/theme-store';
import { useAutocomplete } from '@/hooks/useAutocomplete';

interface DocumentEditorProps {
    documentId: string;
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
    const { document, loading, saveDocument, error, saveStatus } = useOptimizedDocument(documentId);
    const { setTyping, focusMode, isTyping } = useAppStore();
    const { ghostText, handleTyping, acceptGhostText, dismissGhostText, isLoading, cacheHit } = useAutocomplete();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasInitializedRef = useRef(false);
    const [cursorPosition, setCursorPosition] = useState<{ top: number; left: number } | null>(null);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder: 'Start writing...',
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'editor-content',
            },
            handleKeyDown: (view, event) => {
                if (event.key === 'Tab' && ghostText) {
                    event.preventDefault();
                    const text = acceptGhostText();
                    if (text) {
                        view.dispatch(view.state.tr.insertText(text));
                    }
                    return true;
                }
                if (event.key === 'Escape' && ghostText) {
                    dismissGhostText();
                    return true;
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            setTyping(true);
            handleTyping(editor);

            const coords = editor.view.coordsAtPos(editor.state.selection.anchor);
            setCursorPosition({ top: coords.top, left: coords.left });

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                setTyping(false);
            }, 2000);

            const content = editor.getHTML();
            saveDocument(content);
        },
        onSelectionUpdate: ({ editor }) => {
            const coords = editor.view.coordsAtPos(editor.state.selection.anchor);
            setCursorPosition({ top: coords.top, left: coords.left });
        },
        onFocus: () => {
            setTyping(true);
        },
        onBlur: () => {
            setTimeout(() => {
                setTyping(false);
                dismissGhostText();
            }, 500);
        },
    });

    useEffect(() => {
        if (editor && document && !hasInitializedRef.current) {
            editor.commands.setContent(document.content || '');
            hasInitializedRef.current = true;
        }
    }, [editor, document]);

    useEffect(() => {
        hasInitializedRef.current = false;
        dismissGhostText();
    }, [documentId, dismissGhostText]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-foreground/50">Loading document...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="text-red-500 mb-4">Error loading document</div>
                <p className="text-foreground/70 mb-4">{error.message}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-foreground/50">Document not found</div>
            </div>
        );
    }

    // Toolbar button style
    const btnClass = (active: boolean) =>
        `p-2 rounded transition-colors ${active ? 'bg-foreground/20 text-foreground' : 'text-foreground/50 hover:text-foreground hover:bg-foreground/10'}`;

    return (
        <div className={`editor-wrapper relative ${focusMode || isTyping ? 'editor-focused' : ''}`}>

            {/* Fixed Formatting Toolbar */}
            {editor && (
                <div
                    className="sticky top-20 z-30 mb-4 flex items-center gap-1 px-3 py-2 rounded-xl"
                    style={{
                        background: 'rgba(128,128,128,0.1)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    {/* Bold */}
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={btnClass(editor.isActive('bold'))}
                        title="Bold (Ctrl+B)"
                    >
                        <strong>B</strong>
                    </button>

                    {/* Italic */}
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={btnClass(editor.isActive('italic'))}
                        title="Italic (Ctrl+I)"
                    >
                        <em>I</em>
                    </button>

                    {/* Strikethrough */}
                    <button
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={btnClass(editor.isActive('strike'))}
                        title="Strikethrough"
                    >
                        <s>S</s>
                    </button>

                    <div className="w-px h-5 bg-foreground/10 mx-2" />

                    {/* Heading 1 */}
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={btnClass(editor.isActive('heading', { level: 1 }))}
                        title="Heading 1"
                    >
                        H1
                    </button>

                    {/* Heading 2 */}
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={btnClass(editor.isActive('heading', { level: 2 }))}
                        title="Heading 2"
                    >
                        H2
                    </button>

                    {/* Heading 3 */}
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={btnClass(editor.isActive('heading', { level: 3 }))}
                        title="Heading 3"
                    >
                        H3
                    </button>

                    <div className="w-px h-5 bg-foreground/10 mx-2" />

                    {/* Bullet List */}
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={btnClass(editor.isActive('bulletList'))}
                        title="Bullet List"
                    >
                        • List
                    </button>

                    {/* Ordered List */}
                    <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={btnClass(editor.isActive('orderedList'))}
                        title="Numbered List"
                    >
                        1. List
                    </button>

                    {/* Quote */}
                    <button
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={btnClass(editor.isActive('blockquote'))}
                        title="Quote"
                    >
                        &ldquo; Quote
                    </button>

                    {/* Code Block */}
                    <button
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        className={btnClass(editor.isActive('codeBlock'))}
                        title="Code Block"
                    >
                        {'</>'}
                    </button>
                </div>
            )}

            <EditorContent editor={editor} />

            {/* Ghost Text */}
            {ghostText && cursorPosition && (
                <span
                    className="pointer-events-none fixed z-50 text-foreground/40 italic"
                    style={{
                        top: cursorPosition.top,
                        left: cursorPosition.left,
                        maxWidth: 'calc(100vw - 100px - ' + cursorPosition.left + 'px)',
                        fontFamily: 'inherit',
                        fontSize: '1rem',
                        lineHeight: '1.75',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {ghostText}
                </span>
            )}

            {/* Status indicators */}
            <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 items-end">
                {/* Save status */}
                {saveStatus !== 'idle' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 text-foreground/50 text-xs">
                        {saveStatus === 'saving' && (
                            <>
                                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                                Saving...
                            </>
                        )}
                        {saveStatus === 'saved' && (
                            <>
                                <span className="text-green-500">✓</span>
                                Saved
                            </>
                        )}
                        {saveStatus === 'error' && (
                            <>
                                <span className="text-red-500">✗</span>
                                Save failed
                            </>
                        )}
                    </div>
                )}
                
                {/* AI status */}
                {(isLoading || (ghostText && cacheHit)) && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 text-foreground/50 text-xs">
                        {isLoading ? (
                            <>
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                AI thinking...
                            </>
                        ) : cacheHit ? (
                            <>
                                <span className="text-green-500">⚡</span>
                                Instant (cached)
                            </>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}
