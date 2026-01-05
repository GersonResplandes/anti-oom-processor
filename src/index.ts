import fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import bearerAuth from '@fastify/bearer-auth';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { connectDB } from './config/database';
import { config } from './config/env';
import { uploadController, uploadSchema } from './controllers/upload.controller';

const server = fastify({
    logger: true,
});

// Documentation: Swagger
server.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'Anti-OOM CSV Processor',
            description: 'High-performance CSV upload API with Zero-OOM guarantee',
            version: '1.0.0'
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ bearerAuth: [] }]
    }
});

server.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
        docExpansion: 'full',
        deepLinking: false
    },
    staticCSP: true,
});

// Security: Rate Limit
server.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: '1 minute'
});

// Register Multipart
server.register(fastifyMultipart, {
    limits: {
        fileSize: 1024 * 1024 * 1024, // 1GB max file size
    }
});

// Routes
server.get('/health', async () => {
    return { status: 'ok', memory: process.memoryUsage() };
});

// Authenticated Routes (Protected)
server.register(async (protectedRoutes) => {
    // Security: Bearer Auth
    const keys = new Set([config.apiKey]);
    protectedRoutes.register(bearerAuth, { keys });

    protectedRoutes.post('/upload', { schema: uploadSchema }, uploadController);
});

const start = async () => {
    try {
        await connectDB();
        await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server running on http://localhost:3000');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
