import { APP_VERSION } from "../constants";

export enum CPL {
  DEBUG = "debug",
  INFO = "info",
  LOG = "log",
  WARN = "warn",
  ERROR = "error",
}

export type CPLType = `${CPL}`;

const ConsolePrintingPrefix: Record<CPLType, string> = {
  [CPL.DEBUG]: "DEBUG",
  [CPL.INFO]: "INFO.",
  [CPL.LOG]: "LOG..",
  [CPL.WARN]: "WARN?",
  [CPL.ERROR]: "ERR?!",
};

export const logger = (method: CPLType, ...toPrint: any[]) => {
  const now = new Date();
  const nowTime = now.toLocaleTimeString();
  const nowMilliseconds = now.getMilliseconds().toString().padStart(3, "0");
  console[method](
    `[Plume_${APP_VERSION} ${ConsolePrintingPrefix[method]} | ${nowTime}.${nowMilliseconds}]`,
    ...toPrint
  );
};
