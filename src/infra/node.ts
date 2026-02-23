export enum PROCESS_ENV {
  PRODUCTION = "production",
  STAGING = "staging",
  TESTING = "testing",
  DEVELOPMENT = "development",
}
type ProcessEnvType = `${PROCESS_ENV}`;

const isNodeEnvValid = (val: string | undefined): val is ProcessEnvType => {
  return (Object.values(PROCESS_ENV) as string[]).includes(val || "");
};

const getMeta = (mode: ProcessEnvType): { env: ProcessEnvType } => {
  return {
    env: mode,
  };
};

// Use DEVELOPMENT as runtime fallback for TypeScript type-checking and for any environment that runs TS source directly.
const NODE_ENV = process.env["NODE_ENV"] as string | undefined;
export const meta = getMeta(isNodeEnvValid(NODE_ENV) ? NODE_ENV : PROCESS_ENV.DEVELOPMENT);
