/**
 * Server-Side Idempotency Guard
 * Protects critical mutation endpoints (order creation, payments, promo redemption)
 * against rapid double submissions, network retries, and race conditions.
 */

interface IdempotencyEntry {
  status: 'in_flight' | 'completed';
  response?: any;
  timestamp: number;
}

const idempotencyStore = new Map<string, IdempotencyEntry>();

// Evict keys older than 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - 5 * 60 * 1000;
    idempotencyStore.forEach((entry, key) => {
      if (entry.timestamp < cutoff) {
        idempotencyStore.delete(key);
      }
    });
  }, 60 * 1000);
}

export function checkIdempotency(key: string): { isDuplicate: boolean; entry?: IdempotencyEntry } {
  const existing = idempotencyStore.get(key);
  if (!existing) {
    idempotencyStore.set(key, {
      status: 'in_flight',
      timestamp: Date.now(),
    });
    return { isDuplicate: false };
  }

  return { isDuplicate: true, entry: existing };
}

export function completeIdempotency(key: string, response: any): void {
  const entry = idempotencyStore.get(key);
  if (entry) {
    entry.status = 'completed';
    entry.response = response;
  } else {
    idempotencyStore.set(key, {
      status: 'completed',
      response,
      timestamp: Date.now(),
    });
  }
}

export function releaseIdempotency(key: string): void {
  idempotencyStore.delete(key);
}
