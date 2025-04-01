import FileService, { ExtendedFileItem, getMimeTypeFromExtension, buildFileTree } from "./file-service";
import type { FileItem } from "@/components/context/files-context";

// Vector store service to handle all vector store operations
export const VectorStoreService = {
  // Fetch a vector store by ID
  getStore: async (storeId: string): Promise<any> => {
    try {
      // Log the received storeId and its type right before the fetch call
      console.log('[VectorStoreService.getStore] Attempting to fetch with storeId:', storeId, 'Type:', typeof storeId);
      
      // Basic validation to prevent sending "[object Object]"
      if (typeof storeId !== 'string' || !storeId.startsWith('vs_')) {
        console.error('[VectorStoreService.getStore] Invalid storeId received:', storeId);
        throw new Error(`Invalid vector store ID format: ${storeId}`);
      }

      const response = await fetch(
        `/api/vector_stores/retrieve_store?vector_store_id=${storeId}`
      );
      
      if (!response.ok) {
        // Throw an error that includes the response status text for more context
        throw new Error(`Failed to retrieve vector store: ${response.statusText} (Status: ${response.status})`);
      }
      
      const store = await response.json();
      console.log("[VectorStoreService] Retrieved store:", store);
      return store;
    } catch (error) {
      console.error("[VectorStoreService] Error retrieving vector store:", error);
      throw error; // Re-throw the error to be caught by the caller
    }
  },
  
  // List files in a vector store
  listFiles: async (vectorStoreId: string): Promise<any[]> => {
    try {
      const response = await fetch(`/api/vector_stores/list_files?vector_store_id=${vectorStoreId}`);
      if (!response.ok) {
        throw new Error(`Failed to list vector store files: ${response.statusText} (Status: ${response.status})`);
      }
      const files = await response.json();
      console.log("[VectorStoreService] Vector store files:", files);
      return files;
    } catch (error) {
      console.error("[VectorStoreService] Error listing vector store files:", error);
      throw error;
    }
  },
  
  // Upload a file to OpenAI and associate it with a vector store
  uploadFile: async (fileObject: { name: string, content: string }, vectorStoreId: string): Promise<string> => {
    try {
      // Step 1: Upload file to OpenAI
      const uploadResponse = await fetch("/api/files/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileObject })
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to OpenAI');
      }

      const { id: openAiFileId } = await uploadResponse.json();
      console.log("[VectorStoreService] File uploaded to OpenAI:", openAiFileId);

      // Step 2: Associate with vector store
      const associateResponse = await fetch("/api/vector_stores/associate_file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: openAiFileId,
          vectorStoreId
        })
      });

      if (!associateResponse.ok) {
        throw new Error('Failed to associate with vector store');
      }
      
      console.log("[VectorStoreService] File associated with vector store:", vectorStoreId);
      return openAiFileId;
    } catch (error) {
      console.error("[VectorStoreService] Error uploading file to vector store:", error);
      throw error;
    }
  },
  
  // Link a local file (from IndexedDB) to the vector store
  linkFile: async (file: FileItem, vectorStoreId: string): Promise<FileItem> => {
    try {
      if (!file.content) {
        throw new Error("File has no content");
      }
      
      // Upload to OpenAI and associate with vector store
      const openAiFileId = await VectorStoreService.uploadFile(
        { name: file.name, content: file.content },
        vectorStoreId
      );
      
      // Update local file with vector store info
      const updatedFile = {
        ...file,
        vectorStoreId,
        vectorStoreFileId: openAiFileId,
        isVectorStoreFile: true
      };
      
      // Save updated file
      await FileService.updateFile(updatedFile);
      console.log("[VectorStoreService] Local file linked to vector store:", file.name);
      
      return updatedFile;
    } catch (error) {
      console.error("[VectorStoreService] Error linking file to vector store:", error);
      throw error;
    }
  },
  
  // Unlink a file from vector store (updates local file)
  unlinkFile: async (file: FileItem): Promise<FileItem> => {
    try {
      if (!file.vectorStoreFileId) {
        console.warn("[VectorStoreService] File is not linked to vector store:", file.id);
        return file;
      }
      
      // Call API to unlink
      const response = await fetch("/api/files/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.vectorStoreFileId })
      });

      if (!response.ok) {
        throw new Error('Failed to unlink from vector store');
      }

      // Update local file to remove vector store info
      const updatedFile = {
        ...file,
        vectorStoreId: undefined,
        vectorStoreFileId: undefined,
        isVectorStoreFile: undefined
      };
      
      // Save updated file
      await FileService.updateFile(updatedFile);
      console.log("[VectorStoreService] File unlinked from vector store:", file.name);
      
      return updatedFile;
    } catch (error) {
      console.error("[VectorStoreService] Error unlinking file from vector store:", error);
      throw error;
    }
  },
  
  // Delete a file from vector store (does NOT affect local file)
  deleteFile: async (vectorStoreFileId: string): Promise<void> => {
    try {
      console.log("[VectorStoreService] Attempting to delete file from vector store:", vectorStoreFileId);
      const response = await fetch("/api/files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: vectorStoreFileId })
      });
      
      if (response.status === 404) {
        console.log("[VectorStoreService] File not found in vector store (already deleted?):", vectorStoreFileId);
        return; 
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[VectorStoreService] Failed to delete file from vector store:", response.status, errorData);
        throw new Error(`Failed to delete file from vector store: ${response.statusText} (Status: ${response.status})`);
      }
      
      console.log("[VectorStoreService] File successfully deleted from vector store:", vectorStoreFileId);
    } catch (error) {
      console.error("[VectorStoreService] Error deleting file from vector store:", error);
      // Don't re-throw, allow caller (e.g., FilesPanel) to decide how to proceed
      // throw error;
    }
  },
  
  // Sync logic is now handled within VectorStoreContext
  // remove the old syncFiles method if it exists
  /* 
  syncFiles: async (vectorStoreId: string): Promise<void> => { ... old implementation ... } 
  */
};

export default VectorStoreService; 