export interface Job {
  id: string;
  name: string;
  cron: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
  nextRun: string;
  retries: number;
  createdAt: string;
  updatedAt: string;
}
