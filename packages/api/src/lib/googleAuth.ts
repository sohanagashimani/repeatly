import { google } from "googleapis";

let serviceAccount: any = null;
let googleAuth: any = null;
let apiKeysService: any = null;

function initializeGoogleAuth() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn(
      "GOOGLE_APPLICATION_CREDENTIALS not set - Google Cloud features will be disabled"
    );
    return;
  }

  try {
    serviceAccount = JSON.parse(
      Buffer.from(
        process.env.GOOGLE_APPLICATION_CREDENTIALS,
        "base64"
      ).toString()
    );

    googleAuth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    apiKeysService = google.apikeys({
      version: "v2",
      auth: googleAuth,
    });

    console.log("Google Cloud services initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Google Cloud services:", error);
    console.warn("Google Cloud features will be disabled");
  }
}

initializeGoogleAuth();

export { googleAuth, apiKeysService, serviceAccount };

export const getProjectId = (): string => {
  if (!serviceAccount?.project_id) {
    throw new Error(
      "Google Cloud services not initialized - check GOOGLE_APPLICATION_CREDENTIALS"
    );
  }
  return serviceAccount.project_id;
};
