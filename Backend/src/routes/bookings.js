import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Create booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { eventId, quantity, tierLabel, totalPrice } = req.body;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const totalBooked = await prisma.booking.aggregate({
      where: { eventId, status: 'confirmed' },
      _sum: { quantity: true },
    });
    const bookedSoFar = totalBooked._sum.quantity || 0;
    if (bookedSoFar + quantity > event.capacity) {
      return res.status(400).json({ message: 'Not enough spots available' });
    }

    const booking = await prisma.booking.create({
      data: {
        quantity,
        totalPrice,
        tierLabel,
        userId: req.user.id,
        eventId,
      },
      include: { event: true },
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my bookings
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: { event: { include: { pricingTiers: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get bookings for an event (organizer only)
router.get('/event/:eventId', authenticateToken, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { eventId: req.params.eventId },
      include: { user: { select: { name: true, email: true } } },
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;