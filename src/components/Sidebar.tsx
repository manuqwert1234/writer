'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useDocuments } from '@/hooks/useDocuments';
import { createDocument } from '@/hooks/useDocument';
import { useAppStore } from '@/store/theme-store';

interface SidebarProps {
    currentDocId?: string;
}

export function Sidebar({ currentDocId }: SidebarProps) {
    const { user, signIn, signOut, loading: authLoading } = useAuth();
    const { documents, loading: docsLoading } = useDocuments();
    const { focusMode, isTyping } = useAppStore();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    const shouldFade = focusMode || isTyping;

    const handleCreateNew = async () => {
        if (!user) return;
        setCreating(true);
        try {
            const newId = await createDocument(user.uid);
            router.push(`/doc/${newId}`);
            setIsOpen(false);
        } catch (error) {
            console.error('Error creating document:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleDocClick = (docId: string) => {
        router.push(`/doc/${docId}`);
        setIsOpen(false);
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            {/* Toggle button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed top-4 left-4 z-50 p-3 rounded-full transition-all duration-500 ${shouldFade && !isOpen ? 'opacity-10 hover:opacity-100' : 'opacity-100'
                    } hover:bg-foreground/5`}
                aria-label="Toggle sidebar"
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-72 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
                }}
            >
                <div className="flex flex-col h-full p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-mono font-semibold">Documents</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-foreground/5 rounded-full"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Auth state */}
                    {authLoading ? (
                        <div className="text-sm text-foreground/50">Loading...</div>
                    ) : !user ? (
                        <button
                            onClick={signIn}
                            className="w-full py-3 px-4 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            Sign in with Google
                        </button>
                    ) : (
                        <>
                            {/* User info */}
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-foreground/10">
                                {user.photoURL && (
                                    <img
                                        src={user.photoURL}
                                        alt=""
                                        className="w-8 h-8 rounded-full"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                        {user.displayName}
                                    </div>
                                    <button
                                        onClick={signOut}
                                        className="text-xs text-foreground/50 hover:text-foreground/80"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </div>

                            {/* New document button */}
                            <button
                                onClick={handleCreateNew}
                                disabled={creating}
                                className="w-full py-3 px-4 mb-6 bg-foreground/5 rounded-lg font-medium hover:bg-foreground/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                {creating ? 'Creating...' : 'New Document'}
                            </button>

                            {/* Document list */}
                            <div className="flex-1 overflow-y-auto -mx-2">
                                {docsLoading ? (
                                    <div className="text-sm text-foreground/50 px-2">
                                        Loading documents...
                                    </div>
                                ) : documents.length === 0 ? (
                                    <div className="text-sm text-foreground/50 px-2">
                                        No documents yet
                                    </div>
                                ) : (
                                    <ul className="space-y-1">
                                        {documents.map((doc) => (
                                            <li key={doc.id}>
                                                <button
                                                    onClick={() => handleDocClick(doc.id)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${currentDocId === doc.id
                                                        ? 'bg-foreground/10'
                                                        : 'hover:bg-foreground/5'
                                                        }`}
                                                >
                                                    <div className="font-medium truncate">{doc.title}</div>
                                                    <div className="text-xs text-foreground/50">
                                                        {formatDate(doc.updatedAt)}
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </aside>
        </>
    );
}
