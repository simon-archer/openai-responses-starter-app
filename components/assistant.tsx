"use client";
import React, { useEffect, useState } from "react";
import Chat from "./chat";
import useConversationStore from "@/stores/useConversationStore";
import { Item, processMessages } from "@/lib/assistant";
import { saveMessage } from "@/lib/conversation-service";
import { INITIAL_MESSAGE } from "@/config/constants";
import { AlertCircle } from "lucide-react";

interface AssistantProps {
  conversationId?: string;
}

export default function Assistant({ conversationId }: AssistantProps) {
  const { chatMessages, addConversationItem, addChatMessage, setChatMessages } =
    useConversationStore();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
    
  // Initialize with welcome message if no messages
  useEffect(() => {
    if (chatMessages.length === 0) {
      const initialMessage: Item = {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: INITIAL_MESSAGE }],
      };
      setChatMessages([initialMessage]);
    }
  }, [chatMessages.length, setChatMessages]);

  // Log backend responses and tool calls
  useEffect(() => {
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (lastMessage) {
      if (lastMessage.type === "tool_call") {
        console.log("[Backend Tool Call]", {
          status: lastMessage.status,
          tool: lastMessage.tool_type,
          name: lastMessage.name,
          output: lastMessage.output ? JSON.parse(lastMessage.output) : null
        });
      }
    }
  }, [chatMessages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    setError(null);
    setProcessing(true);

    const userItem: Item = {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: message.trim() }],
    };
    const userMessage: any = {
      role: "user",
      content: message.trim(),
    };

    try {
      // Add message to UI
      addConversationItem(userMessage);
      addChatMessage(userItem);
      
      // Save message to database if we have a conversation ID
      if (conversationId) {
        await saveMessage(
          conversationId,
          "user",
          JSON.stringify(userItem.content)
        );
      }
      
      // Process the message and log backend response
      console.log("[Backend Request]", {
        messages: chatMessages.map(msg => ({
          type: msg.type,
          role: msg.type === "message" ? msg.role : "system",
          content: msg.type === "message" ? 
            msg.content[0].text : 
            `[Tool Call: ${msg.tool_type}]`
        }))
      });
      
      let assistantResponse = null;
      try {
        assistantResponse = await processMessages();
        console.log("[Backend Response]", {
          response: assistantResponse,
          newMessages: chatMessages.slice(-5)
        });
      } catch (processingError) {
        // Handle errors specifically from processMessages
        console.error("[Processing Error]", processingError);
        setError(processingError instanceof Error ? processingError.message : "Failed to get assistant response");
        // Don't proceed to save assistant response if processing failed
        return; 
      }
      
      // Save assistant response if we have a conversation ID and processing was successful
      if (conversationId && assistantResponse) {
        // Ensure we have the latest messages before saving
        const currentChatMessages = useConversationStore.getState().chatMessages;
        const lastMessage = currentChatMessages[currentChatMessages.length - 1];
        if (lastMessage && lastMessage.type === "message" && lastMessage.role === "assistant") {
          await saveMessage(
            conversationId,
            "assistant",
            JSON.stringify(lastMessage.content)
          );
        }
      }
    } catch (error) {
      // Catch any other errors (e.g., saving user message)
      console.error("[General Error]", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 mx-4 my-2 rounded text-red-700 text-sm flex items-center">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          <div>Error: {error}</div>
        </div>
      )}
      <Chat 
        items={chatMessages} 
        onSendMessage={handleSendMessage} 
        isProcessing={processing}
      />
    </div>
  );
}
