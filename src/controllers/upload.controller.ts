import { FastifyReply, FastifyRequest } from 'fastify';
import { pipeline } from 'node:stream/promises';
import { parse } from 'csv-parse';
import { MultipartFile } from '@fastify/multipart';
import { BatchProcessorStream } from '../lib/batch-processor.stream';
import { ProductService, CsvProductRow } from '../services/product.service';
import { progressEmitter } from '../lib/event-bus';
import mongoose from 'mongoose';

export const uploadController = async (req: FastifyRequest, reply: FastifyReply) => {
    // Fail Fast if DB is offline
    if (mongoose.connection.readyState !== 1) {
        return reply.status(503).send({ error: 'Service Unavailable: Database not connected' });
    }

    const parts = req.parts();
    const productService = new ProductService();

    // Metrics
    let totalProcessed = 0;
    let totalFailed = 0;
    // In a real scenario, we might stream errors to a file. For now, we log summary.

    try {
        for await (const part of parts) {
            if (part.type === 'file') {
                const filePart = part as MultipartFile;
                console.log(`Starting processing for file: ${filePart.filename}`);

                const processorStream = new BatchProcessorStream<CsvProductRow>(1000, async (batch) => {
                    const result = await productService.processBatch(batch);
                    totalProcessed += result.processed;
                    totalFailed += result.failed;

                    // OBSERVABILITY: Log validation errors
                    if (result.failed > 0) {
                        result.errors.forEach(err => {
                            console.warn(`[Validation Error] SKU: ${err.sku} | Reason: ${err.error}`);
                        });
                    }

                    const total = totalProcessed + totalFailed;

                    const mem = process.memoryUsage();
                    const heapMB = Math.round(mem.heapUsed / 1024 / 1024);

                    // Emit SSE Event
                    progressEmitter.emit('progress', {
                        processed: total,
                        failed: totalFailed,
                        memoryMB: heapMB,
                        timestamp: new Date().toISOString()
                    });

                    // HEARTBEAT LOGGING (Console)
                    if (total % 10000 === 0 || total === batch.length) {
                        const mem = process.memoryUsage();
                        console.log(`[Progress] Processed: ${totalProcessed} | Failed: ${totalFailed} | Heap: ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);
                    }
                });

                await pipeline(
                    filePart.file,
                    parse({
                        columns: true,
                        skip_empty_lines: true,
                        trim: true,
                        max_record_size: 1024 * 1024 // 1MB Limit per Row (CSV Bomb protection)
                    }),
                    processorStream
                );

                console.log(`Finished processing file: ${filePart.filename}`);
                progressEmitter.emit('progress', {
                    status: 'completed',
                    processed: totalProcessed,
                    failed: totalFailed
                });
            }
        }

        return reply.send({
            message: 'Upload completed',
            stats: { processed: totalProcessed, failed: totalFailed }
        });
    } catch (err) {
        console.error('Pipeline Error:', err);
        return reply.status(500).send({ error: 'Internal Server Error during processing' });
    }
};

export const uploadSchema = {
    description: 'Upload a large CSV file containing product data',
    tags: ['Products'],
    summary: 'Stream Upload CSV',
    consumes: ['multipart/form-data'],
    // Body schema removed to allow stream processing
    response: {
        200: {
            description: 'Upload successful',
            type: 'object',
            properties: {
                message: { type: 'string' },
                stats: {
                    type: 'object',
                    properties: {
                        processed: { type: 'integer' },
                        failed: { type: 'integer' }
                    }
                }
            }
        },
        400: {
            description: 'Bad Request',
            type: 'object',
            properties: {
                error: { type: 'string' }
            }
        },
        503: {
            description: 'Service Unavailable (DB Offline)',
            type: 'object',
            properties: {
                error: { type: 'string' }
            }
        }
    }
};
