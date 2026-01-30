# Scripts Guide

## Quick Reference

```bash
# Full setup workflow:
npm run seed                              # 1. Seed fragrances
npx tsx scripts/populateFragranceMetadata.ts  # 2. Add curated metadata
npx tsx scripts/backfillMetadata.ts       # 3. Scrape notes from Fragrantica
npx tsx scripts/addRandomOrder.ts         # 4. Add randomOrder for matchmaking

# After adding fragrances via website:
npx tsx scripts/backfillMetadata.ts       # Scrape notes for new fragrances

# Add trending fragrances from Fragrantica:
npx tsx scripts/scrapePulse.ts            # Scrape Fragrantica Pulse page
```

---

## Prerequisites

### Firecrawl API Key (Required for Scraping)

The scraping scripts use [Firecrawl](https://firecrawl.dev) to bypass Cloudflare and handle IP rotation.

1. Sign up at https://firecrawl.dev
2. Get your API key
3. Add to `.env.local`:
   ```
   FIRECRAWL_API_KEY=fc-your-api-key-here
   ```

The free tier includes 500 credits - enough for initial testing.

---

## Backfilling Fragrance Metadata (Notes, Year, Perfumer, etc.)

### The Problem

Fragrantica has Cloudflare protection that blocks scraping. When you add a fragrance via the website, **notes and other metadata can't be scraped in production**.

### The Solution

1. Fragrances are added without notes (they still work, just missing note data)
2. Run the backfill script to populate the missing data using Firecrawl

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
| `addRandomOrder.ts` | Add randomOrder field for matchmaking | After bulk imports (migration) |

---

## Scraping Trending Fragrances from Fragrantica Pulse

The Pulse page (https://www.fragrantica.com/pulse/) shows fragrances with the most "buzz" - useful for adding popular/trending fragrances to your database.

```bash
# Default (no limit)
npx tsx scripts/scrapePulse.ts

# Limit to 50 new fragrances
npx tsx scripts/scrapePulse.ts --limit=50
```

This script:
1. Uses Firecrawl to scrape the Fragrantica Pulse page
2. Extracts all fragrance links
3. Pre-filters existing fragrances (fast Firestore check)
4. For each new fragrance:
   - Scrapes full metadata via Firecrawl
   - Adds to Firestore with notes, accords, gender, year, etc.

The script automatically:
- Uses Firecrawl's managed infrastructure (no IP blocking!)
- Skips existing fragrances before scraping
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

### "FIRECRAWL_API_KEY environment variable is required"
Add your Firecrawl API key to `.env.local`:
```
FIRECRAWL_API_KEY=fc-your-api-key-here
```

### Script crashes or times out
- Check your internet connection
- Try running with `--limit=10` to test with fewer fragrances
- Check your Firecrawl dashboard for API usage/errors

### Firestore index error
First time you run the script, Firestore may ask you to create an index. Click the link in the error message - it takes you directly to the Firebase console to create it with one click.
