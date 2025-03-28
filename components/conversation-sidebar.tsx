"use client";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { PlusCircle } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationSidebarProps {
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  currentConversationId?: string;
}

export default function ConversationSidebar({
  onSelectConversation,
  onNewConversation,
  currentConversationId,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/conversations");
        if (!response.ok) {
          throw new Error("Failed to fetch conversations");
        }
        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-stone-100">
        <h2 className="text-lg font-medium">Conversations</h2>
        <Button
          onClick={onNewConversation}
          variant="ghost"
          size="sm"
          className="flex items-center gap-1"
        >
          <PlusCircle size={16} />
          New
        </Button>
      </div>

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
    </div>
  );
}