# Anti-OOM Processor
![CI Status](https://github.com/GersonResplandes/anti-oom-processor/actions/workflows/ci.yml/badge.svg)

**[🇧🇷 Leia em Português](README_pt-br.md)**

High-performance CSV processing engine designed to handle multi-gigabyte files with a **constant low memory footprint**. Leveraging Node.js Streams and Backpressure, it prevents "Out-of-Memory" (OOM) crashes common in naive implementations.

---

## 💥 The Problem: "It works on my machine"

A common scenario in Node.js backends:
1.  Marketing uploads a `products.csv` file (500MB, 2 million rows).
2.  The server tries to read the entire file into RAM (`fs.readFile`).
3.  **Result:** `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`. The server crashes, restarting all active connections.

This project solves this by treating data as a **Flow**, not a Block.

---

## 🌊 Architecture & Data Flow

```mermaid
flowchart LR
    Client[Client Upload]
    filesys[Busboy Stream]
    parser[CSV Parser]
    batcher[Batch Processor]
    db[(MongoDB)]

    Client -->|MultiPart Stream| filesys
    filesys -->|Pipe| parser
    parser -->|Row by Row| batcher
    
    subgraph Memory Protection [Node.js Pipeline]
        direction TB
        batcher -- "Buffer Full (1k rows)" --> db
        db -. "Ack (Backpressure)" .-> batcher
        batcher -. "Pause Reading" .-> parser
    end
```

### Key Technical Concepts:

1.  **Backpressure:** The system automatically pauses reading the file if the database writes become slow. The RAM usage never spikes because data "waits" on the disk/network, not in the heap.
2.  **Stream Pipeline:** Uses `stream.pipeline` to ensure proper cleanup and error handling. If the request is aborted, the file stream closes immediately.
3.  **Batch Processing:** Instead of inserting 1 row at a time (N+1 problem), we group rows into chunks of 1000 and perform `bulkWrite` operations, increasing Throughput by ~50x.

---

## 🛠 Tech Stack

-   **Runtime:** Node.js 20+ / TypeScript
-   **Framework:** Fastify (Low Overhead)
-   **Streaming Libs:**
    -   `@fastify/multipart` (Busboy wrapper)
    -   `csv-parse` (Streamable Parser)
-   **Database:** MongoDB + Mongoose (Bulk Operations)
-   **Observability:** Memory Usage Logging (Heartbeat)

---

## 🚀 Quick Start

### 1. Requirements
-   Node.js 18+
-   MongoDB (Local or Atlas)

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Locally
```bash
# Start MongoDB (if using Docker)
docker-compose up -d 

# Start Application
npm run dev
```

### 4. Test with Large File
Instead of manually searching for a large CSV, use the included helper scripts to generate and upload a test file.

**A. Generate 100MB CSV**
```bash
npx ts-node scripts/generate-csv.ts
```
*Creates `large_file.csv` in the root logic.*

**B. Stream Upload to Server**
```bash
npx ts-node scripts/test-upload.ts
```
*This script streams the file preventing client-side OOM and logs the server response.*

**Observe the Logs:**
```text
[Progress] Processed: 10000 | Failed: 0 | Heap: 42MB
[Progress] Processed: 20000 | Failed: 0 | Heap: 43MB  <-- Stable Memory!
...
[Progress] Processed: 1000000 | Failed: 0 | Heap: 42MB
```

---

## ⚠️ Known Limitations

| Limitation | Solution in v2.0 |
| :--- | :--- |
| **No Visual Progress** | Currently logs to console. v2.0 will implement **Server-Sent Events (SSE)** to stream progress bars to the frontend. |
| **Single Node** | Works on one server. For distributed processing, we would need to stream the file to Amazon S3 first and trigger an SQS Worker. |

---

## 👨‍💻 Author

**Gérson Resplandes**
Backend Engineer focused on Performance & Stream Architectures.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gerson-resplandes-de-s%C3%A1-sousa-999bb33a3/)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:maiorgerson@gmail.com)