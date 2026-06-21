import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { sendEventCancellationNotification } from '../services/notificationService.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalBookings,
      revenueResult,
      usersByRole,
      eventsByCategory,
      eventsByCity,
      recentBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { totalAmount: true },
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      prisma.event.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 6,
      }),
      prisma.event.groupBy({
        by: ['city'],
        _count: { city: true },
        orderBy: { _count: { city: 'desc' } },
        take: 6,
      }),
      prisma.booking.findMany({
        where: { status: 'CONFIRMED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
          event: { select: { title: true } },
        },
      }),
    ]);

    const topOrganizers = await prisma.user.findMany({
      where: { role: 'organizer' },
      include: {
        events: {
          include: {
            bookings: {
              where: { status: 'CONFIRMED' },
              select: { totalAmount: true },
            },
          },
        },
      },
      take: 5,
    });

    const organizerStats = topOrganizers
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        totalEvents: u.events.length,
        totalRevenue: u.events.reduce(
          (sum, e) => sum + e.bookings.reduce((s, b) => s + b.totalAmount, 0),
          0
        ),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return res.json({
      totalUsers,
      totalEvents,
      totalBookings,
      totalRevenue: revenueResult._sum.totalAmount ?? 0,
      usersByRole,
      eventsByCategory,
      eventsByCity,
      recentBookings,
      topOrganizers: organizerStats,
    });
  } catch (err) {
    console.error('[Admin Stats Error]', err);
    return res.status(500).json({ error: 'Failed to load stats', detail: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { search = '', role = '' } = req.query;

    const users = await prisma.user.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          role ? { role } : {},
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        createdAt: true,
        _count: { select: { bookings: true, events: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(users);
  } catch (err) {
    console.error('[Admin Users Error]', err);
    return res.status(500).json({ error: 'Failed to load users', detail: err.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { banned, role } = req.body;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot modify your own account' });
    }

    const updateData = {};
    if (typeof banned === 'boolean') updateData.banned = banned;
    if (role) updateData.role = role;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, banned: true },
    });

    return res.json(updated);
  } catch (err) {
    console.error('[Admin Update User Error]', err);
    return res.status(500).json({ error: 'Failed to update user', detail: err.message });
  }
});

router.get('/events', async (req, res) => {
  try {
    const { status = '', search = '' } = req.query;

    const events = await prisma.event.findMany({
      where: {
        AND: [
          status ? { status } : {},
          search ? { title: { contains: search, mode: 'insensitive' } } : {},
        ],
      },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(events);
  } catch (err) {
    console.error('[Admin Events Error]', err);
    return res.status(500).json({ error: 'Failed to load events', detail: err.message });
  }
});

router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: 'CONFIRMED' },
          include: {
            user: { select: { name: true, email: true, phone: true, notificationPreference: true } },
          },
        },
      },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    for (const booking of event.bookings) {
      try {
        await sendEventCancellationNotification({ user: booking.user, event });
      } catch (notifErr) {
        console.error('[Notif Error]', notifErr.message);
      }
    }

    await prisma.booking.deleteMany({ where: { eventId: id } });
    await prisma.event.delete({ where: { id } });

    return res.json({ message: 'Event deleted and attendees notified' });
  } catch (err) {
    console.error('[Admin Delete Event Error]', err);
    return res.status(500).json({ error: 'Failed to delete event', detail: err.message });
  }
});

router.patch('/events/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: 'CONFIRMED' },
          include: {
            user: { select: { name: true, email: true, phone: true, notificationPreference: true } },
          },
        },
      },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Event is already cancelled' });
    }

    await prisma.event.update({ where: { id }, data: { status: 'CANCELLED' } });

    for (const booking of event.bookings) {
      try {
        await sendEventCancellationNotification({ user: booking.user, event });
      } catch (notifErr) {
        console.error('[Notif Error]', notifErr.message);
      }
    }

    return res.json({ message: 'Event cancelled and attendees notified' });
  } catch (err) {
    console.error('[Admin Cancel Event Error]', err);
    return res.status(500).json({ error: 'Failed to cancel event', detail: err.message });
  }
});

router.get('/organizers', async (req, res) => {
  try {
    const organizers = await prisma.user.findMany({
      where: { role: 'organizer' },
      include: {
        events: {
          include: {
            bookings: {
              where: { status: 'CONFIRMED' },
              select: { totalAmount: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = organizers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      banned: u.banned,
      createdAt: u.createdAt,
      totalEvents: u.events.length,
      totalRevenue: u.events.reduce(
        (sum, e) => sum + e.bookings.reduce((s, b) => s + b.totalAmount, 0),
        0
      ),
      totalBookings: u.events.reduce((sum, e) => sum + e.bookings.length, 0),
    }));

    return res.json(result);
  } catch (err) {
    console.error('[Admin Organizers Error]', err);
    return res.status(500).json({ error: 'Failed to load organizers', detail: err.message });
  }
});

router.patch('/organizers/:id/revoke', async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await prisma.user.update({
      where: { id },
      data: { role: 'attendee' },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.json({ message: 'Organizer role revoked', user: updated });
  } catch (err) {
    console.error('[Admin Revoke Organizer Error]', err);
    return res.status(500).json({ error: 'Failed to revoke organizer', detail: err.message });
  }
});

export default router;