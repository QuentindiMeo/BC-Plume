/**
 * In-memory browser local storage for tests. Stores data in a plain object so
 * tests can seed and inspect state directly without vi.fn() interaction assertions.
 */
export class FakeBrowserLocalStorage {
  readonly store: Record<string, unknown> = {};

  async set(data: Record<string, unknown>): Promise<void> {
    Object.assign(this.store, data);
  }

  async get(keys: string[]): Promise<Record<string, unknown>> {
    return Object.fromEntries(keys.map((k) => [k, this.store[k]]));
  }

  async remove(keys: string[]): Promise<void> {
    for (const key of keys) delete this.store[key];
  }
}
