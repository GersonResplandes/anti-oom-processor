import dotenv from 'dotenv';
dotenv.config();

const getEnv = (key: string, required: boolean = true): string => {
    const val = process.env[key];
    if (!val) {
        if (required && process.env.NODE_ENV === 'production') {
            throw new Error(`CRITICAL CONFIG ERROR: Missing Environment Variable [${key}]`);
        }
        if (required) {
            console.warn(`[WARN] Missing Env [${key}], utilizing UNSAFE DEV FALLBACK.`);
            return 'super-secret-key'; // Only for local dev context
        }
        return '';
    }
    return val;
};

export const config = {
    mongoUri: getEnv('MONGO_URI') === 'super-secret-key' ? 'mongodb://localhost:27017/anti-oom' : getEnv('MONGO_URI'),
    apiKey: getEnv('API_KEY'),
    port: parseInt(process.env.PORT || '3000'),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100')
};
