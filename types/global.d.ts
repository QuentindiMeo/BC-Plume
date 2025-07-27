// Global type augmentations for browser extension APIs

declare global {
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
        get(keys?: string[] | string | null): Promise<Record<string, any>>;
        set(items: Record<string, any>): Promise<void>;
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
      get(callback: (items: Record<string, any>) => void): void;
      get(
        keys: string | string[] | null,
        callback: (items: Record<string, any>) => void
      ): void;
      set(items: Record<string, any>, callback?: () => void): void;
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
  icons?: Record<string, string>;
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
  icons?: Record<string, string>;
  browser_specific_settings?: {
    gecko: {
      id: string;
      strict_min_version?: string;
    };
  };
}

export type ExtensionManifest = ManifestV2 | ManifestV3;

export {};
