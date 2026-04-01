/**
 * تجزئة PIN المالك - باستخدام Web Crypto API
 * لا يتم تخزين PIN بنص صريح في أي مكان
 */

/** تجزئة نص باستخدام SHA-256 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** التحقق من PIN */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  const pinHash = await hashPin(pin);
  return pinHash === storedHash;
}
