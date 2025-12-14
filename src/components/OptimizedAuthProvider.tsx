'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
    User,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { getFirebase } from '@/lib/lazyFirebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function OptimizedAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authInitialized, setAuthInitialized] = useState(false);

    // Initialize Firebase auth lazily
    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const initializeAuth = async () => {
            try {
                const { auth } = await getFirebase();
                const { onAuthStateChanged } = await import('firebase/auth');
                unsubscribe = onAuthStateChanged(auth, (user) => {
                    setUser(user);
                    setLoading(false);
                    setAuthInitialized(true);
                });
            } catch (error) {
                console.error('Failed to initialize Firebase auth:', error);
                setLoading(false);
                setAuthInitialized(true);
            }
        };

        initializeAuth();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const signInWithGoogle = useCallback(async () => {
        if (!authInitialized) return;
        
        try {
            const { auth } = await getFirebase();
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Google sign in error:', error);
        }
    }, [authInitialized]);

    const signInWithEmail = useCallback(async (email: string, password: string) => {
        if (!authInitialized) {
            return { success: false, error: 'Authentication not initialized' };
        }

        try {
            const { auth } = await getFirebase();
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
            console.error('Email sign in error:', error);
            return { success: false, error: errorMessage };
        }
    }, [authInitialized]);

    const signUpWithEmail = useCallback(async (email: string, password: string) => {
        if (!authInitialized) {
            return { success: false, error: 'Authentication not initialized' };
        }

        try {
            const { auth } = await getFirebase();
            await createUserWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
            console.error('Email sign up error:', error);
            return { success: false, error: errorMessage };
        }
    }, [authInitialized]);

    const signOut = useCallback(async () => {
        if (!authInitialized) return;
        
        try {
            const { auth } = await getFirebase();
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }, [authInitialized]);

    const value = {
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useOptimizedAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useOptimizedAuth must be used within an OptimizedAuthProvider');
    }
    return context;
}
