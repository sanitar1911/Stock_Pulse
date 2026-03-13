import type { InsertWatchlist, Watchlist } from "@shared/schema";

export interface IStorage {
  getWatchlist(): Promise<Watchlist[]>;
  addToWatchlist(item: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private items: Watchlist[] = [];
  private nextId = 1;

  async getWatchlist(): Promise<Watchlist[]> {
    return this.items;
  }

  async addToWatchlist(item: InsertWatchlist): Promise<Watchlist> {
    const entry: Watchlist = { id: this.nextId++, ...item };
    this.items.push(entry);
    return entry;
  }

  async removeFromWatchlist(id: number): Promise<void> {
    this.items = this.items.filter((i) => i.id !== id);
  }
}

export const storage = new MemStorage();
