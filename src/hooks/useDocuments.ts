'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';

interface DocumentMeta {
    id: string;
    title: string;
    updatedAt: Date;
}

export function useDocuments() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<DocumentMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setDocuments([]);
            setLoading(false);
            return;
        }

        // Try with orderBy first (requires composite index)
        // Fall back to simple query if index not ready
        const tryQuery = async () => {
            try {
                // First try with ordering (needs index)
                const orderedQuery = query(
                    collection(db, 'documents'),
                    where('userId', '==', user.uid),
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
                                where('userId', '==', user.uid)
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

                return unsubscribe;
            } catch (err) {
                console.error('Query setup failed:', err);
                setError('Failed to setup document listener');
                setLoading(false);
            }
        };

        const cleanup = tryQuery();

        return () => {
            cleanup?.then(unsub => unsub?.());
        };
    }, [user]);

    return { documents, loading, error };
}
