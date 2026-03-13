import { connectToDatabase } from '../backend/config/db.js';
import { createScan, listScans } from '../backend/controllers/scanController.js';

export default async function handler(req, res) {
  try {
    await connectToDatabase();

    if (req.method === 'POST') {
      return await createScan(req, res);
    }

    if (req.method === 'GET') {
      return await listScans(req, res);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('MongoDB API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
