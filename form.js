(() => {
  const ALLOWED = new Set([
    "liten",
    "synlig-14",
    "abonnement",
    "vedlikehold",
    "ai-synlighetssjekk",
    "usikker",
  ]);

  const ENDPOINT = "https://ml-inbox.willynoslo17.workers.dev/lead";

  const form = document.getElementById("kontakt-form");
  if (!form) return;

  const select = form.querySelector('[name="pakke"]');
  const status = form.querySelector('[role="status"]');
  const submitBtn = form.querySelector('button[type="submit"]');
  const tsInput = form.querySelector('[name="ts"]');

  const params = new URLSearchParams(window.location.search);
  const pakke = params.get("pakke");
  if (select) {
    select.value = ALLOWED.has(pakke) ? pakke : "usikker";
  }

  if (tsInput) {
    tsInput.value = String(Date.now());
  }

  function setStatus(text) {
    if (!status) return;
    status.textContent = text;
  }

  function resetTurnstile() {
    if (window.turnstile && typeof window.turnstile.reset === "function") {
      window.turnstile.reset();
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const turnstileToken = String(fd.get("cf-turnstile-response") || "").trim();
    if (!turnstileToken) {
      setStatus("Vent til sikkerhetssjekken er ferdig, og prøv igjen.");
      return;
    }

    if (submitBtn) submitBtn.disabled = true;

    const payload = {
      nombre: String(fd.get("navn") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      telefono: String(fd.get("telefon") || "").trim() || "",
      mensaje: String(fd.get("melding") || "").trim(),
      marca: "synlig14",
      pagina: window.location.pathname,
      turnstile_token: turnstileToken,
      website: String(fd.get("website") || ""),
      ts: Number(fd.get("ts") || Date.now()),
    };

    if (form.querySelector('[name="bedrift"]')) {
      payload.empresa = String(fd.get("bedrift") || "").trim();
    }

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 200) {
        setStatus("Takk! Meldingen din er sendt. Vi tar kontakt så snart som mulig.");
        form.reset();
        if (select) select.value = "usikker";
        if (tsInput) tsInput.value = String(Date.now());
      } else if (res.status === 429) {
        setStatus("For mange forsøk. Vent et minutt og prøv igjen.");
      } else if (res.status === 403) {
        setStatus("Vi kunne ikke bekrefte at du er et menneske. Last inn siden på nytt og prøv igjen.");
      } else {
        setStatus(
          "Beklager, noe gikk galt. Prøv igjen, eller send oss en e-post på kontakt@mlinternasjonal.no."
        );
      }
    } catch {
      setStatus(
        "Beklager, noe gikk galt. Prøv igjen, eller send oss en e-post på kontakt@mlinternasjonal.no."
      );
    } finally {
      resetTurnstile();
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();
