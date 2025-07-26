export const API_KEY_LIMITS = {
  MAX_KEYS_PER_USER: 2,
  MAX_KEY_NAME_LENGTH: 100,
  MIN_KEY_NAME_LENGTH: 1,
} as const;

export const API_KEY_MESSAGES = {
  MAX_KEYS_EXCEEDED: `You can create a maximum of ${API_KEY_LIMITS.MAX_KEYS_PER_USER} API keys. Please revoke an existing key before creating a new one.`,
  KEY_NAME_REQUIRED: "Please enter a name for your API key",
  KEY_NAME_TOO_LONG: `API key name must be ${API_KEY_LIMITS.MAX_KEY_NAME_LENGTH} characters or less`,
} as const;
