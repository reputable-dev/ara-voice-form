/**
 * Gemini RAG Client Library
 *
 * React hooks for interacting with Gemini RAG file search service
 * through Convex backend functions.
 */

import { useConvexMutation, useConvexQuery } from "./convex-helpers";
import { api } from "@/convex/_generated/api";

/**
 * Hook to upload files to Gemini RAG
 */
export const useUploadToRag = () => {
  const uploadFile = useConvexMutation(api.geminiRag.uploadFile);

  return {
    uploadFile: async (fileName: string, fileContent: string, storeName?: string) => {
      try {
        const result = await uploadFile({
          fileName,
          fileContent,
          storeName,
        });
        return result;
      } catch (error) {
        console.error("Upload to RAG failed:", error);
        throw error;
      }
    },
  };
};

/**
 * Hook to query Gemini RAG
 */
export const useQueryRag = () => {
  const queryRag = useConvexMutation(api.geminiRag.query_rag);

  return {
    query: async (question: string, storeName?: string, maxResults?: number) => {
      try {
        const result = await queryRag({
          question,
          storeName,
          maxResults,
        });
        return result;
      } catch (error) {
        console.error("RAG query failed:", error);
        throw error;
      }
    },
  };
};

/**
 * Hook to list files in RAG store
 */
export const useListRagFiles = (storeName?: string) => {
  const files = useConvexQuery(api.geminiRag.listFiles, {
    storeName,
  });

  return {
    files: files?.files || [],
    totalFiles: files?.totalFiles || 0,
    storeName: files?.storeName,
    isLoading: files === undefined,
  };
};

/**
 * Hook to delete files from RAG
 */
export const useDeleteFromRag = () => {
  const deleteFile = useConvexMutation(api.geminiRag.deleteFile);

  return {
    deleteFile: async (fileName: string, storeName?: string) => {
      try {
        const result = await deleteFile({
          fileName,
          storeName,
        });
        return result;
      } catch (error) {
        console.error("Delete from RAG failed:", error);
        throw error;
      }
    },
  };
};

/**
 * Hook to get RAG service status
 */
export const useRagStatus = () => {
  const status = useConvexQuery(api.geminiRag.getStatus, {});

  return {
    status: status?.status || "unknown",
    isOnline: status?.status === "online",
    isOffline: status?.status === "offline",
    message: status?.message,
    isLoading: status === undefined,
  };
};

/**
 * Hook to clear RAG store
 */
export const useClearRagStore = () => {
  const clearStore = useConvexMutation(api.geminiRag.clearStore);

  return {
    clearStore: async (storeName?: string) => {
      try {
        const result = await clearStore({
          storeName,
        });
        return result;
      } catch (error) {
        console.error("Clear RAG store failed:", error);
        throw error;
      }
    },
  };
};

/**
 * Utility function to convert File to base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Content = base64.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = (error) => reject(error);
  });
};
