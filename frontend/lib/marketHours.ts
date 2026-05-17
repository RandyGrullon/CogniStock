
/**
 * Utilidades para determinar si el mercado está abierto.
 * Horario standard de NY: 9:30 AM - 4:00 PM (16:00).
 */

export function isMarketOpen(ticker: string): { isOpen: boolean; reason?: string } {
  const symbol = ticker.toUpperCase();
  
  // Criptomonedas y Forex suelen operar 24/7 o casi (Forex cierra findes, pero simplificamos)
  const isCrypto = symbol.includes("USD") || symbol.includes("BTC") || symbol.includes("ETH") || symbol.includes("XAU") || symbol.includes("XAG");
  
  if (isCrypto) {
    return { isOpen: true };
  }

  // Acciones (NYSE/NASDAQ)
  const now = new Date();
  
  // Obtener hora actual en New York usando formatToParts para evitar problemas de parsing de strings
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "long",
  });
  
  const parts = formatter.formatToParts(now);
  const weekdayObj = parts.find(p => p.type === 'weekday');
  const hourObj = parts.find(p => p.type === 'hour');
  const minuteObj = parts.find(p => p.type === 'minute');
  
  const weekday = weekdayObj ? weekdayObj.value : "";
  const hour = hourObj ? parseInt(hourObj.value, 10) : 0;
  const minute = minuteObj ? parseInt(minuteObj.value, 10) : 0;
  
  const totalMinutes = hour * 60 + minute;

  const isWeekend = weekday === "Saturday" || weekday === "Sunday";
  
  // 9:30 = 570 mins, 16:00 = 960 mins
  if (isWeekend) {
    return { isOpen: false, reason: "Mercado cerrado (Fin de semana)" };
  }
  
  if (totalMinutes < 570) {
    return { isOpen: false, reason: "Mercado cerrado (Pre-market)" };
  }
  
  if (totalMinutes >= 960) {
    return { isOpen: false, reason: "Mercado cerrado (Post-market)" };
  }

  return { isOpen: true };
}
