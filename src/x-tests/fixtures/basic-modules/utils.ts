export function formatDate(date: Date): string {
  return date.toISOString();
}

export const API_URL = 'https://api.example.com';

export class Logger {
  static log(message: string) {
    console.log(`[LOG]: ${message}`);
  }
}