import { Writable } from 'node:stream';

export type ProcessorFunction<T> = (batch: T[]) => Promise<void>;

export class BatchProcessorStream<T> extends Writable {
    private batch: T[] = [];
    private processedCount = 0;

    constructor(
        private readonly batchSize: number,
        private readonly processor: ProcessorFunction<T>,
        options?: { objectMode: boolean }
    ) {
        super({ objectMode: options?.objectMode ?? true });
    }

    async _write(chunk: T, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        try {
            this.batch.push(chunk);

            if (this.batch.length >= this.batchSize) {
                await this.flush();
            }

            callback();
        } catch (err) {
            callback(err as Error);
        }
    }

    async _final(callback: (error?: Error | null) => void) {
        try {
            await this.flush();
            callback();
        } catch (err) {
            callback(err as Error);
        }
    }

    private async flush() {
        if (this.batch.length === 0) return;

        const data = [...this.batch];
        this.batch = []; // Clear immediately to release memory reference

        await this.processor(data);
        this.processedCount += data.length;
    }

    public getProcessedCount(): number {
        return this.processedCount;
    }
}
