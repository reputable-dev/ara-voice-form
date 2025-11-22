import React from 'react';
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("EXPO_PUBLIC_CONVEX_URL is not set");
}

export const convex = new ConvexReactClient(convexUrl);

export const ConvexClientProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ConvexProvider, { client: convex }, children);
};