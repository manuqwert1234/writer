'use client';

import { useState, useEffect } from 'react';
import { useOptimizedAuth } from './OptimizedAuthProvider';
import { useOptimizedDocuments } from '@/hooks/useOptimizedDocuments';
import { createOptimizedDocument } from '@/hooks/useOptimizedDocument';
import { useAppStore } from '@/store/theme-store';
import { useRouter } from 'next/navigation';

interface SidebarProps {
    currentDocId?: string;
}

export function Sidebar({ currentDocId }: SidebarProps) {
    const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, loading: authLoading } = useOptimizedAuth();
    const { documents, loading: docsLoading, error: docsError, setupDocumentsListener } = useOptimizedDocuments();
    const { focusMode, isTyping } = useAppStore();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Setup documents listener when user changes
    useEffect(() => {
        if (user) {
            setupDocumentsListener(user.uid);
        }
    }, [user, setupDocumentsListener]);

    // Email auth state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [authError, setAuthError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const shouldFade = focusMode || isTyping;

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setIsSubmitting(true);

        try {
            const result = isSignUp
                ? await signUpWithEmail(email, password)
                : await signInWithEmail(email, password);

            if (!result.success && result.error) {
                setAuthError(result.error.replace('Firebase: ', ''));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateNew = async () => {
        if (!user) return;
        setCreating(true);
        try {
            const newId = await createOptimizedDocument(user.uid);
            router.push(`/doc/${newId}`);
            setIsOpen(false);
        } catch (error: any) {
            console.error('Error creating document:', error);
            alert(`Failed to create document: ${error.message}`);
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
            {/* Toggle button - aligned with navbar center */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed left-4 z-50 p-3 rounded-full transition-all duration-500 ${shouldFade && !isOpen ? 'opacity-10 hover:opacity-100' : 'opacity-100'
                    } hover:bg-foreground/5`}
                style={{ top: '2rem', transform: 'translateY(-50%)' }}
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
                        <div className="space-y-4">
                            <form onSubmit={handleEmailAuth} className="space-y-3">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 bg-foreground/5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 bg-foreground/5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20"
                                    required
                                    minLength={6}
                                />
                                {authError && (
                                    <div className="text-xs text-red-400">{authError}</div>
                                )}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-2 px-4 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                                </button>
                            </form>

                            <button
                                type="button"
                                onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
                                className="w-full text-xs text-foreground/50 hover:text-foreground/80"
                            >
                                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-foreground/10"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-2 bg-black text-foreground/50">or</span>
                                </div>
                            </div>

                            <button
                                onClick={signInWithGoogle}
                                className="w-full py-2 px-4 bg-foreground/5 rounded-lg font-medium hover:bg-foreground/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>
                        </div>
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
                                {docsError ? (
                                    <div className="text-sm text-red-500 px-2">
                                        Error: {docsError}
                                    </div>
                                ) : docsLoading ? (
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
