/**
 * Relógio e calendário do jogo.
 * - Hora: a hora real no horário de Brasília (GMT-3).
 * - Data: a guilda nasce no Dia 01 do Ano 01 e o calendário avança 1 dia
 *   a cada dia real (virando à meia-noite de Brasília).
 */
export const GAME_UTC_OFFSET_HOURS = -3;
export const DAYS_PER_YEAR = 365;

const DAY_MS = 24 * 60 * 60 * 1000;
const OFFSET_MS = GAME_UTC_OFFSET_HOURS * 60 * 60 * 1000;

/** Número do dia (desde 1970) no fuso do jogo. */
const localDayNumber = (t: number) => Math.floor((t + OFFSET_MS) / DAY_MS);

/** Quantos dias do jogo se passaram desde a fundação (0 no dia da fundação). */
export function gameDayIndex(foundedAt: number, now = Date.now()) {
  return Math.max(0, localDayNumber(now) - localDayNumber(foundedAt));
}

/** Milissegundos até a próxima virada de dia (meia-noite de Brasília). */
export function msUntilNextDay(now = Date.now()) {
  return (localDayNumber(now) + 1) * DAY_MS - OFFSET_MS - now;
}

export type GameDate = { day: number; year: number; hours: number; minutes: number };

export function gameDate(foundedAt: number, now = Date.now()): GameDate {
  const elapsedDays = gameDayIndex(foundedAt, now);
  const local = new Date(now + OFFSET_MS); // lido com getUTC* = hora de Brasília
  return {
    day: (elapsedDays % DAYS_PER_YEAR) + 1,
    year: Math.floor(elapsedDays / DAYS_PER_YEAR) + 1,
    hours: local.getUTCHours(),
    minutes: local.getUTCMinutes(),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatGameDate(d: GameDate) {
  return `Dia ${pad(d.day)} · Ano ${pad(d.year)}`;
}

export function formatGameTime(d: GameDate) {
  return `${pad(d.hours)}:${pad(d.minutes)}`;
}
