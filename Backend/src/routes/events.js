import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { sendEventCancellationNotification } from '../services/notificationService.js';

const router = express.Router();
const prisma = new PrismaClient();

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const events = await prisma.event.findMany({
      where: {
        status: 'active',
        ...(category ? { category } : {}),
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      },
      include: { pricingTiers: true, organizer: { select: { name: true } } },
      orderBy: { date: 'asc' },
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get organizer's own events — includes real revenue per event
router.get('/mine', authenticateToken, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { organizerId: req.user.id },
      include: {
        pricingTiers: true,
        _count: { select: { bookings: true } },
        bookings: {
          where: { status: 'confirmed' },
          select: { totalPrice: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Attach revenue to each event then strip raw bookings array
    const eventsWithRevenue = events.map(e => ({
      ...e,
      revenue: e.bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
      bookings: undefined, // don't send full bookings array to frontend
    }));

    res.json(eventsWithRevenue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single event (public)
router.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { pricingTiers: true, organizer: { select: { name: true } } },
    });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create event
router.post('/', authenticateToken, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { title, description, date, time, venue, type, category, capacity, pricingTiers } = req.body;
    const event = await prisma.event.create({
      data: {
        title, description, date: new Date(date), time,
        venue, type, category, capacity: Number(capacity),
        organizerId: req.user.id,
        pricingTiers: { create: pricingTiers || [] },
      },
      include: { pricingTiers: true },
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Edit event (ownership checked — duplicate old PUT removed)
router.put('/:id', authenticateToken, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { title, description, date, time, venue, category, capacity, pricingTiers } = req.body;

    const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Event not found' });
    if (existing.organizerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only edit your own events' });
    }

    const updated = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        date: date ? new Date(date) : undefined,
        time,
        venue,
        category,
        capacity: capacity ? Number(capacity) : undefined,
      },
      include: { pricingTiers: true },
    });

    if (pricingTiers && pricingTiers.length > 0) {
      await prisma.pricingTier.deleteMany({ where: { eventId: req.params.id } });
      await prisma.pricingTier.createMany({
        data: pricingTiers.map(t => ({ ...t, eventId: req.params.id })),
      });
    }

    return res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete event (notifies all confirmed attendees first)
router.delete('/:id', authenticateToken, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: {
          where: { status: 'confirmed' },
          include: {
            user: {
              select: { name: true, email: true, phone: true, notificationPreference: true },
            },
          },
        },
      },
    });

    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own events' });
    }

    for (const booking of event.bookings) {
      try {
        await sendEventCancellationNotification({ user: booking.user, event });
      } catch (notifErr) {
        console.error('[Notif Error]', notifErr.message);
      }
    }

    await prisma.booking.updateMany({
      where: { eventId: req.params.id },
      data: { status: 'cancelled' },
    });

    await prisma.pricingTier.deleteMany({ where: { eventId: req.params.id } });
    await prisma.event.delete({ where: { id: req.params.id } });

    return res.json({
      message: 'Event deleted and attendees notified',
      notified: event.bookings.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel event
router.put('/:id/cancel', authenticateToken, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
    });

    const bookings = await prisma.booking.findMany({
      where: { eventId: req.params.id, status: 'confirmed' },
      include: {
        user: {
          select: { name: true, email: true, phone: true, notificationPreference: true },
        },
      },
    });

    await prisma.booking.updateMany({
      where: { eventId: req.params.id, status: 'confirmed' },
      data: { status: 'cancelled' },
    });

    for (const booking of bookings) {
      try {
        await sendEventCancellationNotification({ user: booking.user, event });
      } catch (notifErr) {
        console.error('[Notif Error]', notifErr.message);
      }
    }

    res.json({ message: 'Event cancelled and attendees notified', notified: bookings.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;