const ALLOWED_PAKKER = new Set([
  "liten",
  "synlig-14",
  "abonnement",
  "vedlikehold",
  "ai-synlighetssjekk",
  "usikker",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function clip(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return json(405, { ok: false, error: "method_not_allowed" });
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const honeypot = clip(data.website, 100);
  if (honeypot) {
    return json(200, { ok: true });
  }

  const navn = clip(data.navn, 120);
  const email = clip(data.email, 200);
  const consent = data.consent === true;
  const pakke = clip(data.pakke, 40);
  const lang = data.lang === "es" ? "es" : "nb";

  if (!navn || !EMAIL_RE.test(email) || !consent || !ALLOWED_PAKKER.has(pakke)) {
    return json(400, { ok: false, error: "validation" });
  }

  const webhook = env.KONTAKT_WEBHOOK_URL;
  if (!webhook) {
    return json(503, { ok: false, error: "not_configured" });
  }

  const payload = {
    source: "synlig14",
    lang,
    timestamp: new Date().toISOString(),
    navn,
    bedrift: clip(data.bedrift, 120),
    email,
    telefon: clip(data.telefon, 40),
    nettside: clip(data.nettside, 200),
    melding: clip(data.melding, 4000),
    pakke,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      return json(502, { ok: false, error: "upstream" });
    }
    return json(200, { ok: true });
  } catch {
    return json(502, { ok: false, error: "upstream" });
  } finally {
    clearTimeout(timer);
  }
}
