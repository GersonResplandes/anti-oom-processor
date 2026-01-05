import { ProductService, CsvProductRow } from '../services/product.service';
import Product from '../models/product.model';

// Mock Mongoose Model
jest.mock('../models/product.model', () => ({
    bulkWrite: jest.fn().mockResolvedValue({ insertedCount: 1 })
}));

describe('ProductService', () => {
    let service: ProductService;

    beforeEach(() => {
        service = new ProductService();
        jest.clearAllMocks();
    });

    it('should validate and process valid rows', async () => {
        const rows: CsvProductRow[] = [
            { sku: 'SKU1', name: 'Product 1', price: '10.50' },
            { sku: 'SKU2', name: 'Product 2', price: '20.00' }
        ];

        const result = await service.processBatch(rows);

        expect(result.processed).toBe(2);
        expect(result.failed).toBe(0);
        expect(Product.bulkWrite).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid prices (Negative or NaN)', async () => {
        const rows: CsvProductRow[] = [
            { sku: 'SKU1', name: 'Valid', price: '10' },
            { sku: 'SKU2', name: 'Negative', price: '-5' },
            { sku: 'SKU3', name: 'NaN', price: 'abc' }
        ];

        const result = await service.processBatch(rows);

        expect(result.processed).toBe(1); // Only SKU1 is valid
        expect(result.failed).toBe(2);
        expect(Product.bulkWrite).toHaveBeenCalledTimes(1);

        // Check error details
        expect(result.errors.find(e => e.sku === 'SKU2')?.error).toBe('Invalid Price');
        expect(result.errors.find(e => e.sku === 'SKU3')?.error).toBe('Invalid Price');
    });

    it('should reject missing SKU or Name', async () => {
        const rows: CsvProductRow[] = [
            { sku: '', name: 'No SKU', price: '10' },
            { sku: 'SKU4', name: '', price: '10' }
        ];

        const result = await service.processBatch(rows);

        expect(result.processed).toBe(0);
        expect(result.failed).toBe(2);
        expect(Product.bulkWrite).not.toHaveBeenCalled(); // No valid ops
    });
});
