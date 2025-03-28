"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Item } from "@/lib/assistant";
import ToolCallCard from "./tool-call-card";

interface MessageProps {
  message: Item;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  if (message.type === "tool_call") {
    return (
      <div className="flex mb-3">
        <div className="max-w-[85%]">
          <ToolCallCard
            type={message.tool_type}
            status={message.status}
            output={message.output || undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm">
      {message.role === "user" ? (
        <div className="flex justify-end mb-3">
          <div className="max-w-[85%]">
            <div className="rounded-lg px-4 py-2.5 bg-blue-50 text-gray-800 shadow-sm border border-blue-100">
              <div className="markdown-content">
                <ReactMarkdown
                  components={{
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    p: ({node: _node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    ul: ({node: _node, ...props}) => <ul className="mb-3 last:mb-0 pl-5" {...props} />,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    ol: ({node: _node, ...props}) => <ol className="mb-3 last:mb-0 pl-5" {...props} />,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    pre: ({node: _node, ...props}) => <pre className="mb-3 last:mb-0 p-2 bg-gray-100 overflow-x-auto rounded text-xs" {...props} />,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    code: ({node: _node, className, ...props}) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match && !className?.includes('language-');
                      return isInline 
                        ? <code className="bg-gray-100 px-1 py-0.5 rounded text-xs" {...props} />
                        : <code className="block" {...props} />;
                    }
                  }}
                >
                  {message.content[0].text as string}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex mb-3">
          <div className="max-w-[85%]">
            <div className="rounded-lg px-4 py-2.5 bg-white text-gray-800 shadow-sm border border-gray-200">
              <div className="markdown-content">
                <ReactMarkdown
                  components={{
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    p: ({node: _node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    ul: ({node: _node, ...props}) => <ul className="mb-3 last:mb-0 pl-5" {...props} />,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    ol: ({node: _node, ...props}) => <ol className="mb-3 last:mb-0 pl-5" {...props} />,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    pre: ({node: _node, ...props}) => <pre className="mb-3 last:mb-0 p-2 bg-gray-100 overflow-x-auto rounded text-xs" {...props} />,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    code: ({node: _node, className, ...props}) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match && !className?.includes('language-');
                      return isInline 
                        ? <code className="bg-gray-100 px-1 py-0.5 rounded text-xs" {...props} />
                        : <code className="block" {...props} />;
                    }
                  }}
                >
                  {message.content[0].text as string}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;
