import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button, Alert, message } from "antd";
import { useAuth } from "../hooks/useAuth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const {
    user,
    loading,
    resendVerificationEmail,
    createUserInBackend,
    checkEmailVerification,
  } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [userCreated, setUserCreated] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      if (!user) return;

      // If user is already verified, try to create them in backend
      if (user.emailVerified) {
        try {
          const created = await createUserInBackend();
          if (created) {
            setUserCreated(true);
          } else {
            // User already exists, which is fine
            setUserCreated(true);
          }
        } catch (error) {
          console.error("Error creating user in backend:", error);
          // If it's just that user already exists, treat as success
          setUserCreated(true);
        }
      } else {
        setNeedsVerification(true);
      }
    };

    initializeUser();
  }, [user, createUserInBackend]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (user && needsVerification && !user.emailVerified) {
      // Poll for email verification every 3 seconds
      interval = setInterval(async () => {
        try {
          const isVerified = await checkEmailVerification();
          if (isVerified) {
            message.success("Email verified successfully!");
            setNeedsVerification(false);
            // Attempt to create user in backend
            const created = await createUserInBackend();
            if (created) {
              setUserCreated(true);
              message.success("Account setup completed!");
            } else {
              setUserCreated(true); // User already exists
            }
          }
        } catch (error) {
          console.error("Error checking email verification:", error);
        }
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user, needsVerification, checkEmailVerification, createUserInBackend]);

  const handleManualCheck = async () => {
    if (!user) return;

    setIsChecking(true);
    try {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        message.success("Email verified!");
        setNeedsVerification(false);
        const created = await createUserInBackend();
        if (created) {
          setUserCreated(true);
          message.success("Account setup completed!");
        } else {
          setUserCreated(true); // User already exists
        }
      } else {
        message.warning("Email not verified yet. Please check your inbox.");
      }
    } catch (error) {
      message.error("Error checking verification status.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      await resendVerificationEmail();
      message.success("Verification email sent!");
    } catch (error) {
      message.error("Failed to send verification email.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if email verification is needed and user hasn't been created yet
  if (needsVerification || (!user.emailVerified && !userCreated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Email Verification Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please verify your email address to complete your account setup.
            </p>
            <Alert
              message="Verification Required"
              description="We're automatically checking for verification. You can also check manually below."
              type="warning"
              showIcon
              className="mb-6"
            />
            <div className="space-y-4">
              <Button
                type="primary"
                onClick={handleManualCheck}
                loading={isChecking}
                className="w-full"
              >
                {isChecking ? "Checking..." : "I've Verified My Email"}
              </Button>
              <Button onClick={handleResendEmail} className="w-full">
                Resend Verification Email
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
