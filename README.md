# Synlig14

Nettsider for små bedrifter i Norge på 14 dager, til fast pris, på norsk og spansk.  
Synlig14 er en del av **ML Digital** (MARTINEZ LOZANO INTERNASJONAL HANDEL, org.nr. 935 407 095 MVA).

**URL midlertidig:** https://synlig14.pages.dev  
**Stack:** HTML + CSS + vanilla JS. Ingen build. Cloudflare Pages.

## Struktur

- Norsk (bokmål) i rot: `/`, `/pakker/`, `/klar-for-ai-sok/`, …
- Spansk i `/es/`: `/es/`, `/es/paquetes/`, …
- Engelsk er ikke laget ennå (struktur forberedt uten brutte lenker)

## Lokal forhåndsvisning

```bash
npx --yes serve -l 3000 .
# eller: python3 -m http.server 8080
```

Åpne http://localhost:3000/

## Bytt base-URL (når synlig14.no er kjøpt)

```bash
node scripts/set-base-url.mjs https://synlig14.no
```

Skriptet oppdaterer `site.config.json`, canonical/og:url/hreflang/JSON-LD, `sitemap.xml`, `robots.txt` og `llms.txt`. Interne lenker er rotrelative (`/pakker/`) og endres ikke.

## Cloudflare Pages

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → **Connect to Git**
2. Velg repo `willynoslo17/synlig14`
3. Prosjektnavn: `synlig14`
4. Production branch: `main`
5. Build command: *(tom)*
6. Build output directory: `/`
7. Deploy etter merge av PR til `main`

Alternativ uten Git-kobling:

```bash
npx wrangler pages deploy . --project-name synlig14
```

Hvis `synlig14.pages.dev` er opptatt, velg et annet prosjektnavn og kjør:

```bash
node scripts/set-base-url.mjs https://DITT-PROSJEKT.pages.dev
```

### Kontaktskjema (Pages Function)

Fil: `functions/api/kontakt.js`  
Endepunkt: `POST /api/kontakt`

Konfigurer webhook (Willy velger destinasjon, f.eks. Make):

```bash
wrangler pages secret put KONTAKT_WEBHOOK_URL --project-name synlig14
```

Hvis secret mangler, svarer API med `503` og skjemaet viser mailto-fallback.

**Ikke legg inn ekte webhook-URL eller API-nøkler i repoet.**

## Viktig før publisering

- Alle norske tekster er utkast → se `TEXTOS_NO_PARA_REVISAR.md` (Gemini-gjennomgang)
- Flere priser er forslag (Liten, Abonnement, AI-synlighetssjekk) merket med HTML-kommentarer `TODO Willy`
- Ingen merge til `main` før Willy har godkjent

## Kontakt

- Willy Edison Martínez Lozano
- kontakt@mlinternasjonal.no
- +47 912 90 416
- Norbygata 19, 0187 Oslo
