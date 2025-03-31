import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: Request) {
  const { storeName } = await request.json();
  try {
    const vectorStore = await openai.vectorStores.create({
      name: storeName || "Default Store",
    });
    return new Response(JSON.stringify(vectorStore), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating vector store:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
