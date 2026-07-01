export async function fetchCityCoordinates(cities: string[]): Promise<Record<string, [number, number]>> {
  const newGeoData: Record<string, [number, number]> = {};
  
  await Promise.all(cities.map(async (city) => {
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&format=json`);
      const json = await res.json();
      if (json.results && json.results.length > 0) {
        newGeoData[city] = [json.results[0].longitude, json.results[0].latitude];
      }
    } catch (e) { 
      console.error(`Erro Geocache: ${city}`); 
    }
  }));

  return newGeoData;
}