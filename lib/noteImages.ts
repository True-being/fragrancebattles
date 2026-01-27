// Mapping of fragrance notes to distinct image URLs
// Each note has a unique, relevant image

const NOTE_IMAGES: Record<string, string> = {
  // Citrus
  bergamot: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=80&h=80&fit=crop",
  lemon: "https://images.unsplash.com/photo-1590502593747-42a996133562?w=80&h=80&fit=crop",
  orange: "https://images.unsplash.com/photo-1547514701-42f466cf38e1?w=80&h=80&fit=crop",
  grapefruit: "https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?w=80&h=80&fit=crop",
  lime: "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?w=80&h=80&fit=crop",
  mandarin: "https://images.unsplash.com/photo-1482012792084-a0c3725f289f?w=80&h=80&fit=crop",
  "blood orange": "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=80&h=80&fit=crop",
  yuzu: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=80&h=80&fit=crop",
  citron: "https://images.unsplash.com/photo-1623885407210-f8f6b5e8fc2d?w=80&h=80&fit=crop",
  neroli: "https://images.unsplash.com/photo-1558098329-a11cff621064?w=80&h=80&fit=crop",
  "petit grain": "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=80&h=80&fit=crop",
  tangerine: "https://images.unsplash.com/photo-1557800636-894a64c1696f?w=80&h=80&fit=crop",

  // Floral
  rose: "https://images.unsplash.com/photo-1518882605630-8b17f65f824e?w=80&h=80&fit=crop",
  jasmine: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=80&h=80&fit=crop",
  lavender: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=80&h=80&fit=crop",
  iris: "https://images.unsplash.com/photo-1585123388867-3bfe6dd4bdbf?w=80&h=80&fit=crop",
  violet: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=80&h=80&fit=crop",
  tuberose: "https://images.unsplash.com/photo-1595235060834-61a9a81a76f6?w=80&h=80&fit=crop",
  peony: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=80&h=80&fit=crop",
  lily: "https://images.unsplash.com/photo-1583119912267-cc97c911e416?w=80&h=80&fit=crop",
  "lily-of-the-valley": "https://images.unsplash.com/photo-1588888595835-ff5dcf56b07b?w=80&h=80&fit=crop",
  magnolia: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=80&h=80&fit=crop",
  ylang: "https://images.unsplash.com/photo-1595235060834-61a9a81a76f6?w=80&h=80&fit=crop",
  "ylang-ylang": "https://images.unsplash.com/photo-1595235060834-61a9a81a76f6?w=80&h=80&fit=crop",
  geranium: "https://images.unsplash.com/photo-1598662779094-110c2bad80b5?w=80&h=80&fit=crop",
  orchid: "https://images.unsplash.com/photo-1566836610593-62a64888a216?w=80&h=80&fit=crop",
  carnation: "https://images.unsplash.com/photo-1589994160839-163cd867cfe8?w=80&h=80&fit=crop",
  freesia: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=80&h=80&fit=crop",
  heliotrope: "https://images.unsplash.com/photo-1533616688419-b7a585564566?w=80&h=80&fit=crop",
  "orange blossom": "https://images.unsplash.com/photo-1558098329-a11cff621064?w=80&h=80&fit=crop",
  mimosa: "https://images.unsplash.com/photo-1582794543662-64d9dfb6d2d7?w=80&h=80&fit=crop",
  gardenia: "https://images.unsplash.com/photo-1595235060834-61a9a81a76f6?w=80&h=80&fit=crop",
  frangipani: "https://images.unsplash.com/photo-1597511545628-f721d2f50c94?w=80&h=80&fit=crop",

  // Woods
  sandalwood: "https://images.unsplash.com/photo-1610733884712-8e3cd0f13c96?w=80&h=80&fit=crop",
  cedar: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=80&h=80&fit=crop",
  cedarwood: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=80&h=80&fit=crop",
  oud: "https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=80&h=80&fit=crop",
  agarwood: "https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=80&h=80&fit=crop",
  vetiver: "https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=80&h=80&fit=crop",
  patchouli: "https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?w=80&h=80&fit=crop",
  oakmoss: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=80&h=80&fit=crop",
  birch: "https://images.unsplash.com/photo-1508193638397-1c4234db14d9?w=80&h=80&fit=crop",
  guaiac: "https://images.unsplash.com/photo-1610733884712-8e3cd0f13c96?w=80&h=80&fit=crop",
  "guaiac wood": "https://images.unsplash.com/photo-1610733884712-8e3cd0f13c96?w=80&h=80&fit=crop",
  cypress: "https://images.unsplash.com/photo-1610878180933-123728745d22?w=80&h=80&fit=crop",
  pine: "https://images.unsplash.com/photo-1605773527852-c546a8584ea3?w=80&h=80&fit=crop",
  teak: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop",
  bamboo: "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=80&h=80&fit=crop",

  // Spices
  pepper: "https://images.unsplash.com/photo-1599909533601-fc63c9e26b96?w=80&h=80&fit=crop",
  "black pepper": "https://images.unsplash.com/photo-1599909533601-fc63c9e26b96?w=80&h=80&fit=crop",
  "pink pepper": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=80&h=80&fit=crop",
  cardamom: "https://images.unsplash.com/photo-1591288055519-1eb3e90e3580?w=80&h=80&fit=crop",
  cinnamon: "https://images.unsplash.com/photo-1608198093002-ad4e005f1600?w=80&h=80&fit=crop",
  clove: "https://images.unsplash.com/photo-1591974097470-d0dc60b01856?w=80&h=80&fit=crop",
  nutmeg: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=80&h=80&fit=crop",
  ginger: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=80&h=80&fit=crop",
  saffron: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=80&h=80&fit=crop",
  cumin: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=80&h=80&fit=crop",
  coriander: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=80&h=80&fit=crop",
  star_anise: "https://images.unsplash.com/photo-1608198093002-ad4e005f1600?w=80&h=80&fit=crop",
  anise: "https://images.unsplash.com/photo-1608198093002-ad4e005f1600?w=80&h=80&fit=crop",

  // Sweet / Gourmand
  vanilla: "https://images.unsplash.com/photo-1631206753348-db44968fd440?w=80&h=80&fit=crop",
  caramel: "https://images.unsplash.com/photo-1582928629067-70e9c88dea90?w=80&h=80&fit=crop",
  honey: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=80&h=80&fit=crop",
  chocolate: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=80&h=80&fit=crop",
  coffee: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=80&h=80&fit=crop",
  cocoa: "https://images.unsplash.com/photo-1599599811108-431d84f8836c?w=80&h=80&fit=crop",
  almond: "https://images.unsplash.com/photo-1574570068236-1fdb15e9d1a5?w=80&h=80&fit=crop",
  tonka: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop",
  "tonka bean": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop",
  praline: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=80&h=80&fit=crop",
  maple: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=80&h=80&fit=crop",
  toffee: "https://images.unsplash.com/photo-1582928629067-70e9c88dea90?w=80&h=80&fit=crop",

  // Fruits
  apple: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=80&h=80&fit=crop",
  pear: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=80&h=80&fit=crop",
  peach: "https://images.unsplash.com/photo-1595124079638-4b4d0a6e6c42?w=80&h=80&fit=crop",
  apricot: "https://images.unsplash.com/photo-1596566977983-9f63f6a45c67?w=80&h=80&fit=crop",
  plum: "https://images.unsplash.com/photo-1596566977983-9f63f6a45c67?w=80&h=80&fit=crop",
  raspberry: "https://images.unsplash.com/photo-1577069861033-55d04cec4ef5?w=80&h=80&fit=crop",
  strawberry: "https://images.unsplash.com/photo-1543528176-61b239494933?w=80&h=80&fit=crop",
  blackberry: "https://images.unsplash.com/photo-1568142556438-83e6df33c748?w=80&h=80&fit=crop",
  blackcurrant: "https://images.unsplash.com/photo-1569630797783-c9ca1e43f7eb?w=80&h=80&fit=crop",
  "black currant": "https://images.unsplash.com/photo-1569630797783-c9ca1e43f7eb?w=80&h=80&fit=crop",
  cherry: "https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=80&h=80&fit=crop",
  fig: "https://images.unsplash.com/photo-1601379760883-1bb497c558e0?w=80&h=80&fit=crop",
  coconut: "https://images.unsplash.com/photo-1550411294-56c596f0b63a?w=80&h=80&fit=crop",
  pineapple: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=80&h=80&fit=crop",
  mango: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=80&h=80&fit=crop",
  passionfruit: "https://images.unsplash.com/photo-1604495772376-9657f0035eb5?w=80&h=80&fit=crop",
  lychee: "https://images.unsplash.com/photo-1577070055571-83ccde7da4d4?w=80&h=80&fit=crop",
  cassis: "https://images.unsplash.com/photo-1569630797783-c9ca1e43f7eb?w=80&h=80&fit=crop",
  pomegranate: "https://images.unsplash.com/photo-1541344999736-4a22e0b3cf7e?w=80&h=80&fit=crop",

  // Resins & Balsams
  amber: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=80&h=80&fit=crop",
  benzoin: "https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=80&h=80&fit=crop",
  frankincense: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=80&h=80&fit=crop",
  incense: "https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=80&h=80&fit=crop",
  myrrh: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=80&h=80&fit=crop",
  labdanum: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=80&h=80&fit=crop",
  opoponax: "https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=80&h=80&fit=crop",
  elemi: "https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=80&h=80&fit=crop",
  copal: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=80&h=80&fit=crop",

  // Musk & Animalic
  musk: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=80&h=80&fit=crop",
  "white musk": "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=80&h=80&fit=crop",
  ambergris: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=80&h=80&fit=crop",
  civet: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=80&h=80&fit=crop",
  castoreum: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=80&h=80&fit=crop",
  leather: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop",
  suede: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=80&h=80&fit=crop",

  // Herbs & Aromatics
  mint: "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=80&h=80&fit=crop",
  peppermint: "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=80&h=80&fit=crop",
  spearmint: "https://images.unsplash.com/photo-1592105098698-c867c5dcab16?w=80&h=80&fit=crop",
  basil: "https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=80&h=80&fit=crop",
  rosemary: "https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=80&h=80&fit=crop",
  thyme: "https://images.unsplash.com/photo-1592105598668-e0a01e3bf8bc?w=80&h=80&fit=crop",
  sage: "https://images.unsplash.com/photo-1600298882525-c0fc00741f8f?w=80&h=80&fit=crop",
  artemisia: "https://images.unsplash.com/photo-1588864721034-4afdb05a5799?w=80&h=80&fit=crop",
  tarragon: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=80&h=80&fit=crop",
  eucalyptus: "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=80&h=80&fit=crop",
  bay: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=80&h=80&fit=crop",
  "bay leaf": "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=80&h=80&fit=crop",

  // Green & Fresh
  "green notes": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=80&h=80&fit=crop",
  grass: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=80&h=80&fit=crop",
  "green tea": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=80&h=80&fit=crop",
  tea: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=80&h=80&fit=crop",
  cucumber: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=80&h=80&fit=crop",
  melon: "https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=80&h=80&fit=crop",
  watermelon: "https://images.unsplash.com/photo-1563114773-84221bd62daa?w=80&h=80&fit=crop",
  galbanum: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=80&h=80&fit=crop",
  ivy: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=80&h=80&fit=crop",

  // Aquatic & Ozonic
  "sea notes": "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=80&h=80&fit=crop",
  marine: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=80&h=80&fit=crop",
  aquatic: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=80&h=80&fit=crop",
  "water notes": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=80&h=80&fit=crop",
  ozone: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=80&h=80&fit=crop",
  "sea salt": "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=80&h=80&fit=crop",
  seaweed: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=80&h=80&fit=crop",
  ocean: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=80&h=80&fit=crop",

  // Tobacco & Smoky
  tobacco: "https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=80&h=80&fit=crop",
  smoke: "https://images.unsplash.com/photo-1485160497022-3e09382fb310?w=80&h=80&fit=crop",
  "smoky notes": "https://images.unsplash.com/photo-1485160497022-3e09382fb310?w=80&h=80&fit=crop",
  birch_tar: "https://images.unsplash.com/photo-1485160497022-3e09382fb310?w=80&h=80&fit=crop",

  // Boozy
  rum: "https://images.unsplash.com/photo-1551751299-1b51cab2694c?w=80&h=80&fit=crop",
  whiskey: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=80&h=80&fit=crop",
  cognac: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=80&h=80&fit=crop",
  wine: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=80&h=80&fit=crop",
  champagne: "https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb?w=80&h=80&fit=crop",
  bourbon: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=80&h=80&fit=crop",

  // Other
  cotton: "https://images.unsplash.com/photo-1616627988170-851e41382eb0?w=80&h=80&fit=crop",
  cashmere: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=80&h=80&fit=crop",
  powder: "https://images.unsplash.com/photo-1608979048467-6194f86a8b3a?w=80&h=80&fit=crop",
  "powdery notes": "https://images.unsplash.com/photo-1608979048467-6194f86a8b3a?w=80&h=80&fit=crop",
  aldehydes: "https://images.unsplash.com/photo-1608979048467-6194f86a8b3a?w=80&h=80&fit=crop",
  heliotropin: "https://images.unsplash.com/photo-1608979048467-6194f86a8b3a?w=80&h=80&fit=crop",
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
