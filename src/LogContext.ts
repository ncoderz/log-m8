export interface LogContext {
  [key: string]: unknown;
  userId?: string;
  requestId?: string;
  correlationId?: string;
}
