type ProcessEnv = "development" | "production" | "test";

export const process = ((mode: ProcessEnv): { env: { NODE_ENV: string } } => {
  return {
    env: {
      NODE_ENV: mode,
    },
  };
})("production"); // Default to development mode; can be overridden in tests or production builds.
