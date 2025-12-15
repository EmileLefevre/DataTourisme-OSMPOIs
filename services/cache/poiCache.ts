import { POIIndex } from "../interfaces/poiServiceInterface";

class POICache {
  private indexCache: POIIndex | null = null;
  private loadingPromise: Promise<POIIndex> | null = null;

  async getIndex(): Promise<POIIndex> {
    if (this.indexCache) {
      return this.indexCache;
    }
    if (this.loadingPromise) {
      return this.loadingPromise;
    }
    this.loadingPromise = this.loadFromServer();
    return this.loadingPromise;
  }

  private async loadFromServer(): Promise<POIIndex> {
    try {
      const response = await fetch("/POIs/poi-index.json");
      if (!response.ok) {
        throw new Error("Failed to load POI index");
      }

      this.indexCache = await response.json();
      return this.indexCache!;
    } catch {
      this.loadingPromise = null;
      return { pois: [], totalCount: 0, generatedAt: new Date().toISOString() };
    }
  }

  clear() {
    this.indexCache = null;
    this.loadingPromise = null;
  }
}

export const poiCache = new POICache();
