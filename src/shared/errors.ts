export class HttpFetchError extends Error {
  constructor(status: number, url: string) {
    super(`HTTP ${status} for ${url}`);
    this.name = "HttpFetchError";
  }
}

export class BrowserApiError extends Error {
  constructor() {
    super("No compatible browser API found. This extension requires a Chromium-based or Firefox-based browser.");
    this.name = "BrowserApiError";
  }
}

export class UnhandledActionError extends Error {
  constructor(action: never) {
    super(`Unhandled action type: ${JSON.stringify(action)} — implementation missing for this action.`);
    this.name = "UnhandledActionError";
  }
}

export class AdapterNotRegisteredError extends Error {
  constructor(adapterName: string, registerFn: string) {
    super(`${adapterName} not registered — call ${registerFn}() first.`);
    this.name = "AdapterNotRegisteredError";
  }
}

export class AudioFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioFetchError";
  }
}
