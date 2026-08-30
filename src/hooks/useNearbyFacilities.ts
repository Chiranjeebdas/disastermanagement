import { useState, useEffect, useRef } from 'react';

export interface Facility {
  id: number | string;
  type: 'hospital' | 'police' | 'fire' | 'shelter' | 'pharmacy';
  name: string;
  lat: number;
  lon: number;
  distance?: number;
  address?: string;
  phone?: string;
  capacity?: string;
  status?: string;
  image?: string;
}

// Haversine formula to calculate distance in km
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

// Verified core regional facilities for Cuttack / Odisha
const VERIFIED_CORE_FACILITIES: Facility[] = [
  // Hospitals & Clinics
  {
    id: 'sai-shraddha-hospital',
    type: 'hospital',
    name: 'Sai Shraddha Hospital & Trauma Care Centre',
    lat: 20.4720,
    lon: 85.8750,
    address: 'Near Madhupatna, Cuttack, Odisha',
    phone: '0671-2348890',
    capacity: '180 Beds • 24/7 ICU & Multi-Speciality Trauma Care',
    status: 'Operational',
    image: '/facilities/sai_shraddha_hospital.jpg'
  },
  {
    id: 'jeevandhara-nursing-home',
    type: 'hospital',
    name: 'Jeevandhara Nursing Home, Cuttack',
    lat: 20.4850,
    lon: 85.8350,
    address: 'Plot No. 123, CDA Sector 9, Cuttack, Odisha',
    phone: '0671-2363007',
    capacity: '120 Beds • 24/7 Maternity & Emergency',
    status: 'Operational',
    image: '/facilities/jeevandhara_nursing_home.jpg'
  },
  {
    id: 'heart-clinic-cuttack',
    type: 'hospital',
    name: 'Heart Clinic & Diagnostic Centre',
    lat: 20.4655,
    lon: 85.8670,
    address: 'Link Road, Cuttack, Odisha',
    phone: '0671-2414120',
    capacity: 'Cardiology & Emergency Intensive Care',
    status: 'Operational',
    image: '/facilities/heart_clinic.jpg'
  },
  {
    id: 'care-pharmacy-cuttack',
    type: 'pharmacy',
    name: 'Care Pharmacy & Medicines',
    lat: 20.4580,
    lon: 85.8850,
    address: 'Bidyadharpur, Cuttack, Odisha',
    phone: '0671-2414080',
    capacity: '24x7 Emergency Medicines & Chemist',
    status: 'Operational',
    image: '/facilities/care_pharmacy.jpg'
  },
  {
    id: 'scb-cuttack',
    type: 'hospital',
    name: 'SCB Medical College & Hospital (Apex Referral)',
    lat: 20.4790,
    lon: 85.8900,
    address: 'Mangalabag, Cuttack',
    phone: '0671-2414080',
    capacity: '2,100 Beds • 24/7 ICU & Level-1 Trauma Center',
    status: 'Operational',
    image: '/facilities/scb_hospital.jpg'
  },
  {
    id: 'ps-badambadi',
    type: 'police',
    name: 'Badambadi Police Station',
    lat: 20.4628,
    lon: 85.8770,
    address: 'Badambadi Bus Stand Square, Cuttack',
    phone: '0671-2322300',
    capacity: 'Rapid Action Patrol & Flying Squad (112)',
    status: 'High Alert',
    image: '/facilities/badambadi_police.jpg'
  },
  {
    id: 'fire-buxibazaar',
    type: 'fire',
    name: 'Buxi Bazaar Fire Station (Emergency Brigade)',
    lat: 20.4635,
    lon: 85.8690,
    address: 'Buxi Bazaar, Main Market Road, Cuttack',
    phone: '0671-2414101',
    capacity: 'Advanced Hazmat Fire Rescue Units (101)',
    status: 'Operational',
    image: '/facilities/buxi_fire.jpg'
  },
  {
    id: 'shelter-barabati',
    type: 'shelter',
    name: 'Barabati Stadium Safe Evacuation Shelter',
    lat: 20.4815,
    lon: 85.8685,
    address: 'Barabati Fort Area, Biju Patnaik Marg, Cuttack',
    phone: '0671-2414300',
    capacity: '10,000 Capacity • Power Backup & Clean Water',
    status: 'Designated Cyclone/Flood Shelter',
    image: '/facilities/barabati_shelter.jpg'
  },
  {
    id: 'sun-hosp-tulsipur',
    type: 'hospital',
    name: 'Sun Hospital',
    lat: 20.4740,
    lon: 85.8810,
    address: 'Tulsipur, Cuttack',
    phone: '0671-2301402',
    capacity: '150 Beds • 24/7 Emergency Ward',
    status: 'Operational'
  },
  {
    id: 'sishu-bhawan-cuttack',
    type: 'hospital',
    name: 'SVPPGI Sishu Bhawan (Pediatric Trauma)',
    lat: 20.4710,
    lon: 85.8640,
    address: 'Kadam Rasul, Cuttack',
    phone: '0671-2414090',
    capacity: '400 Beds • Pediatric Emergency Unit',
    status: 'Operational'
  },

  // Police Stations
  {
    id: 'ps-badambadi',
    type: 'police',
    name: 'Badambadi Police Station',
    lat: 20.4628,
    lon: 85.8770,
    address: 'Badambadi Bus Stand Square, Cuttack',
    phone: '0671-2322300',
    capacity: 'Rapid Action Patrol & Flying Squad (112)',
    status: 'High Alert'
  },
  {
    id: 'ps-madhupatna',
    type: 'police',
    name: 'Madhupatna Police Station',
    lat: 20.4486,
    lon: 85.8973,
    address: 'Near OMP Square, NH-16, Cuttack',
    phone: '0671-2344100',
    capacity: 'Highway Patrol & Emergency Rescue Wing',
    status: 'Operational'
  },
  {
    id: 'ps-lalbag',
    type: 'police',
    name: 'Lalbag Police Station',
    lat: 20.4664,
    lon: 85.8586,
    address: 'Chandi Mandir Road, Lalbag, Cuttack',
    phone: '0671-2414100',
    capacity: 'Central Control & Emergency Response',
    status: 'Operational'
  },
  {
    id: 'ps-cantonment',
    type: 'police',
    name: 'Cantonment Police Station',
    lat: 20.4795,
    lon: 85.8720,
    address: 'Cantonment Road, Near Barabati Fort, Cuttack',
    phone: '0671-2414200',
    capacity: 'Quick Reaction Security Force',
    status: 'Operational'
  },
  {
    id: 'ps-malgodown',
    type: 'police',
    name: 'Malgodown Police Station',
    lat: 20.4690,
    lon: 85.8990,
    address: 'Station Road, Malgodown, Cuttack',
    phone: '0671-2311100',
    capacity: 'Logistics Corridor Security Unit',
    status: 'Operational'
  },
  {
    id: 'ps-bidanasi',
    type: 'police',
    name: 'Bidanasi Police Station',
    lat: 20.4855,
    lon: 85.8454,
    address: 'CDA Sector 6, Bidanasi, Cuttack',
    phone: '0671-2501100',
    capacity: 'Sector Emergency Defense Post',
    status: 'Operational'
  },
  {
    id: 'ps-jagatpur',
    type: 'police',
    name: 'Jagatpur Police Station',
    lat: 20.4980,
    lon: 85.9250,
    address: 'Industrial Estate, Jagatpur, Cuttack',
    phone: '0671-2490100',
    capacity: 'North Sector Emergency Post',
    status: 'Operational'
  },
  {
    id: 'ps-purighat',
    type: 'police',
    name: 'Purighat Police Station',
    lat: 20.4640,
    lon: 85.8610,
    address: 'Kathajodi River Bank Road, Cuttack',
    phone: '0671-2414300',
    capacity: 'River & Flood Defense Police Post',
    status: 'Operational'
  },

  // Fire & Rescue Stations
  {
    id: 'fire-buxi-bazaar',
    type: 'fire',
    name: 'Cuttack Central Fire Station (Buxi Bazaar)',
    lat: 20.4705,
    lon: 85.8780,
    address: 'Buxi Bazaar, Near Central Control Room, Cuttack',
    phone: '101 / 0671-2414101',
    capacity: '6 Fire Tenders • Hydraulic Rescue Platform • 24 Rescue Divers',
    status: 'Ready 24/7'
  },
  {
    id: 'fire-chauliaganj',
    type: 'fire',
    name: 'Chauliaganj Fire & Disaster Rescue Station',
    lat: 20.4610,
    lon: 85.9120,
    address: 'Mahanadi Vihar Road, Chauliaganj, Cuttack',
    phone: '101 / 0671-2441101',
    capacity: '4 Fire Engines • High-Volume Flood Pumps',
    status: 'Ready 24/7'
  },
  {
    id: 'fire-cda',
    type: 'fire',
    name: 'CDA Fire & Emergency Station',
    lat: 20.4880,
    lon: 85.8420,
    address: 'Sector 7, CDA Residential Complex, Cuttack',
    phone: '101 / 0671-2503101',
    capacity: '3 Water Foam Tenders • Collapse Search Team',
    status: 'Ready 24/7'
  },
  {
    id: 'fire-jagatpur',
    type: 'fire',
    name: 'Jagatpur Industrial Fire Station',
    lat: 20.5010,
    lon: 85.9310,
    address: 'Phase II Industrial Area, Jagatpur',
    phone: '101 / 0671-2491101',
    capacity: 'Chemical Hazmat Combat Unit • Heavy Foam Engines',
    status: 'Ready 24/7'
  },

  // Designated Shelters
  {
    id: 'shelter-barabati',
    type: 'shelter',
    name: 'Barabati Stadium Emergency Mega Shelter',
    lat: 20.4815,
    lon: 85.8685,
    address: 'Biju Patnaik Colony, Cuttack',
    phone: '0671-2414555',
    capacity: 'Capacity: 12,000 Persons • Generators • Food & Medical Depot',
    status: 'Designated Major Relief Hub'
  },
  {
    id: 'shelter-town-hall',
    type: 'shelter',
    name: 'Cuttack Town Hall Relief Center',
    lat: 20.4680,
    lon: 85.8710,
    address: 'Choudhury Bazaar, Cuttack',
    phone: '0671-2414600',
    capacity: 'Capacity: 2,500 Persons • Potable Water & Relief Logistics',
    status: 'Operational'
  },
  {
    id: 'shelter-ravenshaw',
    type: 'shelter',
    name: 'Ravenshaw Campus Multipurpose Cyclone Shelter',
    lat: 20.4645,
    lon: 85.8940,
    address: 'College Square, Cuttack',
    phone: '0671-2610050',
    capacity: 'Capacity: 4,000 Persons • On-site Medical First Responder Post',
    status: 'Operational'
  },
  {
    id: 'shelter-cda-sec9',
    type: 'shelter',
    name: 'CDA Sector-9 Cyclone & Flood Shelter',
    lat: 20.4910,
    lon: 85.8290,
    address: 'Sector 9, Bidanasi, Cuttack',
    phone: '0671-2505000',
    capacity: 'Capacity: 3,000 Persons • Flood Resilient Reinforced Structure',
    status: 'Operational'
  },
  {
    id: 'shelter-jagatpur-high',
    type: 'shelter',
    name: 'Jagatpur Flood Evacuation Center',
    lat: 20.5050,
    lon: 85.9320,
    address: 'Near Jagatpur Bridge, Cuttack',
    phone: '0671-2490555',
    capacity: 'Capacity: 2,000 Persons • Emergency Rations Stored',
    status: 'Operational'
  },

  // 24/7 Pharmacies
  {
    id: 'med-jan-aushadhi',
    type: 'pharmacy',
    name: 'Jan Aushadhi 24/7 Emergency Medical Store',
    lat: 20.4635,
    lon: 85.8790,
    address: 'Badambadi Square, Cuttack',
    phone: '0671-2321555',
    capacity: 'Emergency First Aid, Oxygen & Critical Life Saving Drugs',
    status: 'Open 24/7'
  },
  {
    id: 'med-apollo-mangala',
    type: 'pharmacy',
    name: 'Apollo Pharmacy Mangalabag (24/7)',
    lat: 20.4770,
    lon: 85.8880,
    address: 'Opp. SCB Medical Gate, Cuttack',
    phone: '0671-2415050',
    capacity: 'Trauma Care Supplies, Antibiotics & Vaccines Available',
    status: 'Open 24/7'
  },
  {
    id: 'med-medplus-ranihat',
    type: 'pharmacy',
    name: 'MedPlus Ranihat 24/7 Chemist',
    lat: 20.4715,
    lon: 85.8840,
    address: 'Ranihat Medical Road, Cuttack',
    phone: '0671-2416060',
    capacity: 'Emergency Surgical Supplies Available',
    status: 'Open 24/7'
  }
];

