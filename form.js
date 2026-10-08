(() => {
  const ALLOWED = new Set([
    "liten",
    "synlig-14",
    "abonnement",
    "vedlikehold",
    "ai-synlighetssjekk",
    "usikker",
  ]);

  const form = document.getElementById("kontakt-form");
  if (!form) return;

  const select = form.querySelector('[name="pakke"]');
  const status = document.getElementById("form-status");
  const lang = form.dataset.lang || "nb";

  const params = new URLSearchParams(window.location.search);
  const pakke = params.get("pakke");
  if (select) {
    select.value = ALLOWED.has(pakke) ? pakke : "usikker";
  }

  const msg = {
    nb: {
      ok: "Takk! Jeg svarer innen 1 virkedag.",
      err:
        'Noe gikk galt. Send heller en e-post til <a href="mailto:kontakt@mlinternasjonal.no?subject=Synlig14">kontakt@mlinternasjonal.no</a>.',
      sending: "Sender…",
    },
    es: {
      ok: "¡Gracias! Respondo en 1 día laborable.",
      err:
        'Algo falló. Envía un correo a <a href="mailto:kontakt@mlinternasjonal.no?subject=Synlig14">kontakt@mlinternasjonal.no</a>.',
      sending: "Enviando…",
    },
  };
  const t = msg[lang] || msg.nb;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (status) {
      status.hidden = false;
      status.className = "form-status";
      status.textContent = t.sending;
    }

    const fd = new FormData(form);
    const payload = {
      navn: String(fd.get("navn") || "").trim(),
      bedrift: String(fd.get("bedrift") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      telefon: String(fd.get("telefon") || "").trim(),
      nettside: String(fd.get("nettside") || "").trim(),
      melding: String(fd.get("melding") || "").trim(),
      pakke: String(fd.get("pakke") || "usikker"),
      consent: fd.get("consent") === "on" || fd.get("consent") === "true",
      website: String(fd.get("website") || ""),
      lang,
    };

    try {
      const res = await fetch("/api/kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        if (status) {
          status.className = "form-status ok";
          status.textContent = t.ok;
        }
        form.reset();
        if (select) select.value = "usikker";
        return;
      }
      throw new Error("fail");
    } catch {
      if (status) {
        status.className = "form-status err";
        status.innerHTML = t.err;
      }
    }
  });
})();
