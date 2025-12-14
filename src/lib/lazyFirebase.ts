'use client';

import { lazy } from 'react';

// Lazy load Firebase modules
export const FirebaseApp = lazy(() => 
  import('./firebase').then(module => ({ default: module.default }))
);

export const FirebaseAuth = lazy(() => 
  import('firebase/auth').then(module => ({ default: module.getAuth }))
);

export const FirestoreDB = lazy(() => 
  import('firebase/firestore').then(module => ({ default: module.getFirestore }))
);

// Helper function to get Firebase instances when needed
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
