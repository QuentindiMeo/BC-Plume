// Global type augmentations for browser extension APIs

declare global {
  // -------- GENERIC TYPES --------
  type Dict<T> = Record<string, T>;

  /**
   * Chrome extension API types
   */
  interface Window {
    chrome?: typeof chrome;
    browser?: typeof browser;
  }

  /**
   * Firefox browser API compatibility
   */
  const browser: {
    storage: {
      local: {
        get(keys?: string[] | string | null): Promise<Dict<any>>;
        set(items: Dict<any>): Promise<void>;
        remove(keys: string | string[]): Promise<void>;
        clear(): Promise<void>;
      };
    };
    runtime: {
      id: string;
      getManifest(): chrome.runtime.Manifest;
    };
  };

  /**
   * Chrome storage API type enhancement
   */
  namespace chrome.storage {
    interface StorageArea {
      get(callback: (items: Dict<any>) => void): void;
      get(keys: string | string[] | null, callback: (items: Dict<any>) => void): void;
      set(items: Dict<any>, callback?: () => void): void;
    }
  }
}

/**
 * Manifest version compatibility
 */
export interface ManifestV2 {
  manifest_version: 2;
  name: string;
  version: string;
  description: string;
  permissions?: string[];
  content_scripts?: Array<{
    matches: string[];
    js: string[];
    css?: string[];
    run_at?: "document_start" | "document_end" | "document_idle";
  }>;
  icons?: Dict<string>;
  applications?: {
    gecko: {
      id: string;
      strict_min_version?: string;
    };
  };
}

export interface ManifestV3 {
  manifest_version: 3;
  name: string;
  version: string;
  description: string;
  permissions?: string[];
  host_permissions?: string[];
  content_scripts?: Array<{
    matches: string[];
    js: string[];
    css?: string[];
    run_at?: "document_start" | "document_end" | "document_idle";
  }>;
  icons?: Dict<string>;
  browser_specific_settings?: {
    gecko: {
      id: string;
      strict_min_version?: string;
    };
  };
}

export type ExtensionManifest = ManifestV2 | ManifestV3;

export {};
