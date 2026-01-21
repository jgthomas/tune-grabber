export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface JobRecord {
  JobId: string;
  Status: JobStatus;
  Url: string;
  Title: string;
  CreatedAt: string;
  S3Key?: string;
  ErrorMessage?: string;
}

export interface JobPayload {
  jobId: string;
  url: string;
  title: string;
}
