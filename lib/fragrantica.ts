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
 * Returns partial data if some fields can't be extracted
 */
export async function scrapeFragranticaMetadata(
  url: string
): Promise<FragranticaMetadata> {
  const metadata: FragranticaMetadata = {};

  // Dynamic import to avoid loading Puppeteer on every request
  let puppeteer;
  try {
    puppeteer = await import("puppeteer");
  } catch {
    console.warn("Puppeteer not available, skipping metadata scrape");
    return metadata;
  }

  let browser;
  try {
    browser = await puppeteer.default.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Navigate to the page with timeout
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // Wait a moment for dynamic content
    await page.waitForSelector("body", { timeout: 5000 });

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
      const bodyHtml = document.body.innerHTML || "";

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

      // Extract description - look for the main description/review text
      // Fragrantica typically has an italicized description or blockquote
      const descSelectors = [
        '[itemprop="description"]',
        ".fragrantica-blockquote",
        "blockquote",
        ".reviewstrigger", // Sometimes description is here
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

      // Fallback: look for first substantial paragraph
      if (!result.description) {
        const paragraphs = document.querySelectorAll("p");
        for (const p of paragraphs) {
          const text = (p.textContent || "").trim();
          if (text.length > 50 && text.length < 300) {
            result.description =
              text.length > 150 ? text.substring(0, 147) + "..." : text;
            break;
          }
        }
      }

      // Extract gender from "for men", "for women", "for men and women" patterns
      // Look specifically at the main description area (first 500 chars) to avoid false matches
      // from "similar fragrances for men" sections
      const mainText = bodyText.substring(0, 500).toLowerCase();
      
      // Check for unisex patterns first (most specific)
      if (/for (men and women|women and men)/i.test(mainText) || /\bunisex\b/i.test(mainText)) {
        result.gender = "unisex";
      } else if (/fragrance for women/i.test(mainText) || /\bfor women\b/i.test(mainText)) {
        result.gender = "feminine";
      } else if (/fragrance for men/i.test(mainText) || /\bfor men\b/i.test(mainText)) {
        result.gender = "masculine";
      }

      // Extract main accords - these are typically in colored bars or a specific section
      const accords: string[] = [];
      
      // Look for accord bars - they usually have "accord" in class or are in a specific container
      const accordSelectors = [
        '[class*="accord"]',
        '.accord-bar',
        '.cell.accord-box span',
        'div[style*="background"] span', // Colored bars often have inline background
      ];
      
      for (const selector of accordSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          const text = (el.textContent || "").trim().toLowerCase();
          // Filter to valid accord names (usually single or two words)
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
        if (accords.length > 0) break;
      }
      
      // Fallback: look for common accord keywords in page text
      if (accords.length === 0) {
        const commonAccords = [
          "woody", "aromatic", "citrus", "fresh", "floral", "oriental",
          "amber", "musky", "powdery", "sweet", "spicy", "green",
          "aquatic", "earthy", "leather", "smoky", "fruity", "gourmand",
          "balsamic", "animalic", "ozonic", "warm spicy", "fresh spicy",
          "soft spicy", "white floral", "yellow floral", "mossy", "oud"
        ];
        const bodyLower = bodyText.toLowerCase();
        for (const accord of commonAccords) {
          // Look for accord mentioned near "main accords" or in accord-related context
          if (bodyLower.includes(accord) && accords.length < 6) {
            accords.push(accord);
          }
        }
      }
      
      if (accords.length > 0) {
        result.accords = accords.slice(0, 6); // Limit to top 6
      }

      // Extract notes pyramid (top, middle/heart, base)
      const notes: { top?: string[]; middle?: string[]; base?: string[]; all?: string[] } = {};
      const uncategorizedNotes: string[] = [];
      
      // Find note links and categorize by ancestor text at depth 2-3
      // Debug showed: at depth 2, parent text starts with category name
      // e.g., "top notesbergamotblack currant..." or "middle notespineapple..."
      const allNoteLinks = document.querySelectorAll('a[href*="/notes/"]');
      
      allNoteLinks.forEach((link) => {
        const name = (link.textContent || "").trim();
        if (
          name.length < 2 ||
          name.length > 40 ||
          name.toLowerCase() === "notes"
        ) {
          return;
        }
        
        let categorized = false;
        
        // Check ancestors at depth 2-4 for category text
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
            categorized = true;
            return;
          }
          if (text.startsWith("middle note") || text.startsWith("heart note")) {
            if (!notes.middle) notes.middle = [];
            if (!notes.middle.includes(name) && notes.middle.length < 6) {
              notes.middle.push(name);
            }
            categorized = true;
            return;
          }
          if (text.startsWith("base note")) {
            if (!notes.base) notes.base = [];
            if (!notes.base.includes(name) && notes.base.length < 6) {
              notes.base.push(name);
            }
            categorized = true;
            return;
          }
        }
        
        // If not categorized, add to uncategorized list
        if (!categorized && !uncategorizedNotes.includes(name) && uncategorizedNotes.length < 12) {
          uncategorizedNotes.push(name);
        }
      });
      
      // If we found categorized notes, use those
      // Otherwise, fall back to uncategorized notes as "all"
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

    console.log("Scraped metadata:", metadata);
  } catch (error) {
    console.warn("Failed to scrape Fragrantica metadata:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return metadata;
}
