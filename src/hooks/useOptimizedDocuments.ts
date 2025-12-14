'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { getFirebase } from '@/lib/lazyFirebase';

interface DocumentMeta {
    id: string;
    title: string;
    updatedAt: Date;
}

export function useOptimizedDocuments() {
    const [documents, setDocuments] = useState<DocumentMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // This will be called from the component with the user ID
    const setupDocumentsListener = useCallback(async (userId: string) => {
        if (!userId) return;
        // Clean up previous listener
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }
        
        setLoading(true);
        setError(null);

        try {
            const { db } = await getFirebase();
            
            // Try with orderBy first (requires composite index)
            // Fall back to simple query if index not ready
            const tryQuery = async () => {
                try {
                    // First try with ordering (needs index)
                    const orderedQuery = query(
                        collection(db, 'documents'),
                        where('userId', '==', userId),
                        orderBy('updatedAt', 'desc')
                    );

                    const unsubscribe = onSnapshot(
                        orderedQuery,
                        (snapshot) => {
                            const docs = snapshot.docs.map((doc) => ({
                                id: doc.id,
                                title: doc.data().title || 'Untitled',
                                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
                            }));
                            setDocuments(docs);
                            setLoading(false);
                            setError(null);
                        },
                        async (err) => {
                            console.warn('Ordered query failed, trying simple query:', err.message);

                            // Fallback: Simple query without orderBy (no index needed)
                            try {
                                const simpleQuery = query(
                                    collection(db, 'documents'),
                                    where('userId', '==', userId)
                                );

                                const snapshot = await getDocs(simpleQuery);
                                const docs = snapshot.docs
                                    .map((doc) => ({
                                        id: doc.id,
                                        title: doc.data().title || 'Untitled',
                                        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
                                    }))
                                    // Sort client-side
                                    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

                                setDocuments(docs);
                                setLoading(false);
                                setError('Index building - using fallback query');
                            } catch (fallbackErr) {
                                console.error('Fallback query also failed:', fallbackErr);
                                setError('Failed to load documents');
                                setLoading(false);
                            }
                        }
                    );

                    unsubscribeRef.current = unsubscribe;
                } catch (err) {
                    console.error('Query setup failed:', err);
                    setError('Failed to setup document listener');
                    setLoading(false);
                }
            };

            await tryQuery();
        } catch (err) {
            console.error('Failed to initialize documents:', err);
            setError('Failed to initialize documents');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, []);

    return { 
        documents, 
        loading, 
        error, 
        setupDocumentsListener 
    };
}
