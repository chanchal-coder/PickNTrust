// Minimal Category Manager stub
import { sqliteDb } from './db.js';

export const categoryManager = {
  async getAllCategories() {
    try {
      const rows = sqliteDb.prepare('SELECT * FROM categories').all();
      return rows || [];
    } catch (err) {
      console.warn('[categoryManager] Failed to load categories:', err);
      return [];
    }
  }
};

export default { categoryManager };