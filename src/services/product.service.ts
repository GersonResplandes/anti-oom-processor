import Product from '../models/product.model';
import { AnyBulkWriteOperation } from 'mongoose';

export interface CsvProductRow {
    sku: string;
    name: string;
    price: string; // CSV input is string
}

export interface ProcessingResult {
    processed: number;
    failed: number;
    errors: Array<{ sku?: string; error: string }>;
}

export class ProductService {
    /**
     * Processes a batch of raw CSV rows.
     * 1. Validates data
     * 2. Prepares MongoDB operations
     * 3. Executes BulkWrite
     */
    async processBatch(rows: CsvProductRow[]): Promise<ProcessingResult> {
        const operations: AnyBulkWriteOperation[] = [];
        const errors: Array<{ sku?: string; error: string }> = [];

        for (const row of rows) {
            const validation = this.validateRow(row);
            if (validation.valid && validation.data) {
                operations.push({
                    updateOne: {
                        filter: { sku: validation.data.sku },
                        update: {
                            $set: {
                                name: validation.data.name,
                                price: validation.data.price,
                                updatedAt: new Date()
                            }
                        },
                        upsert: true
                    }
                });
            } else {
                errors.push({ sku: row.sku, error: validation.error || 'Unknown error' });
            }
        }

        if (operations.length > 0) {
            await Product.bulkWrite(operations);
        }

        return {
            processed: operations.length,
            failed: errors.length,
            errors
        };
    }

    private validateRow(row: CsvProductRow): { valid: boolean; data?: { sku: string; name: string; price: number }; error?: string } {
        if (!row.sku || typeof row.sku !== 'string') return { valid: false, error: 'Missing or Invalid SKU' };

        // Sanitize SKU (NoSQL Injection mitigation - casting to string is usually enough but trimming is good)
        const sku = row.sku.trim();
        if (!sku) return { valid: false, error: 'Empty SKU' };

        if (!row.name) return { valid: false, error: 'Missing Name' };

        const price = parseFloat(row.price);
        if (isNaN(price) || price <= 0) return { valid: false, error: 'Invalid Price' };

        return {
            valid: true,
            data: { sku, name: row.name, price }
        };
    }
}
