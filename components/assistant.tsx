"use client";
import React, { useEffect } from "react";
import Chat from "./chat";
import useConversationStore from "@/stores/useConversationStore";
import { Item, MessageItem, processMessages } from "@/lib/assistant";
import { saveMessage } from "@/lib/conversation-service";
import { INITIAL_MESSAGE } from "@/config/constants";

interface AssistantProps {
  conversationId?: string;
}

export default function Assistant({ conversationId }: AssistantProps) {
  const { chatMessages, addConversationItem, addChatMessage, setChatMessages } =
    useConversationStore();
    
  // Initialize with welcome message if no messages and no conversation loaded
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

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

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
      
      // Process the message with OpenAI
      const assistantResponse = await processMessages();
      
      // Save assistant response to database if we have a conversation ID
      if (conversationId && assistantResponse) {
        const lastMessage = chatMessages[chatMessages.length - 1];
        // Check if the message is a MessageItem type (not a ToolCallItem) before accessing role
        if (lastMessage && lastMessage.type === "message" && (lastMessage as MessageItem).role === "assistant") {
          await saveMessage(
            conversationId,
            "assistant",
            JSON.stringify(lastMessage.content)
          );
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <Chat items={chatMessages} onSendMessage={handleSendMessage} />
    </div>
  );
}
