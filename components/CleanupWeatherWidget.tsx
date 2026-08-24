"use client";

import { useEffect, useState } from "react";
import { CloudSun, CloudRain, Sun, Wind, Droplets, Thermometer, Sparkles } from "lucide-react";

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  ecoTip: string;
}

const OWM_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "43a54b01085ad8531724feb86aad4e25";

export function CleanupWeatherWidget({ compact = false }: { compact?: boolean }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchWeather() {
      try {
        // Запрос к OpenWeatherMap для г. Уральск
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Uralsk,kz&units=metric&lang=ru&appid=${OWM_API_KEY}`
        );

        if (!res.ok) throw new Error("OWM fetch failed");
        const data = await res.json();

        if (!active) return;

        const temp = Math.round(data.main.temp);
        const feelsLike = Math.round(data.main.feels_like);
        const humidity = data.main.humidity;
        const windSpeed = Math.round(data.wind.speed);
        const description = data.weather[0]?.description ?? "Погода в Уральске";
        const mainState = data.weather[0]?.main?.toLowerCase() ?? "";

        // Формирование экологического совета по погоде
        let ecoTip = "Отличная погода для проведения субботника! Возьмите воду и перчатки.";
        if (mainState.includes("rain") || mainState.includes("drizzle")) {
          ecoTip = "Ожидаются осадки. Рекомендуем взять дождевики и непромокаемую обувь.";
        } else if (windSpeed > 8) {
          ecoTip = "Сильный ветер! Будьте осторожны при сборе легкого пластика и пакетов.";
        } else if (temp > 28) {
          ecoTip = "Жарко! Обязательно надевайте головные уборы и делайте перерывы в тени.";
        } else if (temp < 10) {
          ecoTip = "Прохладно. Одевайтесь слоями и захватите термос с горячим чаем.";
        }

        setWeather({
          temp,
          feelsLike,
          humidity,
          windSpeed,
          description: description.charAt(0).toUpperCase() + description.slice(1),
          icon: data.weather[0]?.icon ?? "02d",
          ecoTip,
        });
      } catch (err) {
        console.warn("OpenWeatherMap fetch failed, fallbacking to Open-Meteo:", err);
        // Fallback: Open-Meteo (Уральск 51.2333, 51.3667)
        try {
          const fallbackRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=51.2333&longitude=51.3667&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&timezone=auto`
          );
          const fallbackData = await fallbackRes.json();
          if (!active) return;

          const temp = Math.round(fallbackData.current.temperature_2m);
          const feelsLike = Math.round(fallbackData.current.apparent_temperature);
          const humidity = Math.round(fallbackData.current.relative_humidity_2m);
          const windSpeed = Math.round(fallbackData.current.wind_speed_10m);

          setWeather({
            temp,
            feelsLike,
            humidity,
            windSpeed,
            description: "Уральск, Западный Казахстан",
            icon: "02d",
            ecoTip: "Погода благоприятна для эко-акций. Не забудьте инвентарь и хорошая настроение!",
          });
        } catch {
          if (active) setError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchWeather();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-eco-50/80 px-3 py-2 text-xs text-eco-700 animate-pulse">
        <CloudSun size={16} />
        <span>Загружаем погоду Уральска…</span>
      </div>
    );
  }

  if (error || !weather) return null;

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 rounded-xl border border-eco-200/80 bg-white/95 px-3 py-1.5 shadow-sm text-xs text-eco-900"
        title={weather.ecoTip}
      >
        <span className="font-bold text-eco-800 flex items-center gap-1">
          <Thermometer size={14} className="text-amber-500" />
          {weather.temp > 0 ? `+${weather.temp}` : weather.temp}°C
        </span>
        <span className="text-eco-600 hidden sm:inline">{weather.description}</span>
        <span className="text-eco-400">|</span>
        <span className="flex items-center gap-0.5 text-eco-700">
          <Wind size={13} className="text-blue-500" /> {weather.windSpeed} м/с
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-eco-200/90 bg-gradient-to-br from-eco-50/90 via-white to-blue-50/50 p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-eco-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-xs">
            {weather.temp >= 20 ? (
              <Sun size={22} />
            ) : weather.description.includes("дождь") ? (
              <CloudRain size={22} />
            ) : (
              <CloudSun size={22} />
            )}
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-eco-900 flex items-center gap-1">
              Погода в Уральске
            </h3>
            <p className="text-xs text-eco-600 font-medium">{weather.description}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="font-display text-2xl font-extrabold text-eco-900 leading-none">
            {weather.temp > 0 ? `+${weather.temp}` : weather.temp}°C
          </div>
          <div className="text-[11px] text-eco-500 mt-1">Ощущается как {weather.feelsLike}°C</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-eco-700">
        <span className="flex items-center gap-1">
          <Wind size={14} className="text-blue-500" /> Ветер: {weather.windSpeed} м/с
        </span>
        <span className="flex items-center gap-1">
          <Droplets size={14} className="text-blue-500" /> Влажность: {weather.humidity}%
        </span>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-eco-600/10 p-2.5 text-xs text-eco-900">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-eco-600" />
        <p className="font-medium leading-relaxed">{weather.ecoTip}</p>
      </div>
    </div>
  );
}
