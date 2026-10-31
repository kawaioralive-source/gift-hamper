/**
 * Scalable Asynchronous Background Job Queue
 * Designed for serverless/Next.js edge and Node environments.
 * Provides bounded concurrency, idempotency deduplication, exponential backoff with jitter,
 * and dead-letter queue (DLQ) tracking for non-blocking operations (e.g. email delivery,
 * receipt generation, notification dispatch, analytics tracking).
 */

export interface BackgroundJob<T = any> {
  id: string;
  type: string;
  data: T;
  idempotencyKey?: string;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: number;
  updatedAt: number;
}

type JobHandler<T = any> = (job: BackgroundJob<T>) => Promise<void>;

class BackgroundQueue {
  private queue: BackgroundJob[] = [];
  private deadLetterQueue: BackgroundJob[] = [];
  private handlers = new Map<string, JobHandler>();
  private processedIdempotencyKeys = new Set<string>();
  private activeWorkers = 0;
  private maxConcurrency = 3;
  private maxQueueSize = 500;

  /**
   * Register a handler for a job type (e.g., 'send_order_email', 'generate_invoice')
   */
  public registerHandler<T>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler);
  }

  /**
   * Enqueue a new background task with optional idempotency protection
   */
  public enqueue<T>(type: string, data: T, options?: { idempotencyKey?: string; maxAttempts?: number }): BackgroundJob<T> | null {
    // 1. Idempotency check: if job has already run or is queued, ignore duplicate
    if (options?.idempotencyKey) {
      if (this.processedIdempotencyKeys.has(options.idempotencyKey)) {
        return null;
      }
      this.processedIdempotencyKeys.add(options.idempotencyKey);
    }

    // 2. Bounded queue limit to prevent unbounded memory usage
    if (this.queue.length >= this.maxQueueSize) {
      console.warn(`[Queue] Max queue capacity (${this.maxQueueSize}) reached. Dropping low-priority job: ${type}`);
      return null;
    }

    const job: BackgroundJob<T> = {
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      data,
      idempotencyKey: options?.idempotencyKey,
      attempts: 0,
      maxAttempts: options?.maxAttempts || 3,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.queue.push(job);
    this.processNext();
    return job;
  }

  /**
   * Process next queued job with concurrency control and non-blocking scheduling
   */
  private async processNext(): Promise<void> {
    if (this.activeWorkers >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.activeWorkers++;
    job.status = 'processing';
    job.attempts++;
    job.updatedAt = Date.now();

    const handler = this.handlers.get(job.type);

    if (!handler) {
      console.warn(`[Queue] No registered handler for job type: ${job.type}`);
      this.deadLetterQueue.push(job);
      this.activeWorkers--;
      this.processNext();
      return;
    }

    try {
      await handler(job);
      job.status = 'completed';
      job.updatedAt = Date.now();
    } catch (err: any) {
      console.error(`[Queue] Error processing job ${job.id} (attempt ${job.attempts}/${job.maxAttempts}):`, err?.message || err);
      job.error = err?.message || String(err);

      if (job.attempts < job.maxAttempts) {
        // Exponential backoff with jitter: delay = min(30s, (2^(attempts-1) * 1000) + jitter)
        const jitter = Math.floor(Math.random() * 500);
        const backoffMs = Math.min(30000, Math.pow(2, job.attempts - 1) * 1000 + jitter);
        job.status = 'pending';

        setTimeout(() => {
          this.queue.push(job);
          this.processNext();
        }, backoffMs);
      } else {
        // Max attempts reached -> send to Dead Letter Queue (DLQ)
        job.status = 'failed';
        this.deadLetterQueue.push(job);
        if (this.deadLetterQueue.length > 100) {
          this.deadLetterQueue.shift(); // Bound DLQ size
        }
      }
    } finally {
      this.activeWorkers--;
      this.processNext();
    }
  }

  /**
   * Queue observability stats
   */
  public getStats() {
    return {
      pending: this.queue.length,
      activeWorkers: this.activeWorkers,
      maxConcurrency: this.maxConcurrency,
      deadLetterQueueCount: this.deadLetterQueue.length,
    };
  }
}

// Global singleton instance
export const backgroundQueue = new BackgroundQueue();

// Register default system handlers
backgroundQueue.registerHandler('send_order_email', async (job) => {
  // Simulated asynchronous email delivery non-blocking task
  await new Promise((resolve) => setTimeout(resolve, 300));
});

backgroundQueue.registerHandler('audit_log', async (job) => {
  // Non-blocking security/performance audit logging
  await new Promise((resolve) => setTimeout(resolve, 100));
});
