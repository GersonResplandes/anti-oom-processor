import { EventEmitter } from 'events';

/**
 * Global Event Bus for broadcasting progress updates.
 * Singleton instance of EventEmitter.
 * 
 * Usage:
 * - Producers (Controllers) emit 'progress' events.
 * - Consumers (SSE Routes) subscribe to 'progress' events.
 */
class ProgressEmitter extends EventEmitter {}

export const progressEmitter = new ProgressEmitter();

// Increase limit to support multiple concurrent SSE clients in dev mode
progressEmitter.setMaxListeners(50);
