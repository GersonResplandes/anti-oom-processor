import { BatchProcessorStream } from '../lib/batch-processor.stream';

describe('BatchProcessorStream', () => {
    it('should process items in batches', async () => {
        const processor = jest.fn().mockResolvedValue(undefined);
        const stream = new BatchProcessorStream<number>(2, processor);

        // Write 3 items
        stream.write(1);
        stream.write(2); // Should trigger flush (batch size 2)
        stream.write(3);

        // End stream to flush remaining
        await new Promise<void>((resolve) => stream.end(resolve));

        // Expect 2 calls: [1, 2] and [3]
        expect(processor).toHaveBeenCalledTimes(2);
        expect(processor).toHaveBeenNthCalledWith(1, [1, 2]);
        expect(processor).toHaveBeenNthCalledWith(2, [3]);
    });
});
