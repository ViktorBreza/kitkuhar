import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:8000';
  
  try {
    const response = await axios({
      method: method as any,
      url: `${backendUrl}/recipes/`,
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