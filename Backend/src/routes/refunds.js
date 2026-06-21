import express from 'express';
import Razorpay from 'razorpay';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { sendRefundNotification } from '../services/notificationService.js';

const router = express.Router();
const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function calculateRefund(totalPrice, eventDate) {
  const now = new Date();
  const event = new Date(eventDate);
  const hoursUntilEvent = (event - now) / (1000 * 60 * 60);

  if (hoursUntilEvent <= 0) {
    return { percentage: 0, amount: 0, reason: 'Event has already started' };
  } else if (hoursUntilEvent < 24) {
    return { percentage: 25, amount: Math.round(totalPrice * 0.25), reason: 'Within 24 hours of event' };
  } else if (hoursUntilEvent < 168) {
    return { percentage: 50, amount: Math.round(totalPrice * 0.50), reason: 'Within 1 week of event' };
  } else {
    return { percentage: 75, amount: Math.round(totalPrice * 0.75), reason: 'More than 1 week before event' };
  }
}

// Get refund preview
router.get('/preview/:bookingId', authenticateToken, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: { event: true },
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId !== req.user.id) return res.status(403).json({ message: 'Not your booking' });
    if (booking.status !== 'confirmed') return res.status(400).json({ message: 'Booking already cancelled' });

    const refund = calculateRefund(booking.totalPrice, booking.event.date);
    res.json({ ...refund, totalPaid: booking.totalPrice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Process refund
router.post('/cancel/:bookingId', authenticateToken, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: { event: true, user: true },
    });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId !== req.user.id) return res.status(403).json({ message: 'Not your booking' });
    if (booking.status !== 'confirmed') return res.status(400).json({ message: 'Booking already cancelled' });

    const refund = calculateRefund(booking.totalPrice, booking.event.date);

    // Process Razorpay refund if amount > 0
    if (refund.amount > 0 && booking.paymentId) {
      try {
        await razorpay.payments.refund(booking.paymentId, {
          amount: refund.amount * 100, // paise
          notes: {
            reason: refund.reason,
            bookingId: booking.id,
          },
        });
      } catch (razorpayErr) {
        console.error('[Razorpay Refund Error]', razorpayErr.message);
      }
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'cancelled' },
    });

    // Send notification
    try {
      await sendRefundNotification({
        user: booking.user,
        event: booking.event,
        refundAmount: refund.amount,
        refundPercentage: refund.percentage,
        policyLabel: refund.reason,
      });
    } catch (notifErr) {
      console.error('[Refund Notif Error]', notifErr.message);
    }

    res.json({
      success: true,
      refundAmount: refund.amount,
      refundPercentage: refund.percentage,
      reason: refund.reason,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;