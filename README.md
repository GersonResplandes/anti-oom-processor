# Anti-OOM CSV Processor
> A memory-efficient CSV processing engine capable of handling multi-gigabyte files using Node.js Streams and Backpressure.

## Features
- **Zero-OOM Guarantee**: Processes files larger than available RAM using Streams.
- **Architectural Decoupling**: Separation of concerns between Stream Infrastructure and Domain Logic.
- **Security Hardened**:
  - Rate Limiting (100 req/min/IP)
  - Bearer Token Authentication
  - Input Validation (NoSQL Injection prevention)
- **Production Ready**: TypeScript, ESLint, Jest, GitHub Actions.

## Requirements
- Node.js 18+
- MongoDB

## Setup
```bash
npm install
cp .env.example .env
npm run build
```

## Running
```bash
# Development
npm run dev

# Production
npm start
```

## Usage
**Upload a CSV File:**
```bash
curl -X POST http://localhost:3000/upload \
  -H "Authorization: Bearer super-secret-key" \
  -F "file=@large_file.csv"
```
