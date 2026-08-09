import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/db';

// Interface to type req.user if added by protect middleware
interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(users);
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (role === 'ADMIN') {
      const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (adminExists) {
        return res.status(400).json({ message: 'An Admin account already exists. Only one Admin is allowed.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const userToUpdate = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Email duplicate check
    if (email && email !== userToUpdate.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }
    }

    // Role checks
    if (role && role !== userToUpdate.role) {
      // If promoting to ADMIN, check if an admin already exists
      if (role === 'ADMIN') {
        const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (adminExists) {
          return res.status(400).json({ message: 'An Admin account already exists. Only one Admin is allowed.' });
        }
      }
      
      // If demoting an ADMIN, ensure we don't leave the system without admins
      if (userToUpdate.role === 'ADMIN' && role !== 'ADMIN') {
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
          return res.status(400).json({ message: 'Cannot demote the only Admin account.' });
        }
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    if (currentUserId === Number(id)) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }

    const userToDelete = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Integrity constraint check: check if user has created Challans or StockLogs
    const challanCount = await prisma.challan.count({ where: { createdById: Number(id) } });
    const stockLogCount = await prisma.stockLog.count({ where: { createdById: Number(id) } });

    if (challanCount > 0 || stockLogCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete user because they have created challans or stock logs. You can change their role or credentials to deactivate/modify access instead.'
      });
    }

    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
