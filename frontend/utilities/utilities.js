export const convertToBangladeshTime  = (utcTimestamp) => {
    const utcDate = new Date(utcTimestamp);
    
    const optionsDate = { year: "numeric", month: "2-digit", day: "2-digit" };
    const optionsTime = { hour: "2-digit", minute: "2-digit", hour12: true };
  
    const bdDate = utcDate.toLocaleDateString("en-BD", { ...optionsDate, timeZone: "Asia/Dhaka" });
    const bdTime = utcDate.toLocaleTimeString("en-BD", { ...optionsTime, timeZone: "Asia/Dhaka" });
  
    return { date: bdDate, time: bdTime };
  }
  