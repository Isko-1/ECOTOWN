"use client";

import { useEffect, useState } from "react";
import { CloudSun, CloudRain, Sun, Wind, Droplets, Thermometer, Sparkles, Calendar } from "lucide-react";

interface WeatherData {
  temp: number;
  feelsLike?: number;
  humidity?: number;
  windSpeed: number;
  description: string;
  ecoTip: string;
  dateTitle?: string;
  isForecastDate?: boolean;
}

const OWM_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "43a54b01085ad8531724feb86aad4e25";

export function CleanupWeatherWidget({
  compact = false,
  eventDate = null,
}: {
  compact?: boolean;
  eventDate?: string | null;
}) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchWeather() {
      try {
        const targetTime = eventDate ? new Date(eventDate).getTime() : null;
        const now = Date.now();
        const isFutureEvent = targetTime && targetTime > now && targetTime - now < 5 * 84600 * 1000;

        // Если указана будущая дата субботника (в пределах 5 дней) — запрашиваем 5-дневный прогноз OWM
        if (isFutureEvent) {
          const forecastRes = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=Uralsk,kz&units=metric&lang=ru&appid=${OWM_API_KEY}`
          );
          if (forecastRes.ok) {
            const forecastData = await forecastRes.json();
            const list = forecastData.list as any[];

            // Ищем срез времени ближе всего к eventDate
            let closestItem = list[0];
            let minDiff = Math.abs(new Date(list[0].dt_txt).getTime() - targetTime);

            for (const item of list) {
              const diff = Math.abs(new Date(item.dt_txt).getTime() - targetTime);
              if (diff < minDiff) {
                minDiff = diff;
                closestItem = item;
              }
            }

            if (!active) return;

            const temp = Math.round(closestItem.main.temp);
            const windSpeed = Math.round(closestItem.wind.speed);
            const desc = closestItem.weather[0]?.description ?? "прогноз";
            const mainState = closestItem.weather[0]?.main?.toLowerCase() ?? "";

            const formattedDate = new Date(eventDate!).toLocaleString("ru-RU", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });

            let ecoTip = `На субботник ${formattedDate} ожидается +${temp}°C. Отличная погода!`;
            if (mainState.includes("rain")) {
              ecoTip = `На день субботника (${formattedDate}) возможен дождь (+${temp}°C). Возьмите дождевики!`;
            } else if (windSpeed > 8) {
              ecoTip = `Ожидается ветер ${windSpeed} м/с. Зафиксируйте мешки для мусора.`;
            } else if (temp > 28) {
              ecoTip = `Будет жарко (+${temp}°C)! Обязательно запаситесь питьевой водой.`;
            }

            setWeather({
              temp,
              feelsLike: Math.round(closestItem.main.feels_like),
              humidity: closestItem.main.humidity,
              windSpeed,
              description: desc.charAt(0).toUpperCase() + desc.slice(1),
              ecoTip,
              dateTitle: `Прогноз на ${formattedDate}`,
              isForecastDate: true,
            });
            setLoading(false);
            return;
          }
        }

        // Запрос текущей погоды OpenWeatherMap
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

        let ecoTip = "Отличная погода для проведения субботника! Возьмите воду и перчатки.";
        if (mainState.includes("rain") || mainState.includes("drizzle")) {
          ecoTip = "Ожидаются осадки. Рекомендуем взять дождевики и непромокаемую обувь.";
        } else if (windSpeed > 8) {
          ecoTip = "Сильный ветер! Будьте осторожны при сборе легкого пластика.";
        } else if (temp > 28) {
          ecoTip = "Жарко! Надевайте головные уборы и делайте перерывы в тени.";
        }

        setWeather({
          temp,
          feelsLike,
          humidity,
          windSpeed,
          description: description.charAt(0).toUpperCase() + description.slice(1),
          ecoTip,
          dateTitle: "Погода в Уральске сейчас",
          isForecastDate: false,
        });
      } catch (err) {
        console.warn("Weather fetch fallback:", err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchWeather();
    return () => {
      active = false;
    };
  }, [eventDate]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-eco-50/80 px-3 py-2 text-xs text-eco-700 animate-pulse">
        <CloudSun size={16} />
        <span>Загружаем погоду для субботника…</span>
      </div>
    );
  }

  if (error || !weather) return null;

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 rounded-xl border border-eco-200/80 bg-white/95 px-3 py-1.5 shadow-xs text-xs text-eco-900"
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
    <div className="rounded-2xl border border-eco-200/90 bg-gradient-to-br from-eco-50/90 via-white to-blue-50/50 p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-eco-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-xs">
            {weather.description.includes("дождь") ? (
              <CloudRain size={22} />
            ) : weather.temp >= 20 ? (
              <Sun size={22} />
            ) : (
              <CloudSun size={22} />
            )}
          </div>
          <div>
            <h3 className="font-display text-xs font-bold text-eco-800 uppercase tracking-wide flex items-center gap-1">
              <Calendar size={13} className="text-eco-600" />
              {weather.dateTitle}
            </h3>
            <p className="text-sm font-bold text-eco-900 mt-0.5">{weather.description}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="font-display text-2xl font-extrabold text-eco-900 leading-none">
            {weather.temp > 0 ? `+${weather.temp}` : weather.temp}°C
          </div>
          {weather.feelsLike !== undefined && (
            <div className="text-[11px] text-eco-500 mt-1">Ощущается как {weather.feelsLike}°C</div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-eco-700">
        <span className="flex items-center gap-1">
          <Wind size={14} className="text-blue-500" /> Ветер: {weather.windSpeed} м/с
        </span>
        {weather.humidity !== undefined && (
          <span className="flex items-center gap-1">
            <Droplets size={14} className="text-blue-500" /> Влажность: {weather.humidity}%
          </span>
        )}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-eco-600/10 p-2.5 text-xs text-eco-900">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-eco-600" />
        <p className="font-medium leading-relaxed">{weather.ecoTip}</p>
      </div>
    </div>
  );
}
