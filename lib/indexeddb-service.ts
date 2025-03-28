import { FileItem } from "@/components/context/files-context";

const DB_NAME = 'editor-files-db';
const DB_VERSION = 1;
const STORE_NAME = 'files';

export interface IDBService {
  initDB(): Promise<boolean>;
  getAllFiles(): Promise<FileItem[]>;
  saveFile(file: FileItem): Promise<FileItem>;
  updateFile(file: FileItem): Promise<FileItem>;
  deleteFile(id: string): Promise<boolean>;
}

// Check if code is running in browser environment
const isBrowser = typeof window !== 'undefined' && window.indexedDB;

class IndexedDBService implements IDBService {
  private db: IDBDatabase | null = null;

  constructor() {
    if (isBrowser) {
      this.initDB();
    }
  }

  initDB(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Return early if not in browser
      if (!isBrowser) {
        console.log('IndexedDB not available (server-side rendering)');
        resolve(false);
        return;
      }

      if (this.db) {
        resolve(true);
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event);
        reject(false);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  getAllFiles(): Promise<FileItem[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // Return empty array if not in browser
        if (!isBrowser) {
          resolve([]);
          return;
        }

        await this.initDB();
        
        if (!this.db) {
          reject('Database not initialized');
          return;
        }

        const transaction = this.db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (event) => {
          console.error('Error getting all files:', event);
          reject('Failed to get files');
        };
      } catch (error) {
        console.error('Error in getAllFiles:', error);
        reject(error);
      }
    });
  }

  saveFile(file: FileItem): Promise<FileItem> {
    return new Promise(async (resolve, reject) => {
      try {
        // Return the file if not in browser (mock successful save)
        if (!isBrowser) {
          resolve(file);
          return;
        }

        await this.initDB();
        
        if (!this.db) {
          reject('Database not initialized');
          return;
        }

        // Ensure the file has an ID
        const fileToSave = { ...file };
        if (!fileToSave.id) {
          fileToSave.id = generateUniqueId();
        }

        const transaction = this.db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(fileToSave);

        request.onsuccess = () => {
          resolve(fileToSave);
        };

        request.onerror = (event) => {
          console.error('Error saving file:', event);
          reject('Failed to save file');
        };
      } catch (error) {
        console.error('Error in saveFile:', error);
        reject(error);
      }
    });
  }

  updateFile(file: FileItem): Promise<FileItem> {
    return new Promise(async (resolve, reject) => {
      try {
        // Return the file if not in browser (mock successful update)
        if (!isBrowser) {
          resolve(file);
          return;
        }

        await this.initDB();
        
        if (!this.db) {
          reject('Database not initialized');
          return;
        }

        const transaction = this.db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(file);

        request.onsuccess = () => {
          resolve(file);
        };

        request.onerror = (event) => {
          console.error('Error updating file:', event);
          reject('Failed to update file');
        };
      } catch (error) {
        console.error('Error in updateFile:', error);
        reject(error);
      }
    });
  }

  deleteFile(id: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        // Return true if not in browser (mock successful delete)
        if (!isBrowser) {
          resolve(true);
          return;
        }

        await this.initDB();
        
        if (!this.db) {
          reject('Database not initialized');
          return;
        }

        const transaction = this.db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = (event) => {
          console.error('Error deleting file:', event);
          reject('Failed to delete file');
        };
      } catch (error) {
        console.error('Error in deleteFile:', error);
        reject(error);
      }
    });
  }
}

// Generate a unique ID that works in both browser and server environments
const generateUniqueId = () => {
  if (isBrowser && window.crypto) {
    return crypto.randomUUID();
  }
  // Fallback for server-side rendering
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const dbService = new IndexedDBService(); 