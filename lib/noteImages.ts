// Mapping of fragrance notes to local optimized WebP images
// Images are stored in /public/note-images-optimized/

const NOTE_IMAGES: Record<string, string> = {
  // Citrus
  bergamot: "/note-images-optimized/bergamot.webp",
  lemon: "/note-images-optimized/lemon.webp",
  orange: "/note-images-optimized/orange.webp",
  grapefruit: "/note-images-optimized/grapefruit.webp",
  lime: "/note-images-optimized/lime.webp",
  mandarin: "/note-images-optimized/mandarin.webp",
  "blood orange": "/note-images-optimized/blood_orange.webp",
  yuzu: "/note-images-optimized/yuzu.webp",
  citron: "/note-images-optimized/citron.webp",
  neroli: "/note-images-optimized/neroli.webp",
  "petit grain": "/note-images-optimized/petit_grain.webp",
  tangerine: "/note-images-optimized/tangerine.webp",

  // Floral
  rose: "/note-images-optimized/rose.webp",
  jasmine: "/note-images-optimized/jasmine.webp",
  lavender: "/note-images-optimized/lavender.webp",
  iris: "/note-images-optimized/iris.webp",
  violet: "/note-images-optimized/violet.webp",
  tuberose: "/note-images-optimized/tuberose.webp",
  peony: "/note-images-optimized/peony.webp",
  lily: "/note-images-optimized/lily.webp",
  "lily-of-the-valley": "/note-images-optimized/lily-of-the-valley.webp",
  magnolia: "/note-images-optimized/magnolia.webp",
  ylang: "/note-images-optimized/ylang-ylang.webp",
  "ylang-ylang": "/note-images-optimized/ylang-ylang.webp",
  geranium: "/note-images-optimized/geranium.webp",
  orchid: "/note-images-optimized/orchid.webp",
  carnation: "/note-images-optimized/carnation.webp",
  freesia: "/note-images-optimized/freesia.webp",
  heliotrope: "/note-images-optimized/heliotrope.webp",
  "orange blossom": "/note-images-optimized/orange_blossom.webp",
  mimosa: "/note-images-optimized/mimosa.webp",
  gardenia: "/note-images-optimized/gardenia.webp",
  frangipani: "/note-images-optimized/frangipani.webp",

  // Woods
  sandalwood: "/note-images-optimized/sandalwood.webp",
  cedar: "/note-images-optimized/cedar.webp",
  cedarwood: "/note-images-optimized/cedar.webp",
  oud: "/note-images-optimized/oud.webp",
  agarwood: "/note-images-optimized/oud.webp",
  vetiver: "/note-images-optimized/vetiver.webp",
  patchouli: "/note-images-optimized/patchouli.webp",
  oakmoss: "/note-images-optimized/oakmoss.webp",
  birch: "/note-images-optimized/birch.webp",
  guaiac: "/note-images-optimized/guaiac_wood.webp",
  "guaiac wood": "/note-images-optimized/guaiac_wood.webp",
  cypress: "/note-images-optimized/cypress.webp",
  pine: "/note-images-optimized/pine.webp",
  teak: "/note-images-optimized/teak.webp",
  bamboo: "/note-images-optimized/bamboo.webp",

  // Spices
  pepper: "/note-images-optimized/pepper.webp",
  "black pepper": "/note-images-optimized/black_pepper.webp",
  "pink pepper": "/note-images-optimized/pink_pepper.webp",
  cardamom: "/note-images-optimized/cardamom.webp",
  cinnamon: "/note-images-optimized/cinnamon.webp",
  clove: "/note-images-optimized/clove.webp",
  nutmeg: "/note-images-optimized/nutmeg.webp",
  ginger: "/note-images-optimized/ginger.webp",
  saffron: "/note-images-optimized/saffron.webp",
  cumin: "/note-images-optimized/cumin.webp",
  coriander: "/note-images-optimized/coriander.webp",
  star_anise: "/note-images-optimized/star_anise.webp",
  "star anise": "/note-images-optimized/star_anise.webp",
  anise: "/note-images-optimized/anise.webp",

  // Sweet / Gourmand
  vanilla: "/note-images-optimized/vanilla.webp",
  caramel: "/note-images-optimized/caramel.webp",
  honey: "/note-images-optimized/honey.webp",
  chocolate: "/note-images-optimized/chocolate.webp",
  coffee: "/note-images-optimized/coffee.webp",
  cocoa: "/note-images-optimized/cocoa.webp",
  almond: "/note-images-optimized/almond.webp",
  tonka: "/note-images-optimized/tonka.webp",
  "tonka bean": "/note-images-optimized/tonka_bean.webp",
  praline: "/note-images-optimized/praline.webp",
  maple: "/note-images-optimized/maple.webp",
  toffee: "/note-images-optimized/toffee.webp",

  // Fruits
  apple: "/note-images-optimized/apple.webp",
  pear: "/note-images-optimized/pear.webp",
  peach: "/note-images-optimized/peach.webp",
  apricot: "/note-images-optimized/apricot.webp",
  plum: "/note-images-optimized/plum.webp",
  raspberry: "/note-images-optimized/raspberry.webp",
  strawberry: "/note-images-optimized/strawberry.webp",
  blackberry: "/note-images-optimized/blackberry.webp",
  blackcurrant: "/note-images-optimized/blackcurrant.webp",
  "black currant": "/note-images-optimized/black_currant.webp",
  cherry: "/note-images-optimized/cherry.webp",
  fig: "/note-images-optimized/fig.webp",
  coconut: "/note-images-optimized/coconut.webp",
  pineapple: "/note-images-optimized/pineapple.webp",
  mango: "/note-images-optimized/mango.webp",
  passionfruit: "/note-images-optimized/passionfruit.webp",
  lychee: "/note-images-optimized/lychee.webp",
  cassis: "/note-images-optimized/cassis.webp",
  pomegranate: "/note-images-optimized/pomegranate.webp",
  melon: "/note-images-optimized/melon.webp",
  watermelon: "/note-images-optimized/watermelon.webp",

  // Resins & Balsams
  amber: "/note-images-optimized/amber.webp",
  benzoin: "/note-images-optimized/benzoin.webp",
  frankincense: "/note-images-optimized/frankincense.webp",
  incense: "/note-images-optimized/incense.webp",
  myrrh: "/note-images-optimized/myrrh.webp",
  labdanum: "/note-images-optimized/labdanum.webp",
  opoponax: "/note-images-optimized/opoponax.webp",
  elemi: "/note-images-optimized/elemi.webp",
  copal: "/note-images-optimized/copal.webp",

  // Musk & Animalic
  musk: "/note-images-optimized/musk.webp",
  "white musk": "/note-images-optimized/white_musk.webp",
  ambergris: "/note-images-optimized/ambergris.webp",
  civet: "/note-images-optimized/civet.webp",
  castoreum: "/note-images-optimized/castoreum.webp",
  leather: "/note-images-optimized/leather.webp",
  suede: "/note-images-optimized/suede.webp",

  // Herbs & Aromatics
  mint: "/note-images-optimized/mint.webp",
  peppermint: "/note-images-optimized/peppermint.webp",
  spearmint: "/note-images-optimized/spearmint.webp",
  basil: "/note-images-optimized/basil.webp",
  rosemary: "/note-images-optimized/rosemary.webp",
  thyme: "/note-images-optimized/thyme.webp",
  sage: "/note-images-optimized/sage.webp",
  artemisia: "/note-images-optimized/artemisia.webp",
  tarragon: "/note-images-optimized/tarragon.webp",
  eucalyptus: "/note-images-optimized/eucalyptus.webp",
  bay: "/note-images-optimized/bay.webp",
  "bay leaf": "/note-images-optimized/bay_leaf.webp",

  // Green & Fresh
  "green notes": "/note-images-optimized/green_notes.webp",
  grass: "/note-images-optimized/grass.webp",
  "green tea": "/note-images-optimized/green_tea.webp",
  tea: "/note-images-optimized/tea.webp",
  cucumber: "/note-images-optimized/cucumber.webp",
  galbanum: "/note-images-optimized/galbanum.webp",
  ivy: "/note-images-optimized/ivy.webp",

  // Aquatic & Ozonic
  "sea notes": "/note-images-optimized/sea_notes.webp",
  marine: "/note-images-optimized/marine.webp",
  aquatic: "/note-images-optimized/aquatic.webp",
  "water notes": "/note-images-optimized/water_notes.webp",
  ozone: "/note-images-optimized/ozone.webp",
  "sea salt": "/note-images-optimized/sea_salt.webp",
  seaweed: "/note-images-optimized/seaweed.webp",
  ocean: "/note-images-optimized/ocean.webp",

  // Tobacco & Smoky
  tobacco: "/note-images-optimized/tobacco.webp",
  smoke: "/note-images-optimized/smoke.webp",
  "smoky notes": "/note-images-optimized/smoky_notes.webp",
  "birch tar": "/note-images-optimized/birch_tar.webp",

  // Boozy
  rum: "/note-images-optimized/rum.webp",
  whiskey: "/note-images-optimized/whiskey.webp",
  cognac: "/note-images-optimized/cognac.webp",
  wine: "/note-images-optimized/wine.webp",
  champagne: "/note-images-optimized/champagne.webp",
  bourbon: "/note-images-optimized/bourbon.webp",

  // Other
  cotton: "/note-images-optimized/cotton.webp",
  cashmere: "/note-images-optimized/cashmere.webp",
  powder: "/note-images-optimized/powder.webp",
  "powdery notes": "/note-images-optimized/powdery_notes.webp",
};

// Normalize note name for lookup (lowercase, trim)
function normalizeNote(note: string): string {
  return note.toLowerCase().trim();
}

/**
 * Get the image URL for a fragrance note.
 * Returns undefined if no image is mapped.
 */
export function getNoteImage(note: string): string | undefined {
  const normalized = normalizeNote(note);
  return NOTE_IMAGES[normalized];
}

/**
 * Check if a note has an associated image.
 */
export function hasNoteImage(note: string): boolean {
  return getNoteImage(note) !== undefined;
}

export default NOTE_IMAGES;
