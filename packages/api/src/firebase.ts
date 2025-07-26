import { initializeApp, cert, type AppOptions } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { serviceAccount } from "./lib/googleAuth";

let app: any = null;
let auth: any = null;

function initializeFirebase() {
  if (!serviceAccount) {
    console.warn("Firebase not initialized - service account not available");
    return;
  }

  try {
    const firebaseConfig: AppOptions = {
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
    };

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    console.warn("Firebase authentication will be disabled");
  }
}

initializeFirebase();

export { auth as firebaseAuth };
