# Scripts Guide

## Quick Reference

```bash
# Full setup workflow:
npm run seed                              # 1. Seed fragrances
npx tsx scripts/populateFragranceMetadata.ts  # 2. Add curated metadata
npx tsx scripts/backfillMetadata.ts       # 3. Scrape notes from Fragrantica

# After adding fragrances via website:
npx tsx scripts/backfillMetadata.ts       # Scrape notes for new fragrances

# Add trending fragrances from Fragrantica:
npx tsx scripts/scrapePulse.ts            # Scrape Fragrantica Pulse page
```

---

## Backfilling Fragrance Metadata (Notes, Year, Perfumer, etc.)

### The Problem

Fragrantica has Cloudflare protection that blocks all cloud-based browsers. This means when you add a fragrance via the website, **notes and other metadata can't be scraped in production**.

### The Solution

1. Fragrances are added without notes (they still work, just missing note data)
2. Run the backfill script **locally** on your machine to populate the missing data

---

## Full Setup Workflow (New Database)

### Step 1: Seed fragrances

```bash
npm run seed
```

This seeds fragrances from `data/fragrances.seed.with-images.json` and:
- Extracts `fragranticaId` from image URLs
- Sets `needsBackfill: true` for all fragrances

### Step 2: Add curated metadata

```bash
npx tsx scripts/populateFragranceMetadata.ts
```

This adds year, concentration, perfumer, and description from the hardcoded list.
Also sets `needsBackfill: true` since it doesn't include notes.

### Step 3: Backfill notes from Fragrantica

```bash
npx tsx scripts/backfillMetadata.ts
```

This scrapes Fragrantica for each fragrance and adds:
- Notes (top, middle, base)
- Accords
- Gender
- Any missing metadata

Run multiple times if you have many fragrances (processes 50 per run).

---

## After Adding Fragrances via Website

When you add a fragrance via the website's "+" button:
1. The fragrance is added with `needsBackfill: true`
2. Notes are NOT scraped (Cloudflare blocks cloud browsers)

To get the notes, run locally:

```bash
npx tsx scripts/backfillMetadata.ts
```

---

## Script Reference

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `seedFirestore.ts` | Seed initial fragrances with images | Initial setup |
| `populateFragranceMetadata.ts` | Add curated metadata (year, perfumer, etc.) | After seeding |
| `backfillMetadata.ts` | Scrape notes from Fragrantica | After any of the above, or after adding via website |
| `seedFromCsv.ts` | Import from CSV file | Bulk import |
| `scrapePulse.ts` | Scrape trending fragrances from Fragrantica Pulse | Add trending fragrances |

---

## Scraping Trending Fragrances from Fragrantica Pulse

The Pulse page (https://www.fragrantica.com/pulse/) shows fragrances with the most "buzz" - useful for adding popular/trending fragrances to your database.

```bash
# Default (3 concurrent pages)
npx tsx scripts/scrapePulse.ts

# Faster (5 concurrent pages - more aggressive)
npx tsx scripts/scrapePulse.ts --concurrency=5

# Conservative (1 page - safest)
npx tsx scripts/scrapePulse.ts --concurrency=1
```

This script:
1. Opens the Fragrantica Pulse page
2. Extracts all fragrance links
3. Pre-filters existing fragrances (fast Firestore check)
4. Creates a pool of browser pages for concurrent scraping
5. For each new fragrance:
   - Navigates to the fragrance page and scrapes full metadata
   - Adds to Firestore with notes, accords, gender, year, etc.

The script automatically:
- Uses concurrent pages (3 by default, configurable 1-10)
- Skips existing fragrances before scraping
- Rate-limits requests (1.5s delay per worker)
- Sets arena flags based on detected gender
- Flags fragrances for backfill if notes weren't found

---

## How Backfill Tracking Works

- `needsBackfill: true` → Fragrance needs notes scraped
- `needsBackfill: false` → Fragrance has been processed

The backfill script queries ONLY fragrances where `needsBackfill: true`, so it's efficient even with 80,000+ fragrances.

---

## Troubleshooting

### "No fragrances needing backfill"
All fragrances already have notes. Nothing to do.

### Script crashes or times out
- Make sure you have Chrome installed (Puppeteer uses it)
- Try running with fewer fragrances by editing the `limit(50)` in the script
- Check your internet connection

### Cloudflare blocks scraping
This shouldn't happen locally, but if it does:
- Wait a few minutes and try again
- Try from a different network
- The script has a 3-second delay between requests to avoid rate limiting

### Firestore index error
First time you run the script, Firestore may ask you to create an index. Click the link in the error message - it takes you directly to the Firebase console to create it with one click.
