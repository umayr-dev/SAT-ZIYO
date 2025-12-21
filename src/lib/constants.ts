// Application constants
export const APP_CONFIG = {
  name: "SAT Ziyo",
  description: "Comprehensive SAT English & Math practice",
  version: "1.0.0",
} as const;

// Validation constants
export const VALIDATION = {
  password: {
    minLength: 6,
    maxLength: 128,
  },
  email: {
    maxLength: 255,
  },
} as const;
