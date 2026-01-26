import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse";

interface SeedFragrance {
  name: string;
  brand: string;
  arenas: {
    overall: boolean;
    masculine: boolean;
    feminine: boolean;
    unisex: boolean;
  };
  imageUrl?: string;
  fragranticaId?: number;
  description?: string;
  notes?: {
    all?: string[];
  };
}

function cleanBrand(designer: string): string {
  // Remove "perfumes and colognes" suffix and capitalize properly
  return designer
    .replace(/\s*perfumes and colognes\s*/i, "")
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .trim();
}

function extractName(title: string, brand: string): string {
  // Title format: "Fragrance Name Brand for women and men"
  // Remove brand and gender suffix
  let name = title
    .replace(/\s+for\s+(women|men|women and men|men and women)\s*$/i, "")
    .trim();

  // Remove the brand from the end if present
  const brandLower = brand.toLowerCase();
  const nameLower = name.toLowerCase();
  if (nameLower.endsWith(brandLower)) {
    name = name.slice(0, -brand.length).trim();
  }

  return name;
}

function extractFragranticaId(url: string): number | undefined {
  // URL format: https://www.fragrantica.com/perfume/Brand/Name-12345.html
  const match = url.match(/-(\d+)\.html$/);
  return match ? parseInt(match[1], 10) : undefined;
}

function determineArenas(title: string): SeedFragrance["arenas"] {
  const titleLower = title.toLowerCase();
  
  // Check for unisex patterns first (order matters)
  const isUnisex =
    titleLower.includes("for women and men") ||
    titleLower.includes("for men and women") ||
    titleLower.includes("unisex");
  
  if (isUnisex) {
    return {
      overall: true,
      masculine: false,
      feminine: false,
      unisex: true,
    };
  }
  
  const forWomen = titleLower.includes("for women");
  const forMen = titleLower.includes("for men");

  if (forWomen) {
    return {
      overall: true,
      masculine: false,
      feminine: true,
      unisex: false,
    };
  } else if (forMen) {
    return {
      overall: true,
      masculine: true,
      feminine: false,
      unisex: false,
    };
  } else {
    // Default to unisex if no gender specified
    return {
      overall: true,
      masculine: false,
      feminine: false,
      unisex: true,
    };
  }
}

function parseNotes(notesStr: string): string[] | undefined {
  // Notes are stored as Python list string: "['Note1', 'Note2']"
  try {
    // Replace Python-style quotes with JSON-style
    const jsonStr = notesStr.replace(/'/g, '"').replace(/\\/g, "\\\\");
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // If parsing fails, return undefined
  }
  return undefined;
}

async function main() {
  const csvPath = path.join(process.cwd(), "perfumes_table.csv");
  const outputPath = path.join(
    process.cwd(),
    "data",
    "fragrances.from-csv.json"
  );
  const existingSeedPath = path.join(
    process.cwd(),
    "data",
    "fragrances.seed.with-images.json"
  );

  // Load existing seed data to check for duplicates
  console.log("Loading existing seed data...");
  const existingSeed: SeedFragrance[] = JSON.parse(
    fs.readFileSync(existingSeedPath, "utf-8")
  );
  const existingKeys = new Set(
    existingSeed.map((f) => `${f.name.toLowerCase()}|${f.brand.toLowerCase()}`)
  );

  console.log(`Existing seed has ${existingSeed.length} fragrances`);

  const newFragrances: SeedFragrance[] = [];
  const seen = new Set<string>();
  let rowCount = 0;

  console.log("Streaming CSV file...");

  const parser = fs.createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    })
  );

  for await (const row of parser) {
    rowCount++;
    if (rowCount % 10000 === 0) {
      console.log(`Processed ${rowCount} rows...`);
    }

    if (!row.title || !row.designer || !row.url) continue;

    const brand = cleanBrand(row.designer);
    const name = extractName(row.title, brand);

    if (!name || !brand) continue;

    const key = `${name.toLowerCase()}|${brand.toLowerCase()}`;

    // Skip if already in existing seed or already processed
    if (existingKeys.has(key) || seen.has(key)) continue;
    seen.add(key);

    const fragrance: SeedFragrance = {
      name,
      brand,
      arenas: determineArenas(row.title),
    };

    const fragranticaId = extractFragranticaId(row.url);
    if (fragranticaId) {
      fragrance.fragranticaId = fragranticaId;
    }

    if (row.description && row.description.trim()) {
      fragrance.description = row.description.trim();
    }

    const notes = parseNotes(row.notes);
    if (notes) {
      fragrance.notes = { all: notes };
    }

    newFragrances.push(fragrance);
  }

  console.log(`\nProcessed ${rowCount} total rows`);
  console.log(`Found ${newFragrances.length} new unique fragrances`);

  // Write new fragrances to a separate file
  fs.writeFileSync(outputPath, JSON.stringify(newFragrances, null, 2));
  console.log(`Wrote new fragrances to ${outputPath}`);

  // Also create a merged file
  const mergedPath = path.join(
    process.cwd(),
    "data",
    "fragrances.seed.merged.json"
  );
  const merged = [...existingSeed, ...newFragrances];
  fs.writeFileSync(mergedPath, JSON.stringify(merged, null, 2));
  console.log(`Wrote merged fragrances (${merged.length} total) to ${mergedPath}`);
}

main().catch(console.error);
