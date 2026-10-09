/* Mailto-levering: brukes når /api/kontakt ikke er konfigurert (ingen webhook). */
(function () {
  var EMAIL = "kontakt@mlinternasjonal.no";
  var SITE = "Synlig14";
  var SKIP = { website: 1, website_url: 1, samtykke: 1, consent: 1 };

  function ownText(label) {
    var t = "";
    for (var i = 0; i < label.childNodes.length; i++) {
      if (label.childNodes[i].nodeType === 3) t += label.childNodes[i].nodeValue;
    }
    return t.replace(/\*/g, "").replace(/\s+/g, " ").trim();
  }

  function labelFor(el) {
    var l = el.labels && el.labels[0];
    var t = l ? ownText(l) : "";
    return t || el.name.charAt(0).toUpperCase() + el.name.slice(1);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  window.kontaktMailtoFallback = function (form, lang) {
    var es = lang === "es";
    var lines = [];
    var groups = {};
    var order = [];
    var navn = "";
    var els = form.elements;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el.name || SKIP[el.name] || el.disabled) continue;
      if (el.type === "submit" || el.type === "button" || el.type === "hidden") continue;
      if (el.type === "checkbox" || el.type === "radio") {
        if (!el.checked) continue;
        var fs = el.closest("fieldset");
        var lg = fs && fs.querySelector("legend");
        var head = lg ? lg.textContent.replace(/\*/g, "").trim() : el.name;
        if (!groups[el.name]) { groups[el.name] = { head: head, vals: [] }; order.push(el.name); }
        groups[el.name].vals.push(labelFor(el));
        continue;
      }
      var v = el.tagName === "SELECT" && el.selectedIndex >= 0
        ? el.options[el.selectedIndex].text
        : String(el.value || "").trim();
      if (!v) continue;
      if (el.name === "navn") navn = v;
      lines.push(labelFor(el) + ": " + v);
    }
    for (var g = 0; g < order.length; g++) {
      lines.push(groups[order[g]].head + ": " + groups[order[g]].vals.join(", "));
    }
    var body = lines.join("\n");
    if (body.length > 1800) body = body.slice(0, 1800) + "…";
    body += "\n\n— " + (es ? "Enviado desde el formulario de " : "Sendt fra kontaktskjemaet på ") + SITE + " (" + location.href + ")";
    var subject = SITE + (es ? " – consulta" : " – henvendelse") + (navn ? (es ? " de " : " fra ") + navn : "");
    var url = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    try { window.location.href = url; } catch (e) {}
    var a = '<a href="' + escapeHtml(url) + '">';
    return es
      ? "Abrimos tu programa de correo con el mensaje listo para " + escapeHtml(EMAIL) + ". Pulsa «Enviar» para completarlo. ¿No se abrió nada? " + a + "Haz clic aquí</a> o escribe a " + '<a href="mailto:' + EMAIL + '">' + EMAIL + "</a>."
      : "Vi åpner e-postprogrammet ditt med meldingen klar til " + escapeHtml(EMAIL) + ". Trykk «Send» for å fullføre. Åpnet ingenting? " + a + "Klikk her</a> eller skriv til " + '<a href="mailto:' + EMAIL + '">' + EMAIL + "</a>.";
  };
})();

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
        status.innerHTML = window.kontaktMailtoFallback(form, lang);
      }
    }
  });
})();
