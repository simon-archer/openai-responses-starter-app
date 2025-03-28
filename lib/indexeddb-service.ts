import { FileItem } from "@/components/context/files-context";

const DB_NAME = "filesdb";
const DB_VERSION = 1;
const FILES_STORE = "files";

interface IDBService {
  initDB: () => Promise<boolean>;
  getAllFiles: () => Promise<FileItem[]>;
  saveFile: (file: FileItem) => Promise<string>;
  updateFile: (file: FileItem) => Promise<boolean>;
  deleteFile: (id: string) => Promise<boolean>;
}

class IndexedDBService implements IDBService {
  private db: IDBDatabase | null = null;
  
  initDB = async (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => {
        console.error("Failed to open database");
        reject(false);
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log("Database opened successfully");
        resolve(true);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create an object store for files if it doesn't exist
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          const store = db.createObjectStore(FILES_STORE, { keyPath: "id" });
          store.createIndex("name", "name", { unique: false });
          store.createIndex("type", "type", { unique: false });
          console.log("Object store created");
        }
      };
    });
  };
  
  getAllFiles = async (): Promise<FileItem[]> => {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }
      
      const transaction = this.db.transaction(FILES_STORE, "readonly");
      const store = transaction.objectStore(FILES_STORE);
      const request = store.getAll();
      
      request.onerror = () => {
        reject("Error fetching files");
      };
      
      request.onsuccess = () => {
        resolve(request.result as FileItem[]);
      };
    });
  };
  
  saveFile = async (file: FileItem): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }
      
      const transaction = this.db.transaction(FILES_STORE, "readwrite");
      const store = transaction.objectStore(FILES_STORE);
      
      // Make sure file has an ID
      if (!file.id) {
        file.id = crypto.randomUUID();
      }
      
      const request = store.add(file);
      
      request.onerror = () => {
        reject("Error saving file");
      };
      
      request.onsuccess = () => {
        resolve(file.id);
      };
    });
  };
  
  updateFile = async (file: FileItem): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }
      
      const transaction = this.db.transaction(FILES_STORE, "readwrite");
      const store = transaction.objectStore(FILES_STORE);
      const request = store.put(file);
      
      request.onerror = () => {
        reject(false);
      };
      
      request.onsuccess = () => {
        resolve(true);
      };
    });
  };
  
  deleteFile = async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }
      
      const transaction = this.db.transaction(FILES_STORE, "readwrite");
      const store = transaction.objectStore(FILES_STORE);
      const request = store.delete(id);
      
      request.onerror = () => {
        reject(false);
      };
      
      request.onsuccess = () => {
        resolve(true);
      };
    });
  };
}

const dbService = new IndexedDBService();
export default dbService; 