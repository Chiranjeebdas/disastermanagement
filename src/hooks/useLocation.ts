import { useState, useEffect } from 'react';
import { getOfflineReverseGeocode } from '../utils/offlineData';

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
          address: parsed.address || (parsed.coords ? getOfflineReverseGeocode(parsed.coords.latitude, parsed.coords.longitude) : 'Khapuria Industrial Estate, Cuttack'),
          lastUpdated: parsed.timestamp ? new Date(parsed.timestamp) : null,
          error: null,
        };
      }
    } catch {}
    return {
      coords: { latitude: 20.4625, longitude: 85.8828, accuracy: 15 },
      status: 'granted',
      address: 'Khapuria Industrial Estate, Cuttack, Odisha',
      lastUpdated: new Date(),
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
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const offlineAddress = getOfflineReverseGeocode(lat, lon);
        
        // If offline, use offline reverse geocode directly
        if (!navigator.onLine) {
          const newState: LocationState = {
            coords: {
              latitude: lat,
              longitude: lon,
              accuracy: position.coords.accuracy,
            },
            address: offlineAddress,
            status: 'granted',
            lastUpdated: new Date(),
            error: null,
          };
          try {
            localStorage.setItem('drishti_location', JSON.stringify({
              coords: newState.coords,
              address: newState.address,
              timestamp: Date.now(),
            }));
          } catch {}
          setLocation(newState);
          return;
        }

        // Fetch reverse geocode address with fallback
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`, {
          signal: AbortSignal.timeout(4000)
        })
          .then(res => res.json())
          .then(data => {
            let addressName = data.display_name;
            if (data.address) {
              const parts = [
                data.address.road || data.address.pedestrian,
                data.address.neighbourhood || data.address.suburb || data.address.residential || data.address.village,
                data.address.city_district,
                data.address.city || data.address.town || data.address.county
              ].filter(Boolean);
              
              const uniqueParts = parts.filter((val, idx, arr) => idx === 0 || val !== arr[idx - 1]);
              
              if (uniqueParts.length > 0) {
                addressName = uniqueParts.join(', ');
              } else if (data.display_name) {
                 addressName = data.display_name.split(',').slice(0, 3).join(', ');
              }
            }
            
            const newState: LocationState = {
              coords: {
                latitude: lat,
                longitude: lon,
                accuracy: position.coords.accuracy,
              },
              address: addressName || offlineAddress,
              status: 'granted',
              lastUpdated: new Date(),
              error: null,
            };

            try {
              localStorage.setItem('drishti_location', JSON.stringify({
                coords: newState.coords,
                address: newState.address,
                timestamp: Date.now(),
              }));
            } catch {}

            setLocation(newState);
          })
          .catch(() => {
            const newState: LocationState = {
              coords: {
                latitude: lat,
                longitude: lon,
                accuracy: position.coords.accuracy,
              },
              address: offlineAddress,
              status: 'granted',
              lastUpdated: new Date(),
              error: null,
            };

            try {
              localStorage.setItem('drishti_location', JSON.stringify({
                coords: newState.coords,
                address: newState.address,
                timestamp: Date.now(),
              }));
            } catch {}

            setLocation(newState);
          });
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
        // If we already have coords or default, keep using them
        if (location.coords) {
          return;
        }
        setLocation(prev => ({ ...prev, status: newStatus, error: errorMsg }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
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
  }, []);

  return { location, requestLocation };
};
