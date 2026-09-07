const LOCATIONS = {
  Patna: {
    latitude: 25.5941,
    longitude: 85.1376,
  },

  Kolkata: {
    latitude: 22.5726,
    longitude: 88.3639,
  },

  Guwahati: {
    latitude: 26.1445,
    longitude: 91.7362,
  },

  Delhi: {
    latitude: 28.6139,
    longitude: 77.2090,
  },
};


// ------------------------------------
// WEATHER DATA
// ------------------------------------

export async function getWeatherData(locationName) {
  const location = LOCATIONS[locationName];

  if (!location) {
    throw new Error("Location not found");
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${location.latitude}` +
    `&longitude=${location.longitude}` +
    `&current=temperature_2m,precipitation,rain,weather_code` +
    `&daily=rain_sum,precipitation_sum`
    `&hourly=precipitation,rain` +
    `&forecast_days=1` +
    `&timezone=auto`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Weather API failed");
  }

  const data = await response.json();

  return {
    temperature: data.current.temperature_2m,
    precipitation: data.current.precipitation,
    rain: data.current.rain,
    weatherCode: data.current.weather_code,
  };
}


// ------------------------------------
// FLOOD / RIVER DATA
// ------------------------------------

export async function getRiverData(locationName) {
  const location = LOCATIONS[locationName];

  if (!location) {
    throw new Error("Location not found");
  }

  const url =
    `https://flood-api.open-meteo.com/v1/flood` +
    `?latitude=${location.latitude}` +
    `&longitude=${location.longitude}` +
    `&daily=river_discharge` +
    `&forecast_days=7` +
    `&timezone=auto`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Flood API failed");
  }

  const data = await response.json();

  return {
    discharge: data.daily?.river_discharge?.[0] ?? null,
    dates: data.daily?.time ?? [],
    dischargeForecast:
      data.daily?.river_discharge ?? [],
  };
}


// ------------------------------------
// COMBINE MULTIPLE DATA SOURCES
// ------------------------------------

export async function getFloodData(locationName) {
  const [weather, river] = await Promise.all([
    getWeatherData(locationName),
    getRiverData(locationName),
  ]);

  return {
    location: locationName,

    weather,

    river,

    timestamp: new Date().toISOString(),
  };
}