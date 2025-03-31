import OpenAI from "openai";

const openai = new OpenAI();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vectorStoreId = searchParams.get("vector_store_id");

  console.log("[list_files] Request received for vector store:", vectorStoreId);

  if (!vectorStoreId) {
    console.log("[list_files] Error: No vector store ID provided");
    return new Response(JSON.stringify({ 
      error: "Vector store ID is required" 
    }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    console.log("[list_files] Fetching files for vector store:", vectorStoreId);
    const vectorStoreFiles = await openai.vectorStores.files.list(vectorStoreId);
    console.log("[list_files] Raw vector store files response:", JSON.stringify(vectorStoreFiles, null, 2));

    if (!vectorStoreFiles.data || vectorStoreFiles.data.length === 0) {
      console.log("[list_files] No files found in vector store");
      return new Response(JSON.stringify([]), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // For each file in the vector store, get its details
    console.log("[list_files] Fetching details for", vectorStoreFiles.data.length, "files");
    const fileDetailsPromises = vectorStoreFiles.data.map(async (vsFile) => {
      try {
        console.log("[list_files] Fetching details for file:", vsFile.id);
        // Get the file details from OpenAI
        const fileDetails = await openai.files.retrieve(vsFile.id);
        console.log("[list_files] File details received:", JSON.stringify(fileDetails, null, 2));
        
        return {
          id: fileDetails.id,
          name: fileDetails.filename,
          type: "file",
          mimeType: fileDetails.purpose === "assistants" ? "application/json" : "text/plain",
          status: vsFile.status,
          created_at: fileDetails.created_at,
          bytes: fileDetails.bytes,
          isVectorStoreFile: true
        };
      } catch (error) {
        console.error(`[list_files] Error fetching details for file ${vsFile.id}:`, error);
        return null;
      }
    });

    const fileDetails = (await Promise.all(fileDetailsPromises)).filter(file => file !== null);
    console.log("[list_files] Final processed file details:", JSON.stringify(fileDetails, null, 2));
    
    return new Response(JSON.stringify(fileDetails), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[list_files] Error listing vector store files:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
