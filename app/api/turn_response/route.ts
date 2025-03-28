import { MODEL } from "@/config/constants";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { messages, tools } = await request.json();
    console.log("Received messages:", messages);
    console.log("Available tools:", tools.map((t: any) => t.name));

    const openai = new OpenAI();

    const events = await openai.responses.create({
      model: MODEL,
      input: messages,
      tools,
      stream: true,
      parallel_tool_calls: false,
    });

    // Create a ReadableStream that emits SSE data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events) {
            // Log different types of events
            switch (event.type) {
              case "response.output_text.delta":
                console.log("[Assistant Response]", event.delta);
                break;
              case "response.function_call_arguments.delta":
                console.log("[Tool Call Args]", {
                  args: event.delta
                });
                break;
              case "response.function_call_arguments.done":
                console.log("[Tool Call Complete]", {
                  args: event.arguments
                });
                break;
              case "response.web_search_call.completed":
                console.log("[Web Search Complete]", event);
                break;
              case "response.file_search_call.completed":
                console.log("[File Search Complete]", event);
                break;
            }

            // Sending all events to the client
            const data = JSON.stringify({
              event: event.type,
              data: event,
            });
            controller.enqueue(`data: ${data}\n\n`);
          }
          // End of stream
          controller.close();
        } catch (error) {
          console.error("Error in streaming loop:", error);
          controller.error(error);
        }
      },
    });

    // Return the ReadableStream as SSE
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
