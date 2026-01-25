import {
  initializeApp,
  getApps,
  cert,
  App,
  ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

let adminApp: App;
let adminDb: Firestore;

function getServiceAccount(): ServiceAccount | null {
  // Try to load from file first
  const serviceAccountPath = path.join(
    process.cwd(),
    "service-account.json"
  );
  
  if (fs.existsSync(serviceAccountPath)) {
    const content = fs.readFileSync(serviceAccountPath, "utf-8");
    return JSON.parse(content) as ServiceAccount;
  }

  // Fall back to environment variables
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  return null;
}

function getAdminApp(): App {
  if (getApps().length === 0) {
    const serviceAccount = getServiceAccount();
    
    if (serviceAccount) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      // For local development without credentials (will fail on actual calls)
      console.warn(
        "Firebase Admin: No service account found. Server-side Firebase operations will fail."
      );
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } else {
    adminApp = getApps()[0];
  }
  return adminApp;
}

export function getAdminFirestore(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp());
  }
  return adminDb;
}

export { getAdminApp };
