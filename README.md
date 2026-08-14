# Fryseboksen

En norsk, mobilvennlig React-app som holder oversikt over mat i fryseren.

## Funksjoner

- registrer navn, nedfrysingsdato, antall, kategori og bilde
- søk og filtrer innholdet
- se hvilke varer som bør brukes snart
- valgfrie nettleserpåminnelser
- varig lagring av data og bilder med Cloudflare D1 og R2

Den publiserte appen finnes på [freezer-keeper.mathiamo.chatgpt.site](https://freezer-keeper.mathiamo.chatgpt.site).

## Teknologi

- React 19
- TypeScript
- Vinext/Vite
- Drizzle ORM
- Cloudflare D1 og R2

## Lokal utvikling

Krav: Node.js 22.13 eller nyere.

```bash
npm install
npm run dev
```

Appen åpnes normalt på adressen som vises i terminalen. Lokal database og fillagring leveres av Cloudflare-utviklingsmiljøet i prosjektet.

## Bygg

```bash
npm run build
```

## Databaseskjema

Skjemaet ligger i `db/schema.ts`. Generer en ny migrasjon etter skjemaendringer:

```bash
npm run db:generate
```
