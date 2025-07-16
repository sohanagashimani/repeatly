import { useState } from "react";
import { Button, Form, Input, message, Alert } from "antd";
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";
import { useAuthRedirect } from "../hooks/useAuthRedirect";
import { useNavigate, Link } from "react-router-dom";

interface AuthFormValues {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const { signIn, signUp, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if user is already authenticated
  useAuthRedirect();

  const onFinish = async (values: AuthFormValues) => {
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(values.email, values.password, {
          firstName: values.firstName,
          lastName: values.lastName,
        });
        setVerificationSent(true);
        message.success(
          "Account created! Please check your email to verify your account."
        );
      } else {
        await signIn(values.email, values.password);
        message.success("Signed in successfully!");
        navigate("/");
      }
    } catch (error: any) {
      // Handle specific Firebase auth errors
      let errorMessage = "Authentication failed. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage =
          "This email is already registered. Please sign in instead.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email. Please sign up.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage =
          "This account has been disabled. Please contact support.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
        // eslint-disable-next-line no-dupe-else-if
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage =
          "This email is already registered. Please sign in instead.";
      }
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      message.success("Verification email sent!");
    } catch (error) {
      message.error("Failed to send verification email.");
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <CheckCircleOutlined className="text-4xl text-green-500 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Check your email
              </h2>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                We&apos;ve sent a verification link to your email address. Click
                the link to verify your account.
              </p>
              <div className="space-y-3">
                <Button
                  type="primary"
                  onClick={handleResendVerification}
                  className="w-full"
                  size="middle"
                >
                  Resend verification email
                </Button>
                <Button
                  onClick={() => {
                    setVerificationSent(false);
                    setIsSignUp(false);
                  }}
                  className="w-full"
                  size="middle"
                >
                  Back to sign in
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 mb-6">
            <CheckCircleOutlined className="text-xl mr-2" />
            <span className="text-xl font-semibold">Repeatly</span>
          </Link>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </h2>
          <p className="text-sm text-gray-600">
            {isSignUp ? "Get started with Repeatly" : "Welcome back"}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <Form
            name="auth"
            onFinish={onFinish}
            layout="vertical"
            size="middle"
            requiredMark={false}
          >
            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="firstName"
                  label="First name"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="First name" />
                </Form.Item>
                <Form.Item
                  name="lastName"
                  label="Last name"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="Last name" />
                </Form.Item>
              </div>
            )}

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="Enter your email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Password is required" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Enter your password"
              />
            </Form.Item>

            <Form.Item className="mb-4">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full"
                size="large"
              >
                {isSignUp ? "Create account" : "Sign in"}
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
