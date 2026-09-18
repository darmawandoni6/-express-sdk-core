import bcrypt from 'bcrypt';

const DEFAULT_SALT_ROUNDS = 10;

/**
 * Meng-hash password plaintext menggunakan bcrypt.
 * @param plain - Password plaintext
 * @param saltRounds - Jumlah salt rounds. Default: 10
 */
export async function hashPassword(
  plain: string,
  saltRounds = DEFAULT_SALT_ROUNDS,
): Promise<string> {
  return bcrypt.hash(plain, saltRounds);
}

/**
 * Membandingkan password plaintext dengan hash yang tersimpan.
 * @param plain - Password plaintext
 * @param hash - Hash bcrypt
 * @returns `true` jika cocok, `false` jika tidak cocok
 */
export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Versi synchronous untuk hash password (gunakan async jika memungkinkan).
 */
export function hashPasswordSync(
  plain: string,
  saltRounds = DEFAULT_SALT_ROUNDS,
): string {
  return bcrypt.hashSync(plain, saltRounds);
}

/**
 * Versi synchronous untuk compare password (gunakan async jika memungkinkan).
 */
export function comparePasswordSync(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}
