const DEFAULT_COORDS = {
  lat: 23.24,
  lng: 91.1214,
  resolvedName: 'Laksam, Cumilla',
};

const WEATHER_LABELS = {
  0: { en: 'Clear sky', bn: 'পরিষ্কার আকাশ' },
  1: { en: 'Mainly clear', bn: 'প্রধানত পরিষ্কার' },
  2: { en: 'Partly cloudy', bn: 'আংশিক মেঘলা' },
  3: { en: 'Overcast', bn: 'মেঘাচ্ছন্ন' },
  45: { en: 'Foggy', bn: 'কুয়াশাচ্ছন্ন' },
  48: { en: 'Rime fog', bn: 'ঘন কুয়াশা' },
  51: { en: 'Light drizzle', bn: 'হালকা গুঁড়ি গুঁড়ি বৃষ্টি' },
  53: { en: 'Drizzle', bn: 'গুঁড়ি গুঁড়ি বৃষ্টি' },
  61: { en: 'Light rain', bn: 'হালকা বৃষ্টি' },
  63: { en: 'Moderate rain', bn: 'মাঝারি বৃষ্টি' },
  65: { en: 'Heavy rain', bn: 'ভারী বৃষ্টি' },
  80: { en: 'Rain showers', bn: 'বৃষ্টিপাত' },
  95: { en: 'Thunderstorm', bn: 'বজ্রবৃষ্টি' },
};

/**
 * Geocodes a free-form address via Open-Meteo Geocoding API (no API key required).
 */
export async function geocodeAddress(addressText) {
  if (!addressText || typeof addressText !== 'string') return DEFAULT_COORDS;

  // Try full query first, then comma-separated tokens from right to left (e.g. Laksam, Cumilla)
  const parts = addressText
    .split(/[,।]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const candidates = [addressText.trim(), ...parts.slice().reverse()];

  for (const query of candidates) {
    if (query.length < 2) continue;
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.results?.length > 0) {
        const hit = data.results[0];
        return {
          lat: hit.latitude,
          lng: hit.longitude,
          resolvedName: `${hit.name}${hit.admin1 ? `, ${hit.admin1}` : ''}`,
        };
      }
    } catch {
      // Fall through to next candidate or default
    }
  }

  return DEFAULT_COORDS;
}

/**
 * Fetches current weather from Open-Meteo (no API key required).
 */
export async function fetchCurrentWeather(lat = DEFAULT_COORDS.lat, lng = DEFAULT_COORDS.lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FDhaka`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const current = data.current || {};
    const code = Number(current.weather_code ?? 0);
    return {
      available: true,
      temperatureC: current.temperature_2m ?? null,
      humidity: current.relative_humidity_2m ?? null,
      windSpeedKmh: current.wind_speed_10m ?? null,
      weatherCode: code,
      condition: WEATHER_LABELS[code] || { en: 'Fair weather', bn: 'স্বাভাবিক আবহাওয়া' },
    };
  } catch {
    return {
      available: false,
      temperatureC: null,
      humidity: null,
      windSpeedKmh: null,
      weatherCode: 0,
      condition: { en: 'Weather unavailable', bn: 'আবহাওয়া তথ্য পাওয়া যায়নি' },
    };
  }
}
