import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "http://localhost:3210";
const convex = new ConvexReactClient(convexUrl);

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return (
    <convex.Provider client={convex}>
      {children}
    </convex.Provider>
  );
}