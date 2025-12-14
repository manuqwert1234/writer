'use client';

// Helper function to get Firebase instances when needed (lazy loaded)
export async function getFirebase() {
  const { default: app } = await import('./firebase');
  const { getAuth, onAuthStateChanged } = await import('firebase/auth');
  const { getFirestore } = await import('firebase/firestore');
  
  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    onAuthStateChanged
  };
}
