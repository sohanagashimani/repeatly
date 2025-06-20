import { initializeApp, cert, type AppOptions } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { serviceAccount } from "./lib/googleAuth";

const firebaseConfig: AppOptions = {
  credential: cert({
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key,
  }),
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth as firebaseAuth };
