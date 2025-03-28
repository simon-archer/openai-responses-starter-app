import React, { useEffect } from "react";

import { ToolCallItem } from "@/lib/assistant";
import { BookOpenText, Clock, Globe, Zap } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ToolCallProps {
  toolCall: ToolCallItem;
}

function ApiCallCell({ toolCall }: ToolCallProps) {
  useEffect(() => {
    console.debug(`Function call ${toolCall.status}:`, {
      name: toolCall.name,
      id: toolCall.id,
      args: toolCall.parsedArguments,
      hasOutput: !!toolCall.output
    });
  }, [toolCall]);

  return (
    <div className="flex flex-col w-[85%] relative mb-2">
      <div>
        <div className="flex flex-col text-sm">
          <div className="font-medium p-2 text-gray-700 flex gap-2 items-center">
            <div className="flex gap-2 items-center text-blue-600">
              <div className="bg-blue-100 p-1.5 rounded-full">
                <Zap size={14} />
              </div>
              <div className="text-sm">
                {toolCall.status === "completed"
                  ? `Called ${toolCall.name}`
                  : `Calling ${toolCall.name}...`}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl py-2 border border-gray-200 shadow-sm">
            <div className="max-h-96 overflow-y-auto text-xs border-b border-gray-100 mx-4 p-2">
              <SyntaxHighlighter
                customStyle={{
                  backgroundColor: "transparent",
                  padding: "8px",
                  paddingLeft: "4px",
                  marginTop: 0,
                  marginBottom: 0,
                  borderRadius: "8px",
                }}
                language="json"
                style={coy}
              >
                {JSON.stringify(toolCall.parsedArguments, null, 2)}
              </SyntaxHighlighter>
            </div>
            <div className="max-h-96 overflow-y-auto mx-4 p-2 text-xs">
              {toolCall.output ? (
                <SyntaxHighlighter
                  customStyle={{
                    backgroundColor: "transparent",
                    padding: "8px",
                    paddingLeft: "4px",
                    marginTop: 0,
                    borderRadius: "8px",
                  }}
                  language="json"
                  style={coy}
                >
                  {JSON.stringify(JSON.parse(toolCall.output), null, 2)}
                </SyntaxHighlighter>
              ) : (
                <div className="text-gray-500 flex items-center gap-2 py-2 px-2">
                  <Clock size={16} /> Waiting for result...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileSearchCell({ toolCall }: ToolCallProps) {
  useEffect(() => {
    console.debug(`File search ${toolCall.status}:`, {
      id: toolCall.id,
      hasOutput: !!toolCall.output,
      resultCount: toolCall.output ? JSON.parse(toolCall.output).length : 0
    });
  }, [toolCall]);

  return (
    <div className="w-full mb-3 pl-1">
      <div className="flex items-center text-xs text-gray-500 mb-1">
        <BookOpenText size={14} className="mr-1.5" />
        {toolCall.status === "completed" ? "Files" : "Searching files..."}
      </div>
      
      {toolCall.output && (
        <div className="pl-1">
          {typeof toolCall.output === 'string' && 
            JSON.parse(toolCall.output).map((item: any, idx: number) => (
              <div key={idx} className="mb-2 last:mb-0">
                <div className="text-xs font-medium text-gray-600 mb-0.5">{item.filename || 'File'}</div>
                {item.snippet && (
                  <div className="bg-gray-50 border-l-2 border-gray-200 pl-2 py-1 text-xs text-gray-700 font-mono overflow-x-auto">
                    {item.snippet}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function WebSearchCell({ toolCall }: ToolCallProps) {
  useEffect(() => {
    console.debug(`Web search ${toolCall.status}:`, {
      id: toolCall.id,
      hasOutput: !!toolCall.output,
      resultCount: toolCall.output ? JSON.parse(toolCall.output).length : 0
    });
  }, [toolCall]);

  return (
    <div className="w-full mb-3 pl-1">
      <div className="flex items-center text-xs text-gray-500 mb-1">
        <Globe size={14} className="mr-1.5" />
        {toolCall.status === "completed" ? "Web search" : "Searching web..."}
      </div>
      
      {toolCall.output && (
        <div className="pl-1">
          {typeof toolCall.output === 'string' && 
            JSON.parse(toolCall.output).map((item: any, idx: number) => (
              <div key={idx} className="mb-2 last:mb-0">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  {item.title || item.url}
                </a>
                {item.snippet && (
                  <div className="mt-0.5 text-xs text-gray-600">{item.snippet}</div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default function ToolCall({ toolCall }: ToolCallProps) {
  useEffect(() => {
    console.debug("ToolCall rendered:", {
      type: toolCall.tool_type,
      status: toolCall.status,
      id: toolCall.id
    });
  }, [toolCall]);

  return (
    <div className="flex justify-start py-1">
      {(() => {
        switch (toolCall.tool_type) {
          case "function_call":
            return <ApiCallCell toolCall={toolCall} />;
          case "file_search_call":
            return <FileSearchCell toolCall={toolCall} />;
          case "web_search_call":
            return <WebSearchCell toolCall={toolCall} />;
          default:
            return null;
        }
      })()}
    </div>
  );
}
