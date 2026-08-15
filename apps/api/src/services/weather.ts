export type WeatherData = {
    temperature: number;
    precipitation: number;
    windSpeed: number;
    weatherCode: number;
  };

  type OpenMeteoResponse = {
    current: {
      temperature_2m: number;
      precipitation: number;
      wind_speed_10m: number;
      weather_code: number;
    };
  };

  export async function getWeather(
    latitude: number,
    longitude: number,
  ): Promise<WeatherData> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current:
        "temperature_2m,precipitation,wind_speed_10m,weather_code",
    });

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error("Unable to load weather data");
    }

    const data = (await response.json()) as OpenMeteoResponse;

    return {
      temperature: data.current.temperature_2m,
      precipitation: data.current.precipitation,
      windSpeed: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
    };
  }