import { FastifyRequest, FastifyReply } from 'fastify';
import { progressEmitter } from '../lib/event-bus';

export const sseController = (req: FastifyRequest, reply: FastifyReply) => {
    // 1. SSE Headers
    reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    reply.raw.write('\n');

    // 2. Send function
    const sendUpdate = (data: any) => {
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 3. Subscribe
    progressEmitter.on('progress', sendUpdate);

    // 4. Cleanup on close
    req.raw.on('close', () => {
        progressEmitter.removeListener('progress', sendUpdate);
    });
};
