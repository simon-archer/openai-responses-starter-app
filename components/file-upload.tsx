"use client";
import React, { useCallback, useState, FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { FilePlus2, Plus, Trash2, CircleX } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface FileUploadProps {
  vectorStoreId?: string;
  vectorStoreName?: string;
  onAddStore: (id: string) => void;
  onUnlinkStore: () => void;
}

export default function FileUpload({
  vectorStoreId,
  onAddStore,
  onUnlinkStore,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [newStoreName, setNewStoreName] = useState<string>("Default store");
  const [uploading, setUploading] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const acceptedFileTypes = {
    "text/x-c": [".c"],
    "text/x-c++": [".cpp"],
    "text/x-csharp": [".cs"],
    "text/css": [".css"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "text/x-golang": [".go"],
    "text/html": [".html"],
    "text/x-java": [".java"],
    "text/javascript": [".js"],
    "application/json": [".json"],
    "text/markdown": [".md"],
    "application/pdf": [".pdf"],
    "text/x-php": [".php"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      [".pptx"],
    "text/x-python": [".py"],
    "text/x-script.python": [".py"],
    "text/x-ruby": [".rb"],
    "application/x-sh": [".sh"],
    "text/x-tex": [".tex"],
    "application/typescript": [".ts"],
    "text/plain": [".txt"],
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: acceptedFileTypes,
  });

  const removeFile = () => {
    setFile(null);
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }
    setUploading(true);

    let fileId = "";
    let finalVectorStoreId = vectorStoreId; // Start with the potentially existing store ID

    try {
      // --- Step 1: Upload the file ---
      console.log("Step 1: Uploading file...");
      const arrayBuffer = await file.arrayBuffer();
      const base64Content = arrayBufferToBase64(arrayBuffer);
      const fileObject = {
        name: file.name,
        content: base64Content, // Sending base64 content
      };

      // Assume this endpoint uploads the file to OpenAI /files and returns { id: "file-xxx..." }
      const uploadResponse = await fetch("/api/files/upload", { // <-- UPDATED ENDPOINT
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileObject }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({})); // Try to get error details
        console.error("Upload failed:", uploadResponse.status, errorData);
        throw new Error(`Error uploading file: ${uploadResponse.statusText} ${JSON.stringify(errorData)}`);
      }

      const uploadData = await uploadResponse.json();
      fileId = uploadData.id;
      if (!fileId) {
        throw new Error("File ID not received after upload.");
      }
      console.log("Step 1 Complete: File Uploaded. File ID:", fileId);


      // --- Step 2: Ensure Vector Store Exists ---
      console.log("Step 2: Checking Vector Store...");
      if (!finalVectorStoreId || finalVectorStoreId === "") {
        console.log("No vector store linked, creating a new one...");
        // Assume this endpoint creates a store via OpenAI /vector_stores and returns { id: "vs_yyy..." }
        const createResponse = await fetch("/api/vector_stores/create_store", { // <-- SAME AS BEFORE (for creation)
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeName: newStoreName,
          }),
        });
        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          console.error("Store creation failed:", createResponse.status, errorData);
          throw new Error(`Error creating vector store: ${createResponse.statusText} ${JSON.stringify(errorData)}`);
        }
        const createData = await createResponse.json();
        finalVectorStoreId = createData.id;
        if (!finalVectorStoreId) {
          throw new Error("Vector Store ID not received after creation.");
        }
        console.log("Step 2 Complete: New Vector Store Created. Store ID:", finalVectorStoreId);
        // Update the parent component's state immediately after creation
        onAddStore(finalVectorStoreId);
      } else {
        console.log("Step 2 Complete: Using existing Vector Store. Store ID:", finalVectorStoreId);
        // If using an existing store ID passed via props, we might not need to call onAddStore again,
        // unless the intention is to confirm/refresh the state. Let's assume it's not needed here.
      }


      // --- Step 3: Associate File with Vector Store ---
      console.log("Step 3: Associating file with vector store...");
      if (!finalVectorStoreId) {
        // This should theoretically not happen due to checks above, but safeguard anyway.
        throw new Error("Cannot associate file, Vector Store ID is missing.");
      }

      // Assume this endpoint associates the file via OpenAI /vector_stores/{vs_id}/files and returns the association object
      const associateResponse = await fetch("/api/vector_stores/associate_file", { // <-- UPDATED ENDPOINT
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: fileId, // The ID from Step 1
          vectorStoreId: finalVectorStoreId, // The ID from Step 2
        }),
      });

      if (!associateResponse.ok) {
         const errorData = await associateResponse.json().catch(() => ({}));
         console.error("Association failed:", associateResponse.status, errorData);
        // Note: Even if association fails, the file is uploaded and the store might exist.
        // Depending on desired behavior, you might want to attempt cleanup or just report the error.
        throw new Error(`Error associating file with vector store: ${associateResponse.statusText} ${JSON.stringify(errorData)}`);
      }

      const associationData = await associateResponse.json();
      console.log("Step 3 Complete: File associated with vector store:", associationData);

      // --- Cleanup ---
      setFile(null); // Clear the selected file
      setDialogOpen(false); // Close the dialog

    } catch (error) {
      console.error("Error during file processing:", error);
      // Provide more specific feedback if possible
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      alert(`There was an error processing your file: ${message}`);
      // Decide if you want to clear the file on error or let the user retry
      // setFile(null);
    } finally {
      setUploading(false); // Ensure loading state is reset
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <div className="bg-white rounded-full flex items-center justify-center py-1 px-3 border border-zinc-200 gap-1 font-medium text-sm cursor-pointer hover:bg-zinc-50 transition-all">
          <Plus size={16} />
          Upload
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] md:max-w-[600px] max-h-[80vh] overflow-y-scrollfrtdtd">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add files to your vector store</DialogTitle>
          </DialogHeader>
          <div className="my-6">
            {!vectorStoreId || vectorStoreId === "" ? (
              <div className="flex items-start gap-2 text-sm">
                <label className="font-medium w-72" htmlFor="storeName">
                  New vector store name
                  <div className="text-xs text-zinc-400">
                    A new store will be created when you upload a file.
                  </div>
                </label>
                <Input
                  id="storeName"
                  type="text"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="border rounded p-2"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="text-sm font-medium w-24 text-nowrap">
                    Vector store
                  </div>
                  <div className="text-zinc-400  text-xs font-mono flex-1 text-ellipsis truncate">
                    {vectorStoreId}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CircleX
                          onClick={() => onUnlinkStore()}
                          size={16}
                          className="cursor-pointer text-zinc-400 mb-0.5 shrink-0 mt-0.5 hover:text-zinc-700 transition-all"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Unlink vector store</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-center items-center mb-4 h-[200px]">
            {file ? (
              <div className="flex flex-col items-start">
                <div className="text-zinc-400">Loaded file</div>
                <div className="flex items-center mt-2">
                  <div className="text-zinc-900 mr-2">{file.name}</div>

                  <Trash2
                    onClick={removeFile}
                    size={16}
                    className="cursor-pointer text-zinc-900"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div
                  {...getRootProps()}
                  className="p-6 flex items-center justify-center relative focus-visible:outline-0"
                >
                  <input {...getInputProps()} />
                  <div
                    className={`absolute rounded-full transition-all duration-300 ${
                      isDragActive
                        ? "h-56 w-56 bg-zinc-100"
                        : "h-0 w-0 bg-transparent"
                    }`}
                  ></div>
                  <div className="flex flex-col items-center text-center z-10 cursor-pointer">
                    <FilePlus2 className="mb-4 size-8 text-zinc-700" />
                    <div className="text-zinc-700">Upload a file</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
