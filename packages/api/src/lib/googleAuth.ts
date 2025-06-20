import { google } from "googleapis";

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set");
}

// Parse the base64 encoded service account once
const serviceAccount = JSON.parse(
  Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, "base64").toString()
);

// Create reusable Google Auth instance
export const googleAuth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

// Pre-initialized Google API services
export const apiKeysService = google.apikeys({
  version: "v2",
  auth: googleAuth,
});

// Export the service account for other uses (like Firebase)
export { serviceAccount };

// Helper to get project ID from service account
export const getProjectId = (): string => {
  return serviceAccount.project_id;
};
