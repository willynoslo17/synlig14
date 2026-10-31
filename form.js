(() => {
const FORM_I18N = {
  "en": {
    "Vent til sikkerhetssjekken er ferdig, og prøv igjen.": "Wait for the security check to finish and try again.",
    "Takk! Meldingen din er sendt. Vi tar kontakt så snart som mulig.": "Thanks! Your message has been sent. We will contact you as soon as possible.",
    "For mange forsøk. Vent et minutt og prøv igjen.": "Too many attempts. Wait a minute and try again.",
    "Vi kunne ikke bekrefte at du er et menneske. Last inn siden på nytt og prøv igjen.": "We could not verify that you are human. Please reload the page and try again.",
    "Beklager, noe gikk galt. Prøv igjen, eller send oss en e-post på kontakt@synlig14.no.": "Sorry, something went wrong. Try again, or send us an e-mail at kontakt@synlig14.no."
  },
  "sv": {
    "Vent til sikkerhetssjekken er ferdig, og prøv igjen.": "Vänta tills säkerhetskontrollen är klar och försök igen.",
    "Takk! Meldingen din er sendt. Vi tar kontakt så snart som mulig.": "Tack! Ditt meddelande har skickats. Vi kommer att kontakta dig så snart som möjligt.",
    "For mange forsøk. Vent et minutt og prøv igjen.": "För många försök. Vänta en minut och försök igen.",
    "Vi kunne ikke bekrefte at du er et menneske. Last inn siden på nytt og prøv igjen.": "Vi kunde inte verifiera att du är människa. Ladda om sidan och försök igen.",
    "Beklager, noe gikk galt. Prøv igjen, eller send oss en e-post på kontakt@synlig14.no.": "Tyvärr, något gick fel. Försök igen, eller skicka oss ett e-postmeddelande på kontakt@synlig14.no."
  },
  "pl": {
    "Vent til sikkerhetssjekken er ferdig, og prøv igjen.": "Poczekaj na zakończenie kontroli bezpieczeństwa i spróbuj ponownie.",
    "Takk! Meldingen din er sendt. Vi tar kontakt så snart som mulig.": "Dzięki! Twoja wiadomość została wysłana. Skontaktujemy się z Tobą tak szybko, jak to możliwe.",
    "For mange forsøk. Vent et minutt og prøv igjen.": "Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.",
    "Vi kunne ikke bekrefte at du er et menneske. Last inn siden på nytt og prøv igjen.": "Nie mogliśmy zweryfikować, czy jesteś człowiekiem. Załaduj ponownie stronę i spróbuj ponownie.",
    "Beklager, noe gikk galt. Prøv igjen, eller send oss en e-post på kontakt@synlig14.no.": "Przepraszamy, coś poszło nie tak. Spróbuj ponownie lub wyślij nam e-mail na adres kontakt@synlig14.no."
  }
};
const FORM_LANG = (document.documentElement.lang || "nb").slice(0, 2);
const T = (s) => (FORM_I18N[FORM_LANG] && FORM_I18N[FORM_LANG][s]) || s;

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
      setStatus(T("Vent til sikkerhetssjekken er ferdig, og prøv igjen."));
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
        setStatus(T("Takk! Meldingen din er sendt. Vi tar kontakt så snart som mulig."));
        form.reset();
        if (select) select.value = "usikker";
        if (tsInput) tsInput.value = String(Date.now());
      } else if (res.status === 429) {
        setStatus(T("For mange forsøk. Vent et minutt og prøv igjen."));
      } else if (res.status === 403) {
        setStatus(T("Vi kunne ikke bekrefte at du er et menneske. Last inn siden på nytt og prøv igjen."));
      } else {
        setStatus(T("Beklager, noe gikk galt. Prøv igjen, eller send oss en e-post på kontakt@synlig14.no.")
        );
      }
    } catch {
      setStatus(T("Beklager, noe gikk galt. Prøv igjen, eller send oss en e-post på kontakt@synlig14.no.")
      );
    } finally {
      resetTurnstile();
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();
