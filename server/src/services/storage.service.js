import fs from 'node:fs';
import { ENV } from '../config/env.js';

// Assegurar diretório de dados
if (!fs.existsSync(ENV.DATA_DIR)) {
  fs.mkdirSync(ENV.DATA_DIR, { recursive: true });
}

export function saveSubmission(record) {
  try {
    const line = JSON.stringify(record) + '\n';
    fs.appendFileSync(ENV.SUBMISSIONS_FILE, line, 'utf-8');
    return true;
  } catch (error) {
    console.error('[StorageService] Erro ao gravar submissão local:', error);
    return false;
  }
}

export function getRecentSubmissions(limit = 20) {
  try {
    if (!fs.existsSync(ENV.SUBMISSIONS_FILE)) return [];
    const content = fs.readFileSync(ENV.SUBMISSIONS_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const parsed = lines.map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    }).filter(Boolean);

    return parsed.slice(-limit).reverse();
  } catch (error) {
    console.error('[StorageService] Erro ao ler histórico:', error);
    return [];
  }
}
