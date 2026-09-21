import { Cloud } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";

export function Header() {
  const { user } = useAuth();
  const displayUser = user ?? {
    name: "Guest User",
    email: "guest@campverse.local",
    role: "guest" as const,
  };
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<{
    temperature: number;
    wind: number;
    label: string;
  } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=10.9369&longitude=76.9528&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh&timezone=Asia%2FKolkata",
      { signal: controller.signal },
    )
      .then((response) => {
        if (!response.ok) throw new Error("Weather request failed");
        return response.json();
      })
      .then((data) => {
        const code = data.current?.weather_code;
        const labels: Record<number, string> = {
          0: "Clear",
          1: "Mostly clear",
          2: "Partly cloudy",
          3: "Overcast",
          45: "Foggy",
          48: "Foggy",
          51: "Light drizzle",
          53: "Drizzle",
          55: "Heavy drizzle",
          61: "Light rain",
          63: "Rain",
          65: "Heavy rain",
          80: "Showers",
          81: "Showers",
          82: "Heavy showers",
          95: "Thunderstorm",
          96: "Thunderstorm",
          99: "Thunderstorm",
        };
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          wind: Math.round(data.current.wind_speed_10m),
          label: labels[code] ?? "Current conditions",
        });
      })
      .catch((error) => {
        if (error.name !== "AbortError")
          console.error("Failed to load Kuniyamuthur weather", error);
      });
    return () => controller.abort();
  }, []);

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border/40 bg-background/70 backdrop-blur-xl px-4 lg:px-6">
      <div className="ml-auto flex items-center gap-3 lg:gap-5">
        <div className="hidden md:block text-right leading-tight">
          <div className="text-sm font-semibold tabular-nums">{time}</div>
          <div className="text-[11px] text-muted-foreground">{date}</div>
        </div>

        <div className="hidden md:flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-border/50">
            <Cloud className="h-5 w-5 text-accent" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">
              {weather ? `${weather.temperature}°C` : "--°C"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {weather ? weather.label : "Loading weather"}
            </div>
            {weather && (
              <div className="text-[10px] text-muted-foreground">
                Wind {weather.wind} km/h · Kuniyamuthur
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 pl-3 lg:pl-4 border-l border-border/40">
          {user ? (
            <>
              <div className="hidden md:block text-right leading-tight">
                <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                <div className="text-sm font-semibold flex items-center justify-end gap-1">
                  {user.name} <span className="text-primary font-mono text-xs">●</span>
                </div>
              </div>
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-primary/40">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </>
          ) : (
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-xs text-muted-foreground">Guest access</div>
              <div className="text-sm font-semibold">{displayUser.name}</div>
              <Link to="/login" className="text-[11px] text-primary hover:underline">
                Sign in for more features
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
