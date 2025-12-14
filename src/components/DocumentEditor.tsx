'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useOptimizedDocument } from '@/hooks/useOptimizedDocument';
import { useAppStore } from '@/store/theme-store';
import { useAutocomplete } from '@/hooks/useAutocomplete';

interface DocumentEditorProps {
    documentId: string;
}

// HTML to Markdown converter
function htmlToMarkdown(html: string): string {
    let md = html;
    
    // Headings
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    
    // Bold and Italic
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    md = md.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');
    
    // Lists
    md = md.replace(/<ul[^>]*>/gi, '\n');
    md = md.replace(/<\/ul>/gi, '\n');
    md = md.replace(/<ol[^>]*>/gi, '\n');
    md = md.replace(/<\/ol>/gi, '\n');
    md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    
    // Blockquote
    md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
        return content.split('\n').map((line: string) => `> ${line}`).join('\n') + '\n\n';
    });
    
    // Code blocks
    md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    
    // Paragraphs and line breaks
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    md = md.replace(/<br\s*\/?>/gi, '\n');
    
    // Remove remaining HTML tags
    md = md.replace(/<[^>]+>/g, '');
    
    // Decode HTML entities
    md = md.replace(/&nbsp;/g, ' ');
    md = md.replace(/&amp;/g, '&');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');
    md = md.replace(/&quot;/g, '"');
    md = md.replace(/&#39;/g, "'");
    md = md.replace(/&ldquo;/g, '"');
    md = md.replace(/&rdquo;/g, '"');
    
    // Clean up extra whitespace
    md = md.replace(/\n{3,}/g, '\n\n');
    md = md.trim();
    
    return md;
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
    const { document, loading, saveDocument, error, saveStatus } = useOptimizedDocument(documentId);
    const { setTyping, focusMode, isTyping } = useAppStore();
    const { ghostText, handleTyping, acceptGhostText, dismissGhostText, isLoading, cacheHit } = useAutocomplete();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasInitializedRef = useRef(false);
    const [cursorPosition, setCursorPosition] = useState<{ top: number; left: number } | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exporting, setExporting] = useState(false);

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

    // Export to PDF
    const exportToPDF = useCallback(async () => {
        if (!editor || !document) return;
        
        setExporting(true);
        setShowExportMenu(false);
        
        const docTitle = document.title || 'Untitled';
        
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            
            // Create a styled container for PDF
            const content = window.document.createElement('div');
            content.innerHTML = `
                <div style="font-family: Georgia, serif; padding: 40px; max-width: 800px; margin: 0 auto;">
                    <h1 style="font-size: 28px; margin-bottom: 20px; color: #1a1a1a;">${docTitle}</h1>
                    <div style="font-size: 16px; line-height: 1.8; color: #333;">
                        ${editor.getHTML()}
                    </div>
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                        Exported from Writer • ${new Date().toLocaleDateString()}
                    </div>
                </div>
            `;
            
            const opt = {
                margin: [10, 10, 10, 10],
                filename: `${docTitle}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };
            
            await html2pdf().set(opt).from(content).save();
        } catch (err) {
            console.error('PDF export failed:', err);
            alert('Failed to export PDF. Please try again.');
        } finally {
            setExporting(false);
        }
    }, [editor, document]);

    // Export to Markdown
    const exportToMarkdown = useCallback(() => {
        if (!editor || !document) return;
        
        setShowExportMenu(false);
        
        const docTitle = document.title || 'Untitled';
        const html = editor.getHTML();
        const markdown = htmlToMarkdown(html);
        
        // Add title
        const fullMarkdown = `# ${docTitle}\n\n${markdown}\n\n---\n*Exported from Writer • ${new Date().toLocaleDateString()}*`;
        
        // Create download
        const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${docTitle}.md`;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [editor, document]);

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

                    <div className="w-px h-5 bg-foreground/10 mx-2" />

                    {/* Export Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className={`p-2 rounded transition-colors flex items-center gap-1 ${showExportMenu ? 'bg-foreground/20 text-foreground' : 'text-foreground/50 hover:text-foreground hover:bg-foreground/10'}`}
                            title="Export"
                            disabled={exporting}
                        >
                            {exporting ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            )}
                            <span className="text-sm">Export</span>
                            <svg className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Export dropdown */}
                        {showExportMenu && (
                            <div
                                className="absolute top-full left-0 mt-2 w-44 rounded-xl overflow-hidden shadow-xl z-50"
                                style={{
                                    background: 'rgba(0,0,0,0.9)',
                                    backdropFilter: 'blur(20px)',
                                }}
                            >
                                <button
                                    onClick={exportToPDF}
                                    className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                                >
                                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-2.5 9.5a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm-3.5 0a1 1 0 011-1h1a1 1 0 110 2H8a1 1 0 01-1-1z"/>
                                    </svg>
                                    <div>
                                        <div className="font-medium">PDF</div>
                                        <div className="text-xs text-white/50">Print-ready document</div>
                                    </div>
                                </button>
                                <button
                                    onClick={exportToMarkdown}
                                    className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                                >
                                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41zM6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.88v6.38h1.93zM19.69 12h-1.92V8.81h-1.92V12h-1.93l2.89 3.28L19.69 12z"/>
                                    </svg>
                                    <div>
                                        <div className="font-medium">Markdown</div>
                                        <div className="text-xs text-white/50">For GitHub, Notion, etc.</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
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
