export enum PROCESS_ENV {
  PRODUCTION = "production",
  STAGING = "staging",
  TESTING = "testing",
  DEVELOPMENT = "development",
}
type ProcessEnvType = `${PROCESS_ENV}`;

export const process = ((mode: ProcessEnvType): { env: ProcessEnvType } => {
  return {
    env: mode,
  };
})(PROCESS_ENV.DEVELOPMENT); // Default to development mode; can be overridden in tests or production builds.
