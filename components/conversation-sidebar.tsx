"use client";
import React from "react";
import { Button } from "./ui/button";
import { PlusCircle } from "lucide-react";
import { useConversations } from "./context/conversations-context";

export default function ConversationSidebar() {
  const {
    conversations,
    isLoading,
    currentConversationId,
    onSelectConversation,
    onNewConversation
  } = useConversations();

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="flex-1 overflow-y-auto p-3 h-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-20">
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex justify-center items-center h-20">
            <p className="text-sm text-gray-500">No conversations yet</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    currentConversationId === conversation.id
                      ? "bg-black text-white"
                      : "hover:bg-gray-200"
                  }`}
                >
                  {conversation.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-3 border-t border-stone-100">
        <Button
          onClick={onNewConversation}
          variant="outline"
          size="sm"
          className="flex w-full items-center justify-center gap-1"
        >
          <PlusCircle size={16} />
          New Conversation
        </Button>
      </div>
    </div>
  );
}