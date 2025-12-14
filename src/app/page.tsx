'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentArea } from "@/components/ContentArea";
import { Sidebar } from "@/components/Sidebar";
import { useOptimizedAuth } from "@/components/OptimizedAuthProvider";
import { DocumentLoading } from "@/components/LoadingStates";
import { createOptimizedDocument } from "@/hooks/useOptimizedDocument";

export default function Home() {
  const { user, loading } = useOptimizedAuth();
  const router = useRouter();

  // Redirect to first document or create new one
  useEffect(() => {
    if (!loading && user) {
      // For now, create a new document and redirect
      // In production, you might want to fetch the most recent document
      createOptimizedDocument(user.uid).then((docId) => {
        router.push(`/doc/${docId}`);
      });
    }
  }, [user, loading, router]);

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
        <Sidebar />
        <ContentArea>
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to Writer</h1>
            <p className="text-lg text-foreground/70 mb-8 max-w-md">
              A minimal, distraction-free writing space with real-time cloud sync.
            </p>
            <p className="text-foreground/50">
              Open the sidebar to sign in and start writing.
            </p>
          </div>
        </ContentArea>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <ContentArea>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-foreground/50">Creating new document...</div>
        </div>
      </ContentArea>
    </>
  );
}
