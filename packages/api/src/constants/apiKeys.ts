export const API_KEY_LIMITS = {
  MAX_KEYS_PER_USER: 2,
  MAX_KEY_NAME_LENGTH: 100,
  MIN_KEY_NAME_LENGTH: 1,
} as const;

export const API_KEY_MESSAGES = {
  MAX_KEYS_EXCEEDED: `Maximum of ${API_KEY_LIMITS.MAX_KEYS_PER_USER} API keys allowed per user`,
  KEY_NAME_REQUIRED: "Display name is required",
  KEY_NAME_TOO_LONG: `Display name must be ${API_KEY_LIMITS.MAX_KEY_NAME_LENGTH} characters or less`,
  USER_NOT_FOUND: "User not found. Please create your account first.",
  CREATION_FAILED: "Failed to create API key in Google Cloud",
} as const;
