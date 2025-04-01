import { toolsList } from "../../config/tools-list";
import useToolsStore from "@/stores/useToolsStore";
import { WebSearchConfig } from "@/stores/useToolsStore";

interface WebSearchTool extends WebSearchConfig {
  type: "web_search";
}
export const getTools = () => {
  const {
    webSearchEnabled,
    fileSearchEnabled,
    functionsEnabled,
    vectorStore,
    webSearchConfig,
  } = useToolsStore.getState();

  console.log("[getTools] Store state:", {
    webSearchEnabled,
    fileSearchEnabled,
    functionsEnabled,
    vectorStoreId: vectorStore?.id || 'none',
    vectorStoreName: vectorStore?.name || 'none'
  });

  const tools = [];

  if (webSearchEnabled) {
    const webSearchTool: WebSearchTool = {
      type: "web_search",
    };
    if (
      webSearchConfig.user_location &&
      (webSearchConfig.user_location.country !== "" ||
        webSearchConfig.user_location.region !== "" ||
        webSearchConfig.user_location.city !== "")
    ) {
      webSearchTool.user_location = webSearchConfig.user_location;
    }

    tools.push(webSearchTool);
    console.log("[getTools] Added web search tool");
  }

  if (fileSearchEnabled) {
    if (vectorStore && vectorStore.id && vectorStore.id.trim() !== "") {
      const fileSearchTool = {
        type: "file_search",
        vector_store_ids: [vectorStore.id],
      };
      tools.push(fileSearchTool);
      console.log(`[getTools] Added file search tool with vector store: ${vectorStore.id}`);
    } else {
      console.log("[getTools] File search enabled but no valid vector store ID found:", vectorStore);
      // Option: Force disable file search if no valid vector store
      // useToolsStore.setState({ fileSearchEnabled: false });
    }
  } else {
    console.log("[getTools] File search not enabled");
  }

  if (functionsEnabled) {
    tools.push(
      ...toolsList.map((tool) => {
        return {
          type: "function",
          name: tool.name,
          description: tool.description,
          parameters: {
            type: "object",
            properties: { ...tool.parameters },
            required: Object.keys(tool.parameters),
            additionalProperties: false,
          },
          strict: true,
        };
      })
    );
    console.log(`[getTools] Added ${toolsList.length} function tools`);
  }

  console.log("[getTools] Final tools list:", tools.map(t => {
    if (t.type === "function") {
      return `function:${(t as any).name}`;
    }
    return t.type;
  }));

  return tools;
};
