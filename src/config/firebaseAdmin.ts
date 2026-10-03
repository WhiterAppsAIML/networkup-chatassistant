import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let firebaseApp: App | null = null;
let firebaseAuth: Auth | null = null;

export function initializeFirebaseAdmin(): { app: App; auth: Auth } | null {
  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
    firebaseAuth = getAuth(firebaseApp);
    return { app: firebaseApp, auth: firebaseAuth };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey || projectId === "your-project-id") {
    console.warn("Firebase Admin credentials not configured. Auth middleware will not work.");
    return null;
  }

  try {
    firebaseApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    firebaseAuth = getAuth(firebaseApp);
    return { app: firebaseApp, auth: firebaseAuth };
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    return null;
  }
}

export function getFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    const result = initializeFirebaseAdmin();
    if (!result) {
      throw new Error("Firebase Admin not initialized. Check your credentials.");
    }
    return result.auth;
  }
  return firebaseAuth;
}

export function isFirebaseInitialized(): boolean {
  return firebaseAuth !== null;
}