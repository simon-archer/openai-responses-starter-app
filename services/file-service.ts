import { dbService } from "@/lib/indexeddb-service";
import { FileItem } from "@/components/context/files-context";

// Extended file item type - potentially move to a shared types file?
export interface ExtendedFileItem extends FileItem {
  isPlaceholder?: boolean;
  lastModified?: string; // Optional lastModified date for placeholders or fetched data
}

// Helper function to convert ArrayBuffer to base64
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Helper to determine MIME type from file extension
export const getMimeTypeFromExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'js':
      return 'application/javascript';
    case 'ts':
      return 'application/typescript';
    case 'jsx':
    case 'tsx':
      return 'application/typescript-react';
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'json':
      return 'application/json';
    case 'md':
      return 'text/markdown';
    case 'txt':
      return 'text/plain';
    case 'pdf':
      return 'application/pdf';
    default:
      // If filename ends with .pdf but wasn't caught by switch
      if (filename.toLowerCase().endsWith('.pdf')) {
        return 'application/pdf';
      }
      return 'text/plain';
  }
};

// Generate a unique ID
export const generateUniqueId = (): string => {
  if (typeof window !== 'undefined' && window.crypto) {
    return crypto.randomUUID();
  }
  // Fallback for server-side rendering
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Helper function to convert flat files list to a hierarchical structure
export const buildFileTree = (files: FileItem[]): FileItem[] => {
  const fileMap: { [key: string]: FileItem } = {};
  const rootItems: FileItem[] = [];

  // First pass: Create a mapping of id to file item
  files.forEach(file => {
    fileMap[file.id] = { ...file, children: file.type === 'folder' ? [] : undefined };
  });

  // Second pass: Build the hierarchy
  files.forEach(file => {
    if (file.parentId === null || file.parentId === undefined) {
      // This is a root item
      rootItems.push(fileMap[file.id]);
    } else if (fileMap[file.parentId]) {
      // This has a parent, add it to the parent's children
      if (!fileMap[file.parentId].children) {
        fileMap[file.parentId].children = [];
      }
      fileMap[file.parentId].children!.push(fileMap[file.id]);
    } else {
      // Parent not found, treat as root
      rootItems.push(fileMap[file.id]);
    }
  });

  return rootItems;
};

// Helper function to update a file in the tree
export const updateFileTree = (files: FileItem[], fileId: string, updater: (file: FileItem) => FileItem): FileItem[] => {
  return files.map(file => {
    if (file.id === fileId) {
      return updater(file);
    }
    if (file.type === 'folder' && file.children) {
      return {
        ...file,
        children: updateFileTree(file.children, fileId, updater)
      };
    }
    return file;
  });
};

// Find a file by ID in the file tree
export const findFileById = (fileId: string, fileList: FileItem[]): FileItem | null => {
  for (const file of fileList) {
    if (file.id === fileId) {
      return file;
    }
    if (file.type === 'folder' && file.children) {
      const found = findFileById(fileId, file.children);
      if (found) return found;
    }
  }
  return null;
};

// Main file service with all operations (focused on IndexedDB)
export const FileService = {
  // Initialize the database
  initDB: async (): Promise<void> => {
    await dbService.initDB();
  },

  // Get all files from IndexedDB
  getAllFiles: async (): Promise<FileItem[]> => {
    return await dbService.getAllFiles();
  },

  // Get a single file by ID from IndexedDB
  getFile: async (fileId: string): Promise<FileItem | null> => {
    return await dbService.getFile(fileId);
  },

  // Save or update a file in IndexedDB
  // Ensure this takes a single FileItem object
  saveFile: async (file: FileItem): Promise<void> => {
    // Add or derive path if needed before saving
    if (!file.path) {
      // Basic path derivation, might need refinement based on folder structure
      file.path = file.name; 
    }
    await dbService.saveFile(file);
  },

  // Update a file in IndexedDB
  updateFile: async (file: FileItem): Promise<void> => {
    await dbService.updateFile(file);
  },

  // Delete a file from IndexedDB
  deleteFile: async (fileId: string): Promise<void> => {
    await dbService.deleteFile(fileId);
  },

  // Load all files from IndexedDB and build the tree structure
  loadFileTree: async (): Promise<FileItem[]> => {
    try {
      // Get local files from IndexedDB ONLY
      const dbFiles = await dbService.getAllFiles();
      
      if (dbFiles && dbFiles.length > 0) {
        return buildFileTree(dbFiles);
      }
      return [];
    } catch (error) {
      console.error("[FileService] Error loading files:", error);
      return [];
    }
  },

  // Create a new folder in IndexedDB
  createFolder: async (name: string, parentId: string | null = null): Promise<FileItem> => {
    const folderId = generateUniqueId();
    
    const newFolder: FileItem = {
      id: folderId,
      name: name,
      type: "folder",
      path: name, // Basic path
      parentId: parentId,
      children: []
    };
    
    await dbService.saveFile(newFolder);
    return newFolder;
  },

  // Create a new file in IndexedDB from File object
  createFileFromUpload: async (file: File, parentId: string | null = null): Promise<FileItem> => {
    const arrayBuffer = await file.arrayBuffer();
    const base64Content = arrayBufferToBase64(arrayBuffer);
    
    const fileId = generateUniqueId();
    const newFile: FileItem = {
      id: fileId,
      name: file.name,
      path: file.name, // Basic path
      type: "file",
      mimeType: file.type || getMimeTypeFromExtension(file.name),
      content: base64Content,
      parentId: parentId
    };
    
    await FileService.saveFile(newFile); // Use the updated saveFile method
    return newFile;
  },

  // Clear vector store links from all files in IndexedDB
  clearVectorStoreLinks: async (): Promise<void> => {
    try {
      const localFiles = await dbService.getAllFiles();
      const updates = localFiles.map(file => {
        // Create a new object without the vector store properties
        const { vectorStoreId: vsId, vectorStoreFileId: vsfId, isVectorStoreFile: isVs, ...rest } = file;
        return dbService.updateFile({
          ...rest,
          vectorStoreId: undefined,
          vectorStoreFileId: undefined,
          isVectorStoreFile: undefined
        });
      });
      await Promise.all(updates);
      console.log("[FileService] Local files unlinked from vector store");
    } catch (error) {
      console.error("[FileService] Error clearing vector store links:", error);
      throw error;
    }
  }
};

export default FileService; 