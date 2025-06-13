import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

/**
 * Fetches all samples from the Supabase 'samples' table.
 * Returns full list without any filters or ordering.
 */
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('samples').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
