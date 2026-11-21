/**
 * Efeito sonoro profissional (Web Audio API) ao receber nova mensagem/notificação.
 * Sem ficheiros externos e respeitando preferência de som do utilizador.
 */
export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem('jogimil_admin_sound') !== 'false';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem('jogimil_admin_sound', enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function playMessageSound(): void {
  if (!isSoundEnabled() || typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Dois tons suaves e limpos (estilo notificação executiva)
    const tones = [
      { freq: 660, start: 0, dur: 0.11 },
      { freq: 880, start: 0.1, dur: 0.16 },
    ];

    for (const t of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(t.freq, now + t.start);

      gain.gain.setValueAtTime(0.001, now + t.start);
      gain.gain.exponentialRampToValueAtTime(0.08, now + t.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t.start + t.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t.start);
      osc.stop(now + t.start + t.dur + 0.02);
    }

    setTimeout(() => ctx.close().catch(() => {}), 500);
  } catch {
    // Autoplay policy antes da primeira interação do utilizador
  }
}
