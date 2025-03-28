"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

// Sample data structure for conversations
export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

interface ConversationsContextType {
  conversations: Conversation[];
  isLoading: boolean;
  currentConversationId?: string;
  setCurrentConversationId: (id?: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

export const useConversations = () => {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error("useConversations must be used within a ConversationsProvider");
  }
  return context;
};

export const ConversationsProvider = ({ children }: { children: ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Simulate loading conversations
    setTimeout(() => {
      setConversations([
        { 
          id: "1", 
          title: "Chat about React", 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { 
          id: "2", 
          title: "Next.js Project", 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { 
          id: "3", 
          title: "Debugging Session", 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const onSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // Additional logic could be added here
    console.log("Selected conversation:", conversationId);
  };

  const onNewConversation = () => {
    // In a real app we'd create a new conversation and add it to the list
    const newId = `new-${Date.now()}`;
    const newConversation = {
      id: newId,
      title: "New Conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newId);
    console.log("Created new conversation");
  };

  return (
    <ConversationsContext.Provider
      value={{
        conversations,
        isLoading,
        currentConversationId,
        setCurrentConversationId,
        onSelectConversation,
        onNewConversation
      }}
    >
      {children}
    </ConversationsContext.Provider>
  );
}; 