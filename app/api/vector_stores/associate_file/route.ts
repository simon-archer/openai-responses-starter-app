import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
  const { vectorStoreId, fileId } = await request.json();
  
  if (!vectorStoreId || !fileId) {
    return new Response(JSON.stringify({ 
      error: "Both vectorStoreId and fileId are required" 
    }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const association = await openai.vectorStores.files.create(
      vectorStoreId,
      {
        file_id: fileId,
      }
    );
    
    return new Response(JSON.stringify(association), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error associating file with vector store:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
} 