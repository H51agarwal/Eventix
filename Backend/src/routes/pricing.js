import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/suggest', authenticateToken, async (req, res) => {
  try {
    const { category, capacity, duration } = req.body;

    // Base prices by category
    const basePrices = {
      Tech: 1200, Music: 800, Business: 1500,
      Art: 400, Workshop: 600,
    };

    let base = basePrices[category] || 1000;

    // Adjust for capacity
    if (capacity > 300) base *= 1.2;
    else if (capacity < 50) base *= 0.8;

    // Adjust for duration
    if (duration > 6) base *= 1.15;

    base = Math.round(base);
    const earlyBird = Math.round(base * 0.8);
    const group = Math.round(base * 0.85);

    res.json({
      base,
      earlyBird,
      group,
      reasoning: `Based on: ${category} event · ${capacity} capacity · ${duration || '?'} hrs duration`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;