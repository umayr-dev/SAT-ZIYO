/**
 * Production-ready Request Queue Manager
 * Handles batching, debouncing, and rate limiting for API requests
 */

interface QueuedRequest {
  id: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number; // milliseconds
  maxConcurrentRequests: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private config: BatchConfig;
  private activeRequests = 0;
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxBatchSize: config.maxBatchSize || 10, // Max 10 requests per batch
      maxWaitTime: config.maxWaitTime || 2000, // Wait max 2s before sending batch
      maxConcurrentRequests: config.maxConcurrentRequests || 3, // Max 3 concurrent batches
    };
  }

  /**
   * Add request to queue
   */
  async enqueue<T>(id: string, execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        id,
        execute,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      // Start processing if not already processing
      if (!this.processing) {
        this.startProcessing();
      }

      // If queue reaches max batch size, process immediately
      if (this.queue.length >= this.config.maxBatchSize) {
        this.processBatch();
      }
    });
  }

  /**
   * Start processing queue
   */
  private startProcessing() {
    if (this.processing) return;
    this.processing = true;

    // Set timer to process batch after maxWaitTime
    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.config.maxWaitTime);
  }

  /**
   * Process a batch of requests
   */
  private async processBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Check if we can process more requests
    if (this.activeRequests >= this.config.maxConcurrentRequests) {
      // Wait a bit and try again
      setTimeout(() => this.processBatch(), 100);
      return;
    }

    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    // Take up to maxBatchSize requests from queue
    const batch = this.queue.splice(0, this.config.maxBatchSize);
    this.activeRequests++;

    try {
      // Execute all requests in batch in parallel
      const results = await Promise.allSettled(
        batch.map((req) => req.execute())
      );

      // Resolve/reject each request
      results.forEach((result, index) => {
        const req = batch[index];
        if (result.status === "fulfilled") {
          req.resolve(result.value);
        } else {
          req.reject(result.reason);
        }
      });
    } catch (error) {
      // If batch fails, reject all requests
      batch.forEach((req) => req.reject(error));
    } finally {
      this.activeRequests--;

      // Continue processing if queue is not empty
      if (this.queue.length > 0) {
        this.startProcessing();
      } else {
        this.processing = false;
      }
    }
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue.forEach((req) => {
      req.reject(new Error("Queue cleared"));
    });
    this.queue = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.processing = false;
  }
}

// Global request queue instance
export const globalRequestQueue = new RequestQueue({
  maxBatchSize: 10,
  maxWaitTime: 2000,
  maxConcurrentRequests: 3,
});

/**
 * Debounce function - delays execution until after wait time
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits execution to once per wait time
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= wait) {
      lastCall = now;
      func(...args);
    } else {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, wait - timeSinceLastCall);
    }
  };
}

