import * as Crypto from 'expo-crypto';

const ITERATIONS = 8000;

async function sha256Hex(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

export async function generateSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  let value = `${salt}:${password}`;
  for (let i = 0; i < ITERATIONS; i++) {
    value = await sha256Hex(value);
  }
  return value;
}

// Legacy XOR+base64 hashing, kept only to verify and migrate old accounts.
export function legacyHashPassword(password: string): string {
  let result = '';
  for (let i = 0; i < password.length; i++) {
    result += String.fromCharCode(password.charCodeAt(i) ^ (i % 256));
  }
  return btoa(result);
}