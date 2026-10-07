import { TIMEZONE, fetchWithTimeout } from "./util";

// 地點鎖定臺北市，不接受外部參數
const LOCATION = { name: "臺北", latitude: 25.033, longitude: 121.5654 };

// WMO weather interpretation codes
const WEATHER_CODES: Record<number, string> = {
  0: "晴朗",
  1: "大致晴朗",
  2: "局部多雲",
  3: "陰天",
  45: "有霧",
  48: "霧淞",
  51: "毛毛雨",
  53: "毛毛雨",
  55: "毛毛雨",
  56: "凍毛毛雨",
  57: "凍毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "凍雨",
  67: "凍雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "雪粒",
  80: "陣雨",
  81: "陣雨",
  82: "強陣雨",
  85: "陣雪",
  86: "強陣雪",
  95: "雷雨",
  96: "雷雨伴隨冰雹",
  99: "雷雨伴隨冰雹",
};

export type Weather = {
  location: string;
  date: string;
  condition: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability: number;
  current: {
    time: string;
    condition: string;
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
  };
};

const describe = (code: number) => WEATHER_CODES[code] ?? `未知（代碼 ${code}）`;

export async function getWeather(): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(LOCATION.latitude),
    longitude: String(LOCATION.longitude),
    timezone: TIMEZONE,
    forecast_days: "1",
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  });
  const res = await fetchWithTimeout(
    `https://api.open-meteo.com/v1/forecast?${params}`,
  );
  const data = await res.json();

  return {
    location: LOCATION.name,
    date: data.daily.time[0],
    condition: describe(data.daily.weather_code[0]),
    temperatureMax: data.daily.temperature_2m_max[0],
    temperatureMin: data.daily.temperature_2m_min[0],
    precipitationProbability: data.daily.precipitation_probability_max[0],
    current: {
      time: data.current.time,
      condition: describe(data.current.weather_code),
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
    },
  };
}
