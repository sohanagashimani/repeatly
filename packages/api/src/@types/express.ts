/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      apiKeyId?: string;
      user?: {
        uid: string;
        email: string;
        emailVerified: boolean;
      };
    }
  }
}

export {};
