import { Request, Response } from 'express';
import prisma from '../utils/db';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { contains: search } }
      ]
    } : {};

    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await prisma.product.count({ where });

    res.json({
      data: products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/products/${req.file.filename}`;
    }
    
    const productData = { ...req.body };
    // Convert string fields to numbers where necessary, since formData comes as strings
    if (productData.unitPrice) productData.unitPrice = Number(productData.unitPrice);
    if (productData.currentStock) productData.currentStock = Number(productData.currentStock);
    if (productData.minStockAlert) productData.minStockAlert = Number(productData.minStockAlert);
    if (imageUrl) productData.imageUrl = imageUrl;

    const product = await prisma.product.create({
      data: productData,
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : undefined;

    const productData = { ...req.body };
    if (productData.unitPrice) productData.unitPrice = Number(productData.unitPrice);
    if (productData.currentStock) productData.currentStock = Number(productData.currentStock);
    if (productData.minStockAlert) productData.minStockAlert = Number(productData.minStockAlert);
    if (imageUrl) productData.imageUrl = imageUrl;

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: productData,
    });
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStockLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.stockLog.findMany({
      include: { product: true, createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
