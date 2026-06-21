import express from 'express';

const router = express.Router();

const CITY_MAP = {
  Mumbai: 'Mumbai, Maharashtra, India',
  Delhi: 'New Delhi, Delhi, India',
  Bangalore: 'Bangalore, Karnataka, India',
  Hyderabad: 'Hyderabad, Telangana, India',
  Chennai: 'Chennai, Tamil Nadu, India',
  Pune: 'Pune, Maharashtra, India',
  Kolkata: 'Kolkata, West Bengal, India',
  Ahmedabad: 'Ahmedabad, Gujarat, India',
  Jaipur: 'Jaipur, Rajasthan, India',
  Goa: 'Goa, India',
};

router.get('/', async (req, res) => {
  try {
    const { city = 'Mumbai', category = '' } = req.query;
    const location = CITY_MAP[city] || `${city}, India`;
    const query = category && category !== 'All'
      ? `${category} events in ${city}`
      : `upcoming events in ${city}`;

    const apiKey = process.env.SERPAPI_KEY;
    const params = new URLSearchParams({
      engine: 'google_events',
      q: query,
      location: location,
      hl: 'en',
      gl: 'in',
      api_key: apiKey,
    });

    const response = await fetch(`https://serpapi.com/search?${params}`);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ message: data.error });
    }

    const events = (data.events_results || []).map(e => ({
      id: `serp_${Math.random().toString(36).substr(2, 9)}`,
      title: e.title,
      description: e.description || '',
      date: e.date?.start_date || e.date?.when || '',
      time: e.date?.when || '',
      venue: e.venue?.name || e.address?.[0] || location,
      address: e.address?.join(', ') || '',
      city: city,
      category: category || 'General',
      price: e.ticket_info?.[0]?.price || 'See details',
      link: e.link || '',
      thumbnail: e.thumbnail || '',
      source: 'google',
      isExternal: true,
    }));

    res.set('Cache-Control', 'no-store');
    res.json(events);
  } catch (err) {
    console.error('SerpApi error:', err.message);
    res.status(500).json({ message: 'Failed to fetch events', error: err.message });
  }
});

export default router;