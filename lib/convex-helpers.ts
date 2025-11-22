/**
 * Convex helper hooks
 *
 * Type-safe wrappers for Convex queries and mutations
 */

import { useQuery, useMutation } from "convex/react";
import { FunctionReference, FunctionReturnType, FunctionArgs } from "convex/server";

/**
 * Type-safe wrapper for Convex useQuery
 */
export function useConvexQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>
): FunctionReturnType<Query> | undefined {
  return useQuery(query, args);
}

/**
 * Type-safe wrapper for Convex useMutation
 */
export function useConvexMutation<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation
) {
  return useMutation(mutation);
}
