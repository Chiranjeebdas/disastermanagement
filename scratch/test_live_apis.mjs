async function testLiveAPIs() {
  try {
    console.log('Fetching live USGS earthquakes...');
    const usgsRes = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
    const usgsData = await usgsRes.json();
    console.log(`USGS Events Count: ${usgsData.features.length}`);
    if (usgsData.features.length > 0) {
      console.log('Sample USGS Event:', {
        place: usgsData.features[0].properties.place,
        mag: usgsData.features[0].properties.mag,
        time: new Date(usgsData.features[0].properties.time).toISOString(),
        coords: usgsData.features[0].geometry.coordinates
      });
    }

    console.log('\nFetching live Open-Meteo Weather...');
    const weatherRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=20.4625&longitude=85.8828&current=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m&timezone=auto');
    const weatherData = await weatherRes.json();
    console.log('Live Weather Data:', weatherData.current);
  } catch (err) {
    console.error('Error fetching live APIs:', err);
  }
}

testLiveAPIs();
