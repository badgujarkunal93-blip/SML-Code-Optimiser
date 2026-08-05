import crypto from "crypto";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  public generateKey(prefix: string, payload: unknown): string {
    const jsonStr = JSON.stringify(payload);
    const hash = crypto.createHash("sha256").update(jsonStr).digest("hex").slice(0, 24);
    return `${prefix}:${hash}`;
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  public set<T>(key: string, data: T, ttlSeconds = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const cacheService = new InMemoryCache();
