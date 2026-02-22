import { APP_VERSION } from "../domain/meta";

export enum CPL {
  DEBUG = "debug",
  INFO = "info",
  LOG = "log",
  WARN = "warn",
  ERROR = "error",
}
type CPLType = `${CPL}`;

const ConsolePrintingPrefix: Record<CPLType, string> = {
  [CPL.DEBUG]: "DEBUG",
  [CPL.INFO]: "INFO.",
  [CPL.LOG]: "LOG..",
  [CPL.WARN]: "WARN?",
  [CPL.ERROR]: "ERR?!",
};

const createLogger = (prefix: string) => {
  return (method: CPLType, ...toPrint: any[]) => {
    const now = new Date();
    const nowTime = now.toLocaleTimeString();
    const nowMilliseconds = now.getMilliseconds().toString().padStart(3, "0");
    console[method](`[${prefix} ${ConsolePrintingPrefix[method]} | ${nowTime}.${nowMilliseconds}]`, ...toPrint);
  };
};

export const logger = createLogger(`Plume_${APP_VERSION}`);
