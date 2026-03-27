declare module "vitest" {
  export type TestCallback = () => void | Promise<void>;

  export const describe: (name: string, fn: TestCallback) => void;
  export const it: (name: string, fn: TestCallback) => void;
  export const test: (name: string, fn: TestCallback) => void;
  export const beforeEach: (fn: TestCallback) => void;
  export const afterEach: (fn: TestCallback) => void;

  export const expect: any;

  export const vi: {
    fn: (...args: any[]) => any;
    spyOn: (...args: any[]) => any;
    mocked: <T>(item: T) => T;
    clearAllMocks: () => void;
    resetAllMocks: () => void;
    restoreAllMocks: () => void;
  };
}