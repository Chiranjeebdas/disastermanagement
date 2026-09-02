// Serverless API Proxy for NASA FIRMS (Vercel / Edge Deployment)
export default async function handler(req: any, res: any) {
  const firmsKey = process.env.FIRMS_MAP_KEY || process.env.VITE_FIRMS_MAP_KEY;
  if (!firmsKey) {
    return res.status(500).json({ error: 'FIRMS_MAP_KEY environment variable is not configured.' });
  }

  const { bbox, days = '1' } = req.query;
  if (!bbox) {
    return res.status(400).json({ error: 'Missing bbox query parameter (minLon,minLat,maxLon,maxLat).' });
  }

  try {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${firmsKey}/VIIRS_SNPP_NRT/${bbox}/${days}`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: `NASA FIRMS returned status ${response.status}` });
    }
    const csv = await response.text();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    return res.status(200).send(csv);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal proxy error' });
  }
}
