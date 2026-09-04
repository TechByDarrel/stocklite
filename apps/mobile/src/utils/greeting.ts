/**
 * Get time-based greeting message
 * Can be extended to use Weather Agent data for location-aware greetings
 */
export function getTimeBasedGreeting(date: Date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

/**
 * Weather agent integration point
 * In the future, this will receive weather data and return contextual greeting
 */
export interface WeatherContext {
  temperature?: number;
  condition?: string;
  location?: string;
  localTime?: Date;
}

export function getWeatherAwareGreeting(weather?: WeatherContext): string {
  const localTime = weather?.localTime || new Date();
  const baseGreeting = getTimeBasedGreeting(localTime);
  
  // This is the integration point for the Weather Agent
  // For now, just return the time-based greeting
  // Later, this can be enhanced with weather-specific messages:
  // "Good morning, it's a great day for business" (if sunny)
  // "Good evening, wrap up your day" (if evening)
  
  return baseGreeting;
}
