'use client';

import { use } from 'react';
import { ContentArea } from "@/components/ContentArea";
import { Sidebar } from "@/components/Sidebar";
import { DocumentEditor } from "@/components/DocumentEditor";
import { useOptimizedAuth } from "@/components/OptimizedAuthProvider";
import { DocumentLoading } from "@/components/LoadingStates";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function DocumentPage({ params }: PageProps) {
    const { id } = use(params);
    const { user, loading } = useOptimizedAuth();

    if (loading) {
        return (
            <ContentArea>
                <DocumentLoading />
            </ContentArea>
        );
    }

    if (!user) {
        return (
            <>
                <Sidebar currentDocId={id} />
                <ContentArea>
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <h1 className="text-2xl font-semibold mb-4">Sign in required</h1>
                        <p className="text-foreground/70">
                            Please sign in to access this document.
                        </p>
                    </div>
                </ContentArea>
            </>
        );
    }

    return (
        <>
            <Sidebar currentDocId={id} />
            <ContentArea>
                <DocumentEditor documentId={id} />
            </ContentArea>
        </>
    );
}
