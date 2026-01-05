import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    sku: string;
    name: string;
    price: number;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
    sku: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IProduct>('Product', ProductSchema);
