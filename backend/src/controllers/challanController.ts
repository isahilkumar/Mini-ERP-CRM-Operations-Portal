import { Request, Response } from 'express';
import prisma from '../utils/db';

interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export const getChallans = async (req: Request, res: Response) => {
  try {
    const challans = await prisma.challan.findMany({
      include: { customer: true, products: true, createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(challans);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createChallan = async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, products, status } = req.body;
    
    // Generate simple challan number
    const count = await prisma.challan.count();
    const challanNumber = `CHL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let totalQuantity = 0;
    const challanProducts = products.map((p: any) => {
      totalQuantity += p.quantity;
      return {
        productId: p.productId,
        productName: p.productName,
        productSku: p.productSku,
        unitPrice: p.unitPrice,
        quantity: p.quantity,
      };
    });

    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId,
        status: status || 'DRAFT',
        totalQuantity,
        createdById: req.user!.id,
        products: {
          create: challanProducts
        }
      },
      include: { products: true, customer: true }
    });

    res.status(201).json(challan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const confirmChallan = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    
    const challan = await prisma.challan.findUnique({
      where: { id: Number(id) },
      include: { products: true }
    });

    if (!challan) return res.status(404).json({ message: 'Challan not found' });
    if (challan.status === 'CONFIRMED') return res.status(400).json({ message: 'Challan already confirmed' });

    // Verify stock first
    for (const item of challan.products) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.currentStock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for product ${item.productName}. Current: ${product?.currentStock}, Required: ${item.quantity}` 
        });
      }
    }

    // Process confirmation in a transaction
    await prisma.$transaction(async (tx) => {
      // Update challan status
      await tx.challan.update({
        where: { id: challan.id },
        data: { status: 'CONFIRMED' }
      });

      // Reduce stock and create logs
      for (const item of challan.products) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } }
        });

        await tx.stockLog.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Challan Confirmed: ${challan.challanNumber}`,
            createdById: req.user!.id
          }
        });
      }
    });

    const updatedChallan = await prisma.challan.findUnique({
      where: { id: challan.id },
      include: { products: true, customer: true }
    });

    res.json(updatedChallan);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const cancelChallan = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    
    const challan = await prisma.challan.findUnique({
      where: { id: Number(id) }
    });

    if (!challan) return res.status(404).json({ message: 'Challan not found' });
    if (challan.status !== 'DRAFT') return res.status(400).json({ message: 'Only draft challans can be cancelled' });

    const updatedChallan = await prisma.challan.update({
      where: { id: challan.id },
      data: { status: 'CANCELLED' }
    });

    res.json(updatedChallan);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
