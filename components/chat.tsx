"use client";

import React, { useEffect, useRef, useState } from "react";
import ToolCall from "./tool-call";
import Message from "./message";
import Annotations from "./annotations";
import { Item } from "@/lib/assistant";

interface ChatProps {
  items: Item[];
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
}

const Chat: React.FC<ChatProps> = ({ items, onSendMessage, isProcessing = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    // Log message updates for debugging
    console.debug("Chat items updated:", {
      itemCount: items.length,
      lastItemType: items.length > 0 ? items[items.length - 1]?.type : 'none'
    });
  }, [items]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      console.debug("Sending message:", inputMessage.trim());
      onSendMessage(inputMessage);
      setInputMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Calculate state for debugging & UI indicators
  const isToolProcessing = items.some(item => 
    item.type === "tool_call" && 
    (item.status === "in_progress" || item.status === "searching")
  );
  const isCurrentlyProcessing = isProcessing || isToolProcessing;

  return (
    <div className="flex flex-col h-full w-full max-h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 min-h-0 bg-gray-50">
        <div className="max-w-3xl mx-auto py-4 space-y-2">
          {items.map((item, index) => (
            <div key={index} className="message-container">               
              {item.type === "tool_call" ? (
                <ToolCall toolCall={item} />
              ) : item.type === "message" && item.content?.[0] ? (
                <div className="space-y-1">
                  <Message message={item} />
                  {item.content[0].annotations && item.content[0].annotations.length > 0 && (
                    <Annotations annotations={item.content[0].annotations} />
                  )}
                </div>
              ) : null}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-stone-100 bg-white p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex w-full items-center">
            <div className="flex w-full flex-col border border-gray-200 shadow-sm hover:border-gray-300 focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-200">
              <div className="flex items-end">
                <textarea
                  rows={1}
                  placeholder={isCurrentlyProcessing ? "Assistant is processing..." : "Message..."}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  className="flex-1 resize-none border-0 bg-transparent p-2 pl-3 focus:outline-none focus:ring-0 text-sm"
                  disabled={isCurrentlyProcessing}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isCurrentlyProcessing}
                  className="flex h-8 w-8 items-center justify-center bg-blue-600 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 active:bg-blue-800 disabled:bg-gray-200 disabled:hover:opacity-100 disabled:cursor-not-allowed"
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M22 2L11 13" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                    <path 
                      d="M22 2L15 22L11 13L2 9L22 2Z" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
