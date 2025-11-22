import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Configuration
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:5001";

/**
 * Upload a file to Gemini RAG for indexing
 */
export const uploadFile = mutation({
  args: {
    fileName: v.string(),
    fileContent: v.string(), // base64 encoded file content
    storeName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const formData = new FormData();

      // Convert base64 to blob
      const byteCharacters = atob(args.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);

      formData.append('file', blob, args.fileName);
      if (args.storeName) {
        formData.append('store_name', args.storeName);
      }

      const response = await fetch(`${RAG_SERVICE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RAG upload error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        fileName: args.fileName,
        storeName: data.store_name,
        message: data.message,
      };
    } catch (error) {
      console.error("Gemini RAG upload error:", error);
      throw error;
    }
  },
});

/**
 * Query the Gemini RAG for information
 */
export const query_rag = mutation({
  args: {
    question: v.string(),
    storeName: v.optional(v.string()),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const params = new URLSearchParams({
        question: args.question,
      });

      if (args.storeName) {
        params.append('store_name', args.storeName);
      }
      if (args.maxResults) {
        params.append('max_results', args.maxResults.toString());
      }

      const response = await fetch(`${RAG_SERVICE_URL}/query?${params.toString()}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RAG query error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return {
        answer: data.answer,
        sources: data.sources || [],
        storeName: data.store_name,
      };
    } catch (error) {
      console.error("Gemini RAG query error:", error);
      throw error;
    }
  },
});

/**
 * List all files in a RAG store
 */
export const listFiles = query({
  args: {
    storeName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const params = args.storeName
        ? new URLSearchParams({ store_name: args.storeName })
        : new URLSearchParams();

      const response = await fetch(`${RAG_SERVICE_URL}/files?${params.toString()}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RAG list files error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return {
        files: data.files || [],
        storeName: data.store_name,
        totalFiles: data.files?.length || 0,
      };
    } catch (error) {
      console.error("Gemini RAG list files error:", error);
      throw error;
    }
  },
});

/**
 * Delete a file from the RAG store
 */
export const deleteFile = mutation({
  args: {
    fileName: v.string(),
    storeName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const params = new URLSearchParams({
        file_name: args.fileName,
      });

      if (args.storeName) {
        params.append('store_name', args.storeName);
      }

      const response = await fetch(`${RAG_SERVICE_URL}/delete?${params.toString()}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RAG delete error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        fileName: args.fileName,
        message: data.message,
      };
    } catch (error) {
      console.error("Gemini RAG delete error:", error);
      throw error;
    }
  },
});

/**
 * Get RAG service status
 */
export const getStatus = query({
  handler: async (ctx) => {
    try {
      const response = await fetch(`${RAG_SERVICE_URL}/status`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        return {
          status: "offline",
          message: `RAG service returned ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        status: "online",
        ...data,
      };
    } catch (error) {
      console.error("Gemini RAG status check error:", error);
      return {
        status: "offline",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Clear all files from a RAG store
 */
export const clearStore = mutation({
  args: {
    storeName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const params = args.storeName
        ? new URLSearchParams({ store_name: args.storeName })
        : new URLSearchParams();

      const response = await fetch(`${RAG_SERVICE_URL}/clear?${params.toString()}`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RAG clear store error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        storeName: data.store_name,
        message: data.message,
      };
    } catch (error) {
      console.error("Gemini RAG clear store error:", error);
      throw error;
    }
  },
});
