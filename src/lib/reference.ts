const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTransferReference(): string {
  const year = new Date().getFullYear();
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `ZP-${year}-${suffix}`;
}