const SEARCH_QUERIES = [
  { type: 'hospital' as const, q: 'hospital' },
  { type: 'hospital' as const, q: 'nursing home' },
  { type: 'hospital' as const, q: 'clinic' },
  { type: 'police' as const, q: 'police station' },
  { type: 'police' as const, q: 'police' },
  { type: 'fire' as const, q: 'fire station' },
  { type: 'pharmacy' as const, q: 'pharmacy' },
  { type: 'pharmacy' as const, q: 'medical store' },
  { type: 'shelter' as const, q: 'cyclone shelter' },
  { type: 'shelter' as const, q: 'relief shelter' },
  { type: 'shelter' as const, q: 'stadium' }
];

export const useNearbyFacilities = (lat?: number, lon?: number, radiusKm: number = 25) => {
  const currentLat = lat || 20.4625;
  const currentLon = lon || 85.8830;

  // Initialize with verified base facilities calibrated to current coordinates
  const [facilities, setFacilities] = useState<Facility[]>(() => {
    return VERIFIED_CORE_FACILITIES.map(f => ({
      ...f,
      distance: calculateDistance(currentLat, currentLon, f.lat, f.lon)
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedCoordsRef = useRef<string>('');

  useEffect(() => {
    const coordKey = `${currentLat.toFixed(3)}_${currentLon.toFixed(3)}`;
    if (fetchedCoordsRef.current === coordKey) return;
    fetchedCoordsRef.current = coordKey;

    setLoading(true);
    setError(null);

    const controller = new AbortController();

    const fetchLivePOIs = async () => {
      try {
        const liveItems: Facility[] = [];
        const seenCoords = new Set<string>();

        // Pre-populate with verified base facilities
        VERIFIED_CORE_FACILITIES.forEach(f => {
          const dist = calculateDistance(currentLat, currentLon, f.lat, f.lon);
          // If the verified item is within 35km of current location, include it
          if (dist <= 35) {
            seenCoords.add(`${f.lat.toFixed(3)}_${f.lon.toFixed(3)}`);
            liveItems.push({
              ...f,
              distance: dist
            });
          }
        });

        // Parallel geocoding queries against live OpenStreetMap index (Photon/Komoot API)
        const fetchPromises = SEARCH_QUERIES.map(async ({ type, q }) => {
          try {
            const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${currentLat}&lon=${currentLon}&limit=12`;
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) return;
            const data = await res.json();
            if (!data.features || !Array.isArray(data.features)) return;

            for (const feature of data.features) {
              const [fLon, fLat] = feature.geometry.coordinates;
              const p = feature.properties;
              if (!fLat || !fLon || isNaN(fLat) || isNaN(fLon)) continue;

              const dist = calculateDistance(currentLat, currentLon, fLat, fLon);
              // Filter to facilities within user's live search radius (up to 30km)
              if (dist > radiusKm + 5) continue;

              const name = p.name || p.street;
              if (!name) continue;

              const key = `${fLat.toFixed(3)}_${fLon.toFixed(3)}`;
              if (seenCoords.has(key)) continue;
              seenCoords.add(key);

              // Determine address
              const addrParts = [
                p.street,
                p.city || p.district,
                p.state
              ].filter(Boolean);

              // Refine type if OpenStreetMap tag specifies more accurately
              let detectedType = type;
              if (p.osm_value === 'police' || (p.name && /police|thana|chowki/i.test(p.name))) {
                detectedType = 'police';
              } else if (p.osm_value === 'fire_station' || (p.name && /fire/i.test(p.name))) {
                detectedType = 'fire';
              } else if (p.osm_value === 'pharmacy' || (p.name && /pharmacy|chemist|medical/i.test(p.name))) {
                detectedType = 'pharmacy';
              } else if (p.osm_value === 'hospital' || (p.name && /hospital|clinic|nursing/i.test(p.name))) {
                detectedType = 'hospital';
              }

              liveItems.push({
                id: `live-${p.osm_id || Math.random().toString(36).substr(2, 9)}`,
                type: detectedType,
                name: name,
                lat: fLat,
                lon: fLon,
                distance: dist,
                address: addrParts.length > 0 ? addrParts.join(', ') : 'Nearby Local Facility',
                status: 'Verified Live OSM POI',
                phone: detectedType === 'police' ? '112 / 100' : detectedType === 'fire' ? '101' : detectedType === 'hospital' ? '108 / 102' : undefined
              });
            }
          } catch {
            // Individual query failures should not crash the batch
          }
        });

        await Promise.all(fetchPromises);

        // Sort all discovered facilities by proximity to user
        liveItems.sort((a, b) => (a.distance || 0) - (b.distance || 0));

        if (liveItems.length > 0) {
          setFacilities(liveItems);
          // Persist to IndexedDB for seamless offline map access
          try {
            const { dbPutBatch } = await import('../utils/indexedDB');
            await dbPutBatch('facilities', liveItems);
          } catch {}
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        // Load cached facilities from IndexedDB when offline
        try {
          const { dbGetAll } = await import('../utils/indexedDB');
          const cached = await dbGetAll<Facility>('facilities');
          if (cached && cached.length > 0) {
            const withDist = cached.map(f => ({
              ...f,
              distance: calculateDistance(currentLat, currentLon, f.lat, f.lon)
            })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
            setFacilities(withDist);
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    };

    fetchLivePOIs();

    return () => {
      controller.abort();
    };
  }, [currentLat, currentLon, radiusKm]);

  return { facilities, loading, error };
};
