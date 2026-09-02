import { useState, useEffect } from 'react';

interface LocationState {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  status: 'granting' | 'granted' | 'denied' | 'unavailable' | 'prompt';
  address?: string | null;
  lastUpdated: Date | null;
  error: string | null;
}

export const useLocation = () => {
  // Try loading cached location on init
  const getInitialState = (): LocationState => {
    try {
      const cached = localStorage.getItem('drishti_location');
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          coords: parsed.coords,
          status: 'granted',
          address: parsed.address || null,
          lastUpdated: parsed.timestamp ? new Date(parsed.timestamp) : null,
          error: null,
        };
      }
    } catch {}
    return {
      coords: null,
      status: 'prompt',
      lastUpdated: null,
      error: null,
    };
  };

  const [location, setLocation] = useState<LocationState>(getInitialState());

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, status: 'unavailable', error: 'Geolocation is not supported by your browser' }));
      return;
    }

    setLocation(prev => ({ ...prev, status: 'granting', error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        let addressName: string | null = null;

        // Strategy 1: BigDataCloud Client Reverse Geocoder (High speed, CORS friendly)
        try {
          const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
          if (bdcRes.ok) {
            const bdcData = await bdcRes.json();
            const parts = [
              bdcData.locality || bdcData.city,
              bdcData.principalSubdivision || bdcData.countryName
            ].filter(Boolean);
            if (parts.length > 0) {
              addressName = parts.join(', ');
            }
          }
        } catch {}

        // Strategy 2: OpenStreetMap Nominatim Geocoder if Strategy 1 didn't return a name
        if (!addressName) {
          try {
            const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`);
            if (osmRes.ok) {
              const data = await osmRes.json();
              if (data.address) {
                const parts = [
                  data.address.suburb || data.address.neighbourhood || data.address.road || data.address.village,
                  data.address.city || data.address.town || data.address.county,
                  data.address.state
                ].filter(Boolean);
                const uniqueParts = parts.filter((val, idx, arr) => idx === 0 || val !== arr[idx - 1]);
                if (uniqueParts.length > 0) {
                  addressName = uniqueParts.join(', ');
                }
              }
              if (!addressName && data.display_name) {
                addressName = data.display_name.split(',').slice(0, 2).join(', ');
              }
            }
          } catch {}
        }

        // Strategy 3: Coordinates fallback if geocoders fail
        if (!addressName) {
          addressName = `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`;
        }

        const newState: LocationState = {
          coords: {
            latitude: lat,
            longitude: lon,
            accuracy: position.coords.accuracy,
          },
          address: addressName,
          status: 'granted',
          lastUpdated: new Date(),
          error: null,
        };

        // Cache for offline use
        try {
          localStorage.setItem('drishti_location', JSON.stringify({
            coords: newState.coords,
            address: newState.address,
            timestamp: Date.now(),
          }));
        } catch {}

        setLocation(newState);
      },
      (error) => {
        let errorMsg = 'An unknown error occurred.';
        let newStatus: LocationState['status'] = 'unavailable';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'User denied the request for Geolocation.';
            newStatus = 'denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable.';
            newStatus = 'unavailable';
            break;
          case error.TIMEOUT:
            errorMsg = 'The request to get user location timed out.';
            newStatus = 'unavailable';
            break;
        }
        // If offline and we have cached location, keep using it
        if (!navigator.onLine && location.coords) {
          return;
        }
        setLocation(prev => ({ ...prev, status: newStatus, error: errorMsg, address: null }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // Force absolutely fresh, un-cached location
      }
    );
  };

  useEffect(() => {
    // If we have cached coords, don't block — still try refreshing in background
    if (location.coords && navigator.onLine) {
      requestLocation();
    } else if (!location.coords) {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { location, requestLocation };
};
