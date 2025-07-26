import { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Button, Alert, message } from "antd";
import { useAuth } from "../hooks/useAuth";
import apiHelper from "../lib/apiHelper";

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
  const initializationAttempted = useRef(false);

  // Reset state when user changes
  useEffect(() => {
    if (user) {
      initializationAttempted.current = false;
      setUserCreated(false);
      setNeedsVerification(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only reset when user ID changes

  useEffect(() => {
    const checkOrCreateUser = async () => {
      if (!user || initializationAttempted.current) return;

      if (user.emailVerified) {
        try {
          // Try to fetch user from backend
          await apiHelper({ slug: "users/me", method: "GET" });
          setUserCreated(true);
        } catch (err: any) {
          if (err.status === 404) {
            await createUserInBackend();
            setUserCreated(true);
          } else {
            setUserCreated(false);
          }
        }
      } else {
        setNeedsVerification(true);
      }
      initializationAttempted.current = true;
    };

    checkOrCreateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (user && needsVerification && !user.emailVerified) {
      interval = setInterval(async () => {
        try {
          const isVerified = await checkEmailVerification();
          if (isVerified) {
            message.success("Email verified successfully!");
            setNeedsVerification(false);
            await createUserInBackend();
            setUserCreated(true);
            message.success("Account setup completed!");
          }
        } catch (error) {
          message.error("Error checking email verification.");
        }
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, needsVerification]); // Removed function dependencies

  const handleManualCheck = async () => {
    if (!user) return;

    setIsChecking(true);
    try {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        message.success("Email verified!");
        setNeedsVerification(false);
        try {
          await apiHelper({ slug: "users/me", method: "GET" });
          setUserCreated(true);
          message.success("Account setup completed!");
        } catch (err: any) {
          if (err.status === 404) {
            await createUserInBackend();
            setUserCreated(true);
            message.success("Account setup completed!");
          } else {
            setUserCreated(false);
          }
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
