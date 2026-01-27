import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import {
  extractFragranceFromUrl,
  parseFragranticaUrl,
  generateSlug,
  scrapeFragranticaMetadata,
} from "@/lib/fragrantica";
import { DEFAULT_ELO, type FragrancePublic, type ArenaFlags } from "@/types";
import { invalidateFragranceCache } from "@/app/api/rankings/search/route";

interface AddFragranceRequest {
  url: string;
  arenas?: {
    masculine?: boolean;
    feminine?: boolean;
    unisex?: boolean;
  };
}

interface AddFragranceResponse {
  success: boolean;
  fragrance?: FragrancePublic;
  error?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<AddFragranceResponse>> {
  try {
    const body = (await request.json()) as AddFragranceRequest;
    const { url, arenas: inputArenas } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    const parsed = parseFragranticaUrl(url);
    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Fragrantica URL. Expected format: fragrantica.com/perfume/Brand/Name-ID.html",
        },
        { status: 400 }
      );
    }

    // Scrape metadata from Fragrantica first (to get gender for arena detection)
    const metadata = await scrapeFragranticaMetadata(url);

    // Build arenas - always include overall
    // Use scraped gender if available, otherwise fall back to user input
    let arenas: ArenaFlags;
    
    if (metadata.gender) {
      // Auto-detect from scraped page
      arenas = {
        overall: true,
        masculine: metadata.gender === "masculine" || metadata.gender === "unisex",
        feminine: metadata.gender === "feminine" || metadata.gender === "unisex",
        unisex: metadata.gender === "unisex",
      };
    } else if (inputArenas) {
      // Fall back to user-provided arenas
      arenas = {
        overall: true,
        masculine: inputArenas.masculine ?? false,
        feminine: inputArenas.feminine ?? false,
        unisex: inputArenas.unisex ?? false,
      };
    } else {
      // Default to overall only
      arenas = {
        overall: true,
        masculine: false,
        feminine: false,
        unisex: false,
      };
    }

    // Extract fragrance data from URL
    const data = extractFragranceFromUrl(url, arenas);

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Could not extract fragrance data from URL" },
        { status: 400 }
      );
    }

    const slug = generateSlug(data.brand, data.name);
    const db = getAdminFirestore();
    const fragrancesRef = db.collection("fragrances");

    // Check for duplicate by slug
    const existingQuery = await fragrancesRef
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return NextResponse.json(
        {
          success: false,
          error: `Fragrance "${data.brand} ${data.name}" already exists`,
        },
        { status: 409 }
      );
    }

    // Create the fragrance document
    const now = Timestamp.now();
    const docRef = fragrancesRef.doc();

    const fragranceDoc = {
      name: data.name,
      brand: data.brand,
      slug,
      imageUrl: data.imageUrl,
      arenas: data.arenas,
      elo: {
        overall: DEFAULT_ELO,
        masculine: DEFAULT_ELO,
        feminine: DEFAULT_ELO,
        unisex: DEFAULT_ELO,
      },
      stats: {
        battles: {
          overall: 0,
          masculine: 0,
          feminine: 0,
          unisex: 0,
        },
        wins: {
          overall: 0,
          masculine: 0,
          feminine: 0,
          unisex: 0,
        },
      },
      // Store fragranticaId for "Learn more" link on detail page
      fragranticaId: data.id,
      // Scraped metadata (may be undefined if scraping failed)
      ...(metadata.year && { year: metadata.year }),
      ...(metadata.concentration && { concentration: metadata.concentration }),
      ...(metadata.perfumer && { perfumer: metadata.perfumer }),
      ...(metadata.description && { description: metadata.description }),
      ...(metadata.accords && metadata.accords.length > 0 && { accords: metadata.accords }),
      ...(metadata.notes && { notes: metadata.notes }),
      // Flag for backfill if notes weren't scraped (production skips scraping)
      needsBackfill: !metadata.notes,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(fragranceDoc);

    // Invalidate fragrance cache after adding new fragrance
    invalidateFragranceCache();

    const fragrance: FragrancePublic = {
      id: docRef.id,
      name: data.name,
      brand: data.brand,
      slug,
      imageUrl: data.imageUrl,
    };

    return NextResponse.json({ success: true, fragrance });
  } catch (error) {
    console.error("Error adding fragrance:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
