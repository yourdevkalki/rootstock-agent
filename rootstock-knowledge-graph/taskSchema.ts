/**
 * Task entity interface for TypeScript
 * Maps to the TaskCreated event from TaskRegistry contract
 */
export interface TaskEntity {
  taskId: string;
  creator: string;
  target: string;
  action: string;
  condition: string;
  status: string;
  createdAt: string;
  lastRun?: string;
}

/**
 * Resolver type enum matching the contract
 */
export enum ResolverType {
  Time = 0,
  Price = 1,
}

/**
 * Helper function to convert ResolverType enum to string
 */
export function resolverTypeToString(resolverType: ResolverType): string {
  switch (resolverType) {
    case ResolverType.Time:
      return "Time";
    case ResolverType.Price:
      return "Price";
    default:
      return "Unknown";
  }
}
