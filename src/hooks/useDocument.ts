'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';

interface Document {
    id: string;
    userId: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export function useDocument(documentId: string | null) {
    const { user } = useAuth();
    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingContentRef = useRef<string | null>(null);

    // Listen to document changes in real-time
    useEffect(() => {
        if (!documentId || !user) {
            setDocument(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const docRef = doc(db, 'documents', documentId);

        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setDocument({
                        id: snapshot.id,
                        userId: data.userId,
                        title: data.title || 'Untitled',
                        content: data.content || '',
                        createdAt: data.createdAt?.toDate() || new Date(),
                        updatedAt: data.updatedAt?.toDate() || new Date(),
                    });
                } else {
                    setDocument(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error('Document listener error:', err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [documentId, user]);

    // Debounced save function (1000ms delay)
    const saveDocument = useCallback(
        (content: string, title?: string) => {
            if (!documentId || !user) return;

            pendingContentRef.current = content;

            // Clear existing timeout
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            // Set new timeout for debounced save
            saveTimeoutRef.current = setTimeout(async () => {
                try {
                    const docRef = doc(db, 'documents', documentId);
                    await setDoc(
                        docRef,
                        {
                            content: pendingContentRef.current,
                            ...(title && { title }),
                            updatedAt: serverTimestamp(),
                        },
                        { merge: true }
                    );
                } catch (err) {
                    console.error('Save error:', err);
                    setError(err as Error);
                }
            }, 1000);
        },
        [documentId, user]
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return { document, loading, error, saveDocument };
}

// Create a new document
export async function createDocument(userId: string): Promise<string> {
    const newDocRef = doc(db, 'documents', crypto.randomUUID());

    await setDoc(newDocRef, {
        userId,
        title: 'Untitled',
        content: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return newDocRef.id;
}
