'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/theme-store';

export function Editor() {
    const { setTyping, focusMode, isTyping } = useAppStore();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        },
        onUpdate: () => {
            // Set typing to true
            setTyping(true);

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Set timeout to reset typing state after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                setTyping(false);
            }, 2000);
        },
        onFocus: () => {
            setTyping(true);
        },
        onBlur: () => {
            // Small delay before removing typing state
            setTimeout(() => {
                setTyping(false);
            }, 500);
        },
    });

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className={`editor-wrapper ${focusMode || isTyping ? 'editor-focused' : ''}`}>
            <EditorContent editor={editor} />
        </div>
    );
}
