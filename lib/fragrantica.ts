import type { ArenaFlags } from "@/types";

export interface FragranticaData {
  id: number;
  name: string;
  brand: string;
  imageUrl: string;
  arenas: ArenaFlags;
}

export interface FragranticaMetadata {
  year?: number;
  concentration?: string;
  perfumer?: string;
  description?: string;
  accords?: string[];
  notes?: {
    top?: string[];
    middle?: string[];
    base?: string[];
    all?: string[];
  };
  gender?: "masculine" | "feminine" | "unisex";
}

export interface ParsedUrl {
  id: number;
  brand: string;
  name: string;
}

/**
 * Convert a URL slug to a readable name
 * e.g., "Tom-Ford" -> "Tom Ford", "L-Homme" -> "L'Homme"
 */
function slugToName(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    // Handle common patterns like "L Homme" -> "L'Homme"
    .replace(/\bL\s+/gi, "L'")
    .replace(/\bD\s+/gi, "D'");
}

/**
 * Parse a Fragrantica URL to extract the fragrance ID, brand, and name
 * URL format: https://www.fragrantica.com/perfume/Brand-Name/Fragrance-Name-12345.html
 */
export function parseFragranticaUrl(url: string): ParsedUrl | null {
  try {
    const urlObj = new URL(url);

    // Validate domain
    if (
      !urlObj.hostname.includes("fragrantica.com") &&
      !urlObj.hostname.includes("fragrantica.ru")
    ) {
      return null;
    }

    // Extract path: /perfume/Brand/Name-ID.html
    const match = urlObj.pathname.match(
      /\/perfume\/([^/]+)\/([^/]+)-(\d+)\.html$/i
    );

    if (!match) {
      return null;
    }

    const [, brandSlug, nameSlug, idStr] = match;
    const id = parseInt(idStr, 10);

    if (isNaN(id)) {
      return null;
    }

    return {
      id,
      brand: slugToName(brandSlug),
      name: slugToName(nameSlug),
    };
  } catch {
    return null;
  }
}

/**
 * Get the direct image URL for a fragrance by ID
 */
export function getFragranticaImageUrl(id: number): string {
  return `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg`;
}

/**
 * Extract fragrance data from a Fragrantica URL (no scraping needed)
 */
export function extractFragranceFromUrl(
  url: string,
  arenas: ArenaFlags
): FragranticaData | null {
  const parsed = parseFragranticaUrl(url);

  if (!parsed) {
    return null;
  }

  return {
    id: parsed.id,
    name: parsed.name,
    brand: parsed.brand,
    imageUrl: getFragranticaImageUrl(parsed.id),
    arenas,
  };
}

/**
 * Generate a URL-safe slug from brand and name
 */
