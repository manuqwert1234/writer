'use client';

export function ContentArea({ children }: { children: React.ReactNode }) {
    return (
        <main className="pt-20 min-h-screen animate-soft-fade" style={{ background: 'transparent' }}>
            <div className="max-w-4xl mx-auto px-6 py-12">
                {children}
            </div>
        </main>
    );
}
