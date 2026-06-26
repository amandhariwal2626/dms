export interface ParsedUserAgent {
  browser: string;
  browserVersion: string;
  operatingSystem: string;
  osVersion: string;
  deviceType: string;
  platform: string;
}

export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent.toLowerCase();
  const browser = extractBrowser(ua);
  const os = extractOperatingSystem(ua);

  return {
    browser: browser.name,
    browserVersion: browser.version,
    operatingSystem: os.name,
    osVersion: os.version,
    deviceType: extractDeviceType(ua),
    platform: os.name,
  };
}

function extractBrowser(ua: string): { name: string; version: string } {
  if (ua.includes('edg/')) return { name: 'Edge', version: extractVersion(ua, 'edg/') };
  if (ua.includes('chrome/')) return { name: 'Chrome', version: extractVersion(ua, 'chrome/') };
  if (ua.includes('firefox/')) return { name: 'Firefox', version: extractVersion(ua, 'firefox/') };
  if (ua.includes('safari/')) return { name: 'Safari', version: extractVersion(ua, 'version/') };
  return { name: 'Unknown', version: '0' };
}

function extractOperatingSystem(ua: string): { name: string; version: string } {
  if (ua.includes('windows'))
    return { name: 'Windows', version: extractVersion(ua, 'windows nt ') };
  if (ua.includes('mac os x')) return { name: 'macOS', version: extractVersion(ua, 'mac os x ') };
  if (ua.includes('android')) return { name: 'Android', version: extractVersion(ua, 'android ') };
  if (ua.includes('ios')) return { name: 'iOS', version: extractVersion(ua, 'os ') };
  if (ua.includes('linux')) return { name: 'Linux', version: '0' };
  return { name: 'Unknown', version: '0' };
}

function extractDeviceType(ua: string): string {
  if (ua.includes('mobile')) return 'MOBILE';
  if (ua.includes('tablet')) return 'TABLET';
  return 'DESKTOP';
}

function extractVersion(ua: string, prefix: string): string {
  const index = ua.indexOf(prefix);
  if (index === -1) return '0';
  const start = index + prefix.length;
  const end = ua.indexOf(' ', start);
  return ua.substring(start, end === -1 ? ua.length : end);
}