export function generateSlug(brand: string, name: string): string {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Scrape metadata from a Fragrantica page using Puppeteer
 * Uses Browserless.io for remote browser execution in production
 */
export async function scrapeFragranticaMetadata(
  url: string
): Promise<FragranticaMetadata> {
  const metadata: FragranticaMetadata = {};

  // Check for Browserless API key
  const browserlessKey = process.env.BROWSERLESS_API_KEY;
  if (!browserlessKey) {
    console.warn("BROWSERLESS_API_KEY not set, skipping metadata scrape");
    return metadata;
  }

  let browser;
  try {
    const puppeteer = await import("puppeteer-core");
    
    console.log("Connecting to Browserless...");
    
    // Connect to Browserless.io remote browser with stealth mode
    browser = await puppeteer.default.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessKey}&stealth=true&blockAds=true`,
    });

    console.log("Browser launched, creating page...");
    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log(`Navigating to ${url}...`);
    
    // Navigate to the page with timeout
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Check if we hit Cloudflare challenge
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    if (title.includes("Just a moment") || title.includes("Cloudflare")) {
      // Wait for Cloudflare challenge to resolve
      console.log("Cloudflare challenge detected, waiting...");
      await new Promise(resolve => setTimeout(resolve, 8000));
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
    }

    // Wait for notes to load (they're dynamically rendered)
    await page.waitForSelector('a[href*="/notes/"]', { timeout: 15000 }).catch(() => {
      console.log("No notes selector found after waiting, continuing anyway...");
    });

    console.log("Page loaded, extracting data...");

    // Extract data using page.evaluate
    const scraped = await page.evaluate(() => {
      const result: {
        year?: number;
        concentration?: string;
        perfumer?: string;
        description?: string;
        accords?: string[];
        notes?: {
          top?: string[];
          middle?: string[];
          base?: string[];
          all?: string[];
        };
        gender?: "masculine" | "feminine" | "unisex";
      } = {};

      // Get full page text for pattern matching
      const bodyText = document.body.innerText || "";

      // Extract year - look for "launched in XXXX" or year patterns
      const yearMatch = bodyText.match(
        /(?:launched|introduced|released|created)\s+(?:in\s+)?(\d{4})/i
      );
      if (yearMatch) {
        const year = parseInt(yearMatch[1], 10);
        if (year >= 1900 && year <= new Date().getFullYear() + 1) {
          result.year = year;
        }
      }

      // Fallback: look for year in parentheses near the title
      if (!result.year) {
        const h1 = document.querySelector("h1");
        if (h1) {
          const h1Text = h1.textContent || "";
          const parenYear = h1Text.match(/\((\d{4})\)/);
          if (parenYear) {
            result.year = parseInt(parenYear[1], 10);
          }
        }
      }

      // Extract concentration from page text
      const concPatterns = [
        /\b(Eau de Parfum)\b/i,
        /\b(Eau de Toilette)\b/i,
        /\b(Parfum)\b/i,
        /\b(Extrait de Parfum)\b/i,
        /\b(Eau de Cologne)\b/i,
        /\b(Eau Fraiche)\b/i,
      ];

      const concMap: Record<string, string> = {
        "eau de parfum": "EDP",
        "eau de toilette": "EDT",
        parfum: "Parfum",
        "extrait de parfum": "Extrait",
        "eau de cologne": "EDC",
        "eau fraiche": "Eau Fraiche",
      };

      for (const pattern of concPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          result.concentration = concMap[match[1].toLowerCase()] || match[1];
          break;
        }
      }

      // Extract perfumer - look for /noses/ links
      const noseLinks = document.querySelectorAll('a[href*="/noses/"]');
      const perfumers: string[] = [];
      const skipNames = ["perfumers", "perfumer", "noses", "more", "all"];
      noseLinks.forEach((link) => {
        const name = (link.textContent || "").trim();
        const nameLower = name.toLowerCase();
        if (
          name.length > 2 &&
          name.length < 50 &&
          !skipNames.some((skip) => nameLower === skip || nameLower.includes(skip)) &&
          !perfumers.includes(name)
        ) {
          perfumers.push(name);
        }
      });
      if (perfumers.length > 0) {
        result.perfumer = perfumers.slice(0, 2).join(", ");
      }

      // Extract description
      const descSelectors = [
        '[itemprop="description"]',
        ".fragrantica-blockquote",
        "blockquote",
        ".reviewstrigger",
      ];

      for (const selector of descSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          let text = (el.textContent || "").trim().replace(/\s+/g, " ");
          if (text.length > 20) {
            if (text.length > 150) {
              text = text.substring(0, 147) + "...";
            }
            result.description = text;
            break;
          }
        }
      }

      // Extract gender
      const mainText = bodyText.substring(0, 500).toLowerCase();
      if (/for (men and women|women and men)/i.test(mainText) || /\bunisex\b/i.test(mainText)) {
        result.gender = "unisex";
      } else if (/fragrance for women/i.test(mainText) || /\bfor women\b/i.test(mainText)) {
        result.gender = "feminine";
      } else if (/fragrance for men/i.test(mainText) || /\bfor men\b/i.test(mainText)) {
        result.gender = "masculine";
      }

      // Extract accords
      const accords: string[] = [];
      const accordElements = document.querySelectorAll('[class*="accord"]');
      accordElements.forEach((el) => {
        const text = (el.textContent || "").trim().toLowerCase();
        if (
          text.length > 2 &&
          text.length < 30 &&
          !text.includes("(") &&
          !text.includes("%") &&
          !accords.includes(text)
        ) {
          accords.push(text);
        }
      });
      if (accords.length > 0) {
        result.accords = accords.slice(0, 6);
      }

      // Extract notes pyramid
      const notes: { top?: string[]; middle?: string[]; base?: string[]; all?: string[] } = {};
      const uncategorizedNotes: string[] = [];
      
      const allNoteLinks = document.querySelectorAll('a[href*="/notes/"]');
      
      allNoteLinks.forEach((link) => {
        const name = (link.textContent || "").trim();
        if (name.length < 2 || name.length > 40 || name.toLowerCase() === "notes") {
          return;
        }
        
        // Check ancestors for category text
        let el: Element | null = link;
        for (let depth = 0; depth < 5 && el; depth++) {
          el = el.parentElement;
          if (!el) break;
          
          const text = (el.textContent || "").toLowerCase().substring(0, 20);
          
          if (text.startsWith("top note")) {
            if (!notes.top) notes.top = [];
            if (!notes.top.includes(name) && notes.top.length < 6) {
              notes.top.push(name);
            }
            return;
          }
          if (text.startsWith("middle note") || text.startsWith("heart note")) {
            if (!notes.middle) notes.middle = [];
            if (!notes.middle.includes(name) && notes.middle.length < 6) {
              notes.middle.push(name);
            }
            return;
          }
          if (text.startsWith("base note")) {
            if (!notes.base) notes.base = [];
            if (!notes.base.includes(name) && notes.base.length < 6) {
              notes.base.push(name);
            }
            return;
          }
        }
        
        if (!uncategorizedNotes.includes(name) && uncategorizedNotes.length < 12) {
          uncategorizedNotes.push(name);
        }
      });
      
      if (notes.top || notes.middle || notes.base) {
        result.notes = notes;
      } else if (uncategorizedNotes.length > 0) {
        result.notes = { all: uncategorizedNotes };
      }

      return result;
    });

    // Copy scraped data to metadata
    if (scraped.year) metadata.year = scraped.year;
    if (scraped.concentration) metadata.concentration = scraped.concentration;
    if (scraped.perfumer) metadata.perfumer = scraped.perfumer;
    if (scraped.description) metadata.description = scraped.description;
    if (scraped.accords && scraped.accords.length > 0) metadata.accords = scraped.accords;
    if (scraped.notes) metadata.notes = scraped.notes;
    if (scraped.gender) metadata.gender = scraped.gender;

    console.log("Scraped metadata:", JSON.stringify(metadata));
  } catch (error) {
    console.error("Failed to scrape Fragrantica metadata:", error);
  } finally {
    if (browser) {
      await browser.disconnect();
      console.log("Disconnected from Browserless");
    }
  }

  return metadata;
}
