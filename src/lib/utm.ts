/**
 * src/lib/utm.ts
 *
 * Captura a UTM de ENTRADA (first-touch) e repassa fielmente pro destino (loja/checkout).
 * Mesmo helper usado nas LPs do portal — first-touch atômico, guarda 30 dias.
 */

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

type UtmKey = (typeof UTM_KEYS)[number];
export type Utms = Partial<Record<UtmKey, string>>;

const STORAGE_KEY = "cdd_entry_utms";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

function readUrlUtms(search: string = window.location.search): Utms {
  const params = new URLSearchParams(search);
  const out: Utms = {};
  UTM_KEYS.forEach((k) => {
    const v = params.get(k);
    if (v) out[k] = v;
  });
  return out;
}

function readStored(): Utms | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { utms: Utms; ts: number };
    if (!parsed || !parsed.ts) return null;
    if (Date.now() - parsed.ts > MAX_AGE_MS) return null;
    return parsed.utms || null;
  } catch {
    return null;
  }
}

/** Chame UMA vez quando a página montar (useEffect com [] no fim). */
export function captureEntryUtms(): void {
  try {
    const incoming = readUrlUtms();
    if (Object.keys(incoming).length === 0) return;
    if (readStored()) return; // first-touch: não sobrescreve
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ utms: incoming, ts: Date.now() }));
  } catch {
    /* localStorage indisponível — segue sem quebrar */
  }
}

/** Monta a URL final repassando a UTM de entrada (ou o fallback). */
export function buildCheckoutUrl(baseUrl: string, fallback: Utms, ctaPos?: string): string {
  const url = new URL(baseUrl);
  const entry = readStored() ?? readUrlUtms();
  const utms = Object.keys(entry).length > 0 ? entry : fallback;
  UTM_KEYS.forEach((k) => {
    const v = utms[k];
    if (v) url.searchParams.set(k, v);
  });
  if (ctaPos) url.searchParams.set("cta_pos", ctaPos);
  return url.href;
}

/** Retorna a UTM de entrada (first-touch) ou a da URL atual. */
export function getEntryUtms(): Utms {
  return readStored() ?? readUrlUtms();
}

/** Lê um parâmetro de entrada da URL (ex.: cid = id do contato no Reportana). */
export function getEntryParam(key: string): string | null {
  try { return new URLSearchParams(window.location.search).get(key); } catch { return null; }
}
