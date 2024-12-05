export function isEmail(email: string): boolean {
  return email.includes('@');
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}