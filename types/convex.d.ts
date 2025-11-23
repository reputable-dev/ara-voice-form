// Type declarations for Convex
declare module "convex/server" {
  export interface DataModel {
    // Define your data model here
  }
  
  export function mutation<Func extends (...args: any[]) => any>(func: Func): Func;
  export function query<Func extends (...args: any[]) => any>(func: Func): Func;
  export function action<Func extends (...args: any[]) => any>(func: Func): Func;
}

declare module "convex/values" {
  export function v<T>(value: T): T;
  export const id: any;
}

declare module "convex/react" {
  import { ReactNode } from "react";
  
  export class ConvexReactClient {
    constructor(address: string);
    Provider: React.ComponentType<{ children: ReactNode; client: ConvexReactClient }>;
  }
  
  export function useMutation<Func extends (...args: any[]) => any>(name: string): Func;
  export function useQuery<Func extends (...args: any[]) => any>(name: string): ReturnType<Func>;
}