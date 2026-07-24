export function classifyFormFactor({ userAgent = "", platform = "", mobileHint }) {
  if (mobileHint === true) return "mobile";
  if (/Android|Mobi|iPhone|iPad|iPod/i.test(userAgent)) return "mobile";
  if (/Win|Mac|Linux|CrOS|X11/i.test(platform)) return "computer";
  return "unknown";
}
