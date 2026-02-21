export enum PROCESS_ENV {
  PRODUCTION = "production",
  STAGING = "staging",
  TESTING = "testing",
  DEVELOPMENT = "development",
}
type ProcessEnvType = `${PROCESS_ENV}`;

export const meta = ((mode: ProcessEnvType): { env: ProcessEnvType } => {
  return {
    env: mode,
  };
  // Use DEVELOPMENT as runtime fallback for TypeScript type-checking and for any environment that runs TS source directly.
})(process.env.NODE_ENV || PROCESS_ENV.DEVELOPMENT);
