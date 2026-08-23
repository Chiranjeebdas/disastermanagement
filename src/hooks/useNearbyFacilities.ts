import { useState, useEffect } from 'react';

interface Facility {
  id: number;
  type: 'hospital' | 'police' | 'fire' | 'shelter' | 'pharmacy';
  name: string;
  lat: number;
  lon: number;
  distance?: number;
  address?: string;
}

// Haversine formula to calculate distance in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

const getType = (tags: any): Facility['type'] => {
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic' || tags.amenity === 'doctors' || tags.healthcare === 'hospital' || tags.healthcare === 'clinic') {
    return 'hospital';
  }
  if (tags.amenity === 'police' || tags.building === 'police') {
    return 'police';
  }
  if (tags.amenity === 'fire_station') {
    return 'fire';
  }
  if (tags.amenity === 'pharmacy' || tags.shop === 'chemist' || tags.shop === 'medical' || tags.healthcare === 'pharmacy' || tags.shop === 'pharmaceutical') {
    return 'pharmacy';
  }
  return 'shelter';
};

const getAddress = (tags: any): string | undefined => {
  if (!tags) return undefined;
  if (tags['addr:full']) return tags['addr:full'];
  
  const parts = [];
  if (tags['addr:housename'] || tags['addr:housenumber']) {
    parts.push(tags['addr:housename'] || tags['addr:housenumber']);
  }
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:suburb']) parts.push(tags['addr:suburb']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  
  if (parts.length > 0) return parts.join(', ');
  return undefined;
};

const getCoords = (el: any): { lat: number; lon: number } | null => {
  if (typeof el.lat === 'number' && typeof el.lon === 'number') {
    return { lat: el.lat, lon: el.lon };
  }
  if (el.center && typeof el.center.lat === 'number' && typeof el.center.lon === 'number') {
    return { lat: el.center.lat, lon: el.center.lon };
  }
  return null;
};

export const useNearbyFacilities = (lat?: number, lon?: number, radiusKm: number = 10) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lat || !lon) return;

    setLoading(true);
    setError(null);

    const controller = new AbortController();

    const fetchFacilities = async () => {
      // Check sessionStorage cache first (fast, same-session)
      const cacheKey = `facilities_${lat}_${lon}_${radiusKm}`;
      const offlineCacheKey = `drishti_facilities_offline`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setFacilities(JSON.parse(cached));
        setLoading(false);
        return;
      }

      // If offline, try localStorage persistent cache
      if (!navigator.onLine) {
        try {
          const offlineCached = localStorage.getItem(offlineCacheKey);
          if (offlineCached) {
            setFacilities(JSON.parse(offlineCached));
            setLoading(false);
            return;
          }
        } catch {}
      }

      try {
        const radiusMeters = 30000; // Expanded to 30km to ensure facilities are found
        
        // Using `around` is much more accurate for user's live location than a bounding box
        const query = `[out:json][timeout:25];
(
  nwr["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
  nwr["amenity"="clinic"](around:${radiusMeters},${lat},${lon});
  nwr["healthcare"="hospital"](around:${radiusMeters},${lat},${lon});
  nwr["amenity"="police"](around:${radiusMeters},${lat},${lon});
  nwr["building"="police"](around:${radiusMeters},${lat},${lon});
  nwr["amenity"="fire_station"](around:${radiusMeters},${lat},${lon});
  nwr["amenity"="pharmacy"](around:${radiusMeters},${lat},${lon});
  nwr["healthcare"="pharmacy"](around:${radiusMeters},${lat},${lon});
  nwr["shop"="chemist"](around:${radiusMeters},${lat},${lon});
  nwr["amenity"="shelter"](around:${radiusMeters},${lat},${lon});
  nwr["emergency"="assembly_point"](around:${radiusMeters},${lat},${lon});
);
out center;`;

        // Multiple endpoints to ensure it works even if one is rate-limited
        const endpoints = [
          'https://overpass-api.de/api/interpreter',
          'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
        ];

        let response = null;
        for (const endpoint of endpoints) {
          try {
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: 'data=' + encodeURIComponent(query),
              signal: controller.signal
            });
            if (res.ok) {
              response = res;
              break;
            }
          } catch (err: any) {
            if (err.name === 'AbortError') throw err;
            // Continue to next endpoint
          }
        }

        if (!response) {
          throw new Error('Overpass API failed on all endpoints');
        }
        
        const data = await response.json();
        
        if (!data.elements || !Array.isArray(data.elements)) {
          throw new Error('Invalid API response structure');
        }

        const results: Facility[] = [];
        const seenIds = new Set<number>();

        for (const el of data.elements) {
          if (seenIds.has(el.id)) continue;
          seenIds.add(el.id);
          if (!el.tags) continue;

          const coords = getCoords(el);
          if (!coords) continue;
          if (isNaN(coords.lat) || isNaN(coords.lon)) continue;

          const type = getType(el.tags);
          const name = el.tags.name 
            || el.tags['name:en'] 
            || (type === 'hospital' ? 'Hospital' 
              : type === 'police' ? 'Police Station' 
              : type === 'fire' ? 'Fire Station' 
              : type === 'pharmacy' ? 'Medical Store' 
              : 'Shelter');

          results.push({
            id: el.id,
            type,
            name,
            lat: coords.lat,
            lon: coords.lon,
            distance: calculateDistance(lat, lon, coords.lat, coords.lon),
            address: getAddress(el.tags)
          });
        }

        results.sort((a, b) => (a.distance || 0) - (b.distance || 0));

        // Removed slow 100km fallback to prevent freezing the server
        setFacilities(results);
        sessionStorage.setItem(cacheKey, JSON.stringify(results));
        // Also persist to localStorage for offline use
        try {
          localStorage.setItem(offlineCacheKey, JSON.stringify(results));
        } catch {}
        setError(null);

      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Facilities fetch error:', err);
        setError('Could not load nearby facilities.');
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
    
    return () => {
      controller.abort();
    };
  }, [lat, lon, radiusKm]);

  return { facilities, loading, error };
};
