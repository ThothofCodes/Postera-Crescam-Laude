// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Device Fingerprinting using FingerprintJS (open-source, free)
import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpInstance = null;
let cachedVisitorId = null;

/**
 * Get the device fingerprint (visitor ID) from FingerprintJS.
 * Caches the result for the session to avoid repeated computation.
 * @returns {Promise<string>} The visitor ID string
 */
export async function getDeviceFingerprint() {
  if (cachedVisitorId) return cachedVisitorId;

  try {
    if (!fpInstance) {
      fpInstance = await FingerprintJS.load();
    }
    const result = await fpInstance.get();
    cachedVisitorId = result.visitorId;
    return cachedVisitorId;
  } catch (err) {
    console.error('[DeviceFingerprint] Failed to generate fingerprint:', err);
    // Fallback: generate a random ID stored in sessionStorage
    let fallback = sessionStorage.getItem('pcl-device-fallback');
    if (!fallback) {
      fallback = 'fallback-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      sessionStorage.setItem('pcl-device-fallback', fallback);
    }
    cachedVisitorId = fallback;
    return cachedVisitorId;
  }
}

/**
 * Get a human-readable device description.
 * @returns {string} e.g. "Chrome on macOS"
 */
export function getDeviceDescription() {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Browser detection
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

  // OS detection
  if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
}
