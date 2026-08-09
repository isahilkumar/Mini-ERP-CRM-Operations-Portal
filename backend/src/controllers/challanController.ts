import { Request, Response } from 'express';
import prisma from '../utils/db';

interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

// ── helpers ────────────────────────────────────────────────────────────────

/** Collision-safe: CHL-2025-0042-A3F */
const generateChallanNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.challan.count();
  const seq = String(count + 1).padStart(4, '0');
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `CHL-${year}-${seq}-${rand}`;
};

// ── GET /challans ──────────────────────────────────────────────────────────

export const getChallans = async (req: Request, res: Response) => {
  try {
    const challans = await prisma.challan.findMany({
      include: {
        customer: true,
        products: true,
        createdBy: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(challans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /challans/:id ──────────────────────────────────────────────────────

export const getChallanById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const challan = await prisma.challan.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        products: true,
        createdBy: { select: { name: true, role: true } },
      },
    });
    if (!challan) return res.status(404).json({ message: 'Challan not found' });
    res.json(challan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /challans ─────────────────────────────────────────────────────────

export const createChallan = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { customerId, products, status } = req.body;

    if (!customerId || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'customerId and at least one product are required' });
    }

    const challanNumber = await generateChallanNumber();
    const targetStatus: string = status === 'CONFIRMED' ? 'CONFIRMED' : 'DRAFT';

    let totalQuantity = 0;
    const challanProducts = products.map((p: any) => {
      totalQuantity += Number(p.quantity);
      return {
        productId: p.productId,
        productName: p.productName,
        productSku: p.productSku,
        unitPrice: p.unitPrice,
        quantity: Number(p.quantity),
      };
    });

    // ── If confirming directly, validate stock before writing anything ──
    if (targetStatus === 'CONFIRMED') {
      for (const item of challanProducts) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          return res.status(400).json({ message: `Product not found: ${item.productName}` });
        }
        if (product.currentStock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${item.quantity}`,
          });
        }
      }
    }

    // ── Create challan + optionally deduct stock in one transaction ──
    const challan = await prisma.$transaction(async (tx) => {
      const created = await tx.challan.create({
        data: {
          challanNumber,
          customerId,
          status: targetStatus,
          totalQuantity,
          createdById: req.user!.id,
          products: { create: challanProducts },
        },
        include: {
          products: true,
          customer: true,
          createdBy: { select: { name: true, role: true } },
        },
      });

      if (targetStatus === 'CONFIRMED') {
        for (const item of challanProducts) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });
          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: 'OUT',
              reason: `Challan Confirmed: ${challanNumber}`,
              createdById: req.user!.id,
            },
          });
        }
      }

      return created;
    });

    res.status(201).json(challan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PUT /challans/:id/confirm ──────────────────────────────────────────────

export const confirmChallan = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({
      where: { id: Number(id) },
      include: { products: true },
    });

    if (!challan) return res.status(404).json({ message: 'Challan not found' });
    if (challan.status === 'CONFIRMED')
      return res.status(400).json({ message: 'Challan already confirmed' });
    if (challan.status === 'CANCELLED')
      return res.status(400).json({ message: 'Cannot confirm a cancelled challan' });

    // Verify stock availability first (fail fast, no partial writes)
    for (const item of challan.products) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.currentStock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${item.productName}". Available: ${product?.currentStock ?? 0}, Required: ${item.quantity}`,
        });
      }
    }

    // Confirm in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.challan.update({
        where: { id: challan.id },
        data: { status: 'CONFIRMED' },
      });

      for (const item of challan.products) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Challan Confirmed: ${challan.challanNumber}`,
            createdById: req.user!.id,
          },
        });
      }
    });

    const updatedChallan = await prisma.challan.findUnique({
      where: { id: challan.id },
      include: {
        products: true,
        customer: true,
        createdBy: { select: { name: true, role: true } },
      },
    });

    res.json(updatedChallan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PUT /challans/:id/cancel ───────────────────────────────────────────────

export const cancelChallan = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({ where: { id: Number(id) } });

    if (!challan) return res.status(404).json({ message: 'Challan not found' });
    if (challan.status !== 'DRAFT')
      return res.status(400).json({ message: 'Only draft challans can be cancelled' });

    const updatedChallan = await prisma.challan.update({
      where: { id: challan.id },
      data: { status: 'CANCELLED' },
      include: {
        products: true,
        customer: true,
        createdBy: { select: { name: true, role: true } },
      },
    });

    res.json(updatedChallan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
