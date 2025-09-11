import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, url } = req;
  // In development: localhost:8000, in production: backend:8000
  const backendUrl = process.env.API_BASE_URL || 'http://backend:8000';
  
  try {
    // Forward the exact path to backend (keep /api prefix and add trailing slash)
    const backendPath = url?.replace(/\/$/, '') + '/' || '/api/tags/';
    
    const response = await axios({
      method: method as any,
      url: `${backendUrl}${backendPath}`,
      headers: req.headers,
      data: req.body,
    });
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}