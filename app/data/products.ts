export type ProductCategory = "t-shirts" | "performance-jerseys" | "hoodies" | "cornhole-bags" | "custom-boards";

export type Product = {
  slug: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  price: number;
  image: string;
  alt: string;
  eyebrow: string;
  description: string;
  features: string[];
  colors: string[];
  sizes: string[];
  badge?: string;
  speedFast?: number;
  speedControl?: number;
};

export const categoryOrder: { slug: ProductCategory; name: string; description: string }[] = [
  { slug: "t-shirts", name: "T-Shirts", description: "Soft ring-spun cotton in core and heritage graphics." },
  { slug: "performance-jerseys", name: "Performance Jerseys", description: "Full-print team jerseys made for league and tournament play." },
  { slug: "hoodies", name: "Hoodies", description: "Layer-ready YG apparel for cool nights on the boards." },
  { slug: "cornhole-bags", name: "Cornhole Bags", description: "ACL-style sets with distinct artwork and competition feel." },
  { slug: "custom-boards", name: "Custom Boards", description: "Regulation builds carrying custom artwork from edge to edge." },
];

const tShirtFeatures = [
  "4.5 oz./yd² (US) / 7.5 oz./L yd (CA), 100% U.S. ring-spun cotton",
  "Soft ring-spun cotton and breathable cotton blends",
  "Modern classic fit",
  "Narrow-width rib collar",
  "Taped neck and shoulders",
  "Tear-away label",
];

const jerseyFeatures = [
  "Lightweight, breathable performance knit",
  "Full-color sublimated graphics",
  "Modern athletic fit with room to throw",
  "Crew neck with reinforced shoulder seams",
  "Player-name and sponsor placement available",
  "Built for league nights and tournament weekends",
];

const bagFeatures = [
  "Competition-size set of four bags",
  "Double-stitched construction for repeatable play",
  "Textured grip and consistent hand feel",
  "Rounded corners for a clean release",
  "Player-tuned fill distribution",
  "Designed and finished by YG Cornhole",
];

const boardFeatures = [
  "Regulation 24 × 48 inch playing surface",
  "Premium smooth-finish top for predictable slide",
  "Reinforced frame built for league and backyard play",
  "Full-coverage custom artwork",
  "Rounded corners and tournament-style profile",
  "Available as a single display board or matched playing set",
];

export const products: Product[] = [
  {
    slug: "heritage-flag-blue-tee",
    name: "Heritage Flag Tee — Blue",
    category: "t-shirts",
    categoryLabel: "T-Shirts",
    price: 24.99,
    image: "/images/shop/heritage-blue-tee.jpeg",
    alt: "Blue YG Bag Co T-shirt with American flag wordmark",
    eyebrow: "Everyday cotton",
    description: "A soft blue ring-spun tee carrying the YG wordmark in red, white, and blue.",
    features: tShirtFeatures,
    colors: ["Heather Blue"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    badge: "New",
  },
  {
    slug: "heritage-flag-orange-tee",
    name: "Heritage Flag Tee — Orange",
    category: "t-shirts",
    categoryLabel: "T-Shirts",
    price: 24.99,
    image: "/images/shop/heritage-orange-tee.jpeg",
    alt: "Orange YG Bag Co T-shirt with American flag wordmark",
    eyebrow: "Everyday cotton",
    description: "A high-visibility orange tee with the patriotic YG wordmark across the chest.",
    features: tShirtFeatures,
    colors: ["Heather Orange"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    slug: "heritage-flag-charcoal-tee",
    name: "Heritage Flag Tee — Charcoal",
    category: "t-shirts",
    categoryLabel: "T-Shirts",
    price: 24.99,
    image: "/images/shop/heritage-charcoal-tee.jpeg",
    alt: "Charcoal YG Bag Co T-shirt with American flag wordmark",
    eyebrow: "Everyday cotton",
    description: "A charcoal ring-spun tee with the red, white, and blue YG wordmark.",
    features: tShirtFeatures,
    colors: ["Heather Charcoal"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    slug: "core-mark-blue-tee",
    name: "Core Mark Tee — Blue",
    category: "t-shirts",
    categoryLabel: "T-Shirts",
    price: 24.99,
    image: "/images/shop/mark-blue-tee.jpeg",
    alt: "Blue T-shirt with black and white YGBC square mark",
    eyebrow: "Core collection",
    description: "The compact YGBC mark on a soft blue shirt made for everyday rotation.",
    features: tShirtFeatures,
    colors: ["Heather Blue"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    slug: "core-mark-orange-tee",
    name: "Core Mark Tee — Orange",
    category: "t-shirts",
    categoryLabel: "T-Shirts",
    price: 24.99,
    image: "/images/shop/mark-orange-tee.jpeg",
    alt: "Orange T-shirt with black and white YGBC square mark",
    eyebrow: "Core collection",
    description: "A clean YGBC chest mark on a bright heather-orange cotton tee.",
    features: tShirtFeatures,
    colors: ["Heather Orange"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    slug: "core-mark-charcoal-tee",
    name: "Core Mark Tee — Charcoal",
    category: "t-shirts",
    categoryLabel: "T-Shirts",
    price: 24.99,
    image: "/images/shop/mark-charcoal-tee.jpeg",
    alt: "Charcoal T-shirt with black and white YGBC square mark",
    eyebrow: "Core collection",
    description: "A low-key charcoal tee finished with the original four-square YGBC mark.",
    features: tShirtFeatures,
    colors: ["Heather Charcoal"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    slug: "past-my-bedtime-tee",
    name: "Past My Bedtime Tee",
    category: "t-shirts",
    categoryLabel: "T-Shirts",
    price: 24.99,
    image: "/images/shop/past-my-bedtime-tee.jpg",
    alt: "Black T-shirt reading It's Past My Bedtime in distressed white lettering",
    eyebrow: "Game-night favorite",
    description: "A black crew-neck tee with a bold, worn-in white graphic for the late rounds.",
    features: ["Classic crew neck", "Short sleeves", "Relaxed everyday fit", "Distressed white front graphic"],
    colors: ["Black"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    badge: "New",
  },
  {
    slug: "wolfman-red-performance-jersey",
    name: "2K JERSEY",
    category: "performance-jerseys",
    categoryLabel: "Performance Jerseys",
    price: 39.99,
    image: "/images/shop/wolfman-red-jersey.jpeg",
    alt: "Red and gold 2K YG Bag Co performance jersey shown front and back",
    eyebrow: "Player series",
    description: "A red-and-gold full-print performance jersey made for tournament play.",
    features: jerseyFeatures,
    colors: ["Red / Gold"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
    badge: "Team ready",
  },
  {
    slug: "knights-black-performance-jersey",
    name: "1K JERSEY",
    category: "performance-jerseys",
    categoryLabel: "Performance Jerseys",
    price: 39.99,
    image: "/images/shop/knights-black-jersey.jpeg",
    alt: "Black, white, and gold 1K YG Bag Co performance jersey shown front and back",
    eyebrow: "Player series",
    description: "A sharp black-and-gold tournament jersey with a complete sponsor-ready back.",
    features: jerseyFeatures,
    colors: ["Black / Gold"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  },
  {
    slug: "liberty-drip-performance-jersey",
    name: "Liberty Jersey",
    category: "performance-jerseys",
    categoryLabel: "Performance Jerseys",
    price: 39.99,
    image: "/images/shop/liberty-drip-jersey.jpeg",
    alt: "Red, white, and blue paint-drip YG Bag Co performance jersey",
    eyebrow: "Liberty series",
    description: "A red, white, and blue performance top with a bold paint-drip finish.",
    features: jerseyFeatures,
    colors: ["Red / White / Blue"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  },
  {
    slug: "black-gold-shop-hoodie",
    name: "Black & Gold Hoodie",
    category: "hoodies",
    categoryLabel: "Hoodies",
    price: 49.99,
    image: "/images/shop/black-gold-hoodie.jpeg",
    alt: "White and black YG Bag Co hoodie with gold accents",
    eyebrow: "Cold-weather layer",
    description: "A heavyweight-feel hoodie with black sleeves, gold marks, and a roomy front pocket.",
    features: ["Soft brushed interior", "Structured hood with drawcord", "Roomy kangaroo pocket", "Ribbed cuffs and hem", "Full-color YG graphics", "Modern unisex fit"],
    colors: ["White / Black / Gold"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    slug: "patriot-flag-hoodie",
    name: "Patriot Flag Hoodie",
    category: "hoodies",
    categoryLabel: "Hoodies",
    price: 49.99,
    image: "/images/shop/patriot-flag-hoodie.jpg",
    alt: "Red, white, and blue YG Bag Co hoodie with American flag graphics",
    eyebrow: "Patriot collection",
    description: "A red, white, and blue YG hoodie with stars, stripes, and a roomy front pocket.",
    features: ["Adjustable drawcord hood", "Roomy kangaroo pocket", "Ribbed cuffs and hem", "Full-color patriotic graphics", "Modern unisex fit"],
    colors: ["Red / White / Blue"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    badge: "New",
  },
  {
    slug: "phenom-x-bags",
    name: "Phenom X",
    category: "cornhole-bags",
    categoryLabel: "Cornhole Bags",
    price: 79.99,
    image: "/images/shop/phenom-x.jpeg",
    alt: "Patriotic skull Phenom X cornhole bag with three bags stacked behind it",
    eyebrow: "ACL Pro 2027",
    description: "A quick, confident hybrid for players who want finish speed without giving up a readable control side.",
    features: ["Fast side speed: 7", "Control side speed: 4.5", ...bagFeatures],
    colors: ["Patriot Skull"],
    sizes: ["Set of 4"],
    badge: "ACL Pro",
    speedFast: 7,
    speedControl: 4.5,
  },
  {
    slug: "felon-x-bags",
    name: "Felon X",
    category: "cornhole-bags",
    categoryLabel: "Cornhole Bags",
    price: 79.99,
    image: "/images/shop/felon-x.jpeg",
    alt: "Patriotic Felon X cornhole bag with three bags stacked behind it",
    eyebrow: "ACL Pro 2027",
    description: "The true-balance choice: enough pace to collect while the five-speed control side stays composed through the middle.",
    features: ["Fast side speed: 7", "Control side speed: 5", ...bagFeatures],
    colors: ["Patriot Mark"],
    sizes: ["Set of 4"],
    speedFast: 7,
    speedControl: 5,
  },
  {
    slug: "menace-x-bags",
    name: "Menace X",
    category: "cornhole-bags",
    categoryLabel: "Cornhole Bags",
    price: 79.99,
    image: "/images/shop/menace-x.jpeg",
    alt: "Patriotic Menace X cornhole bag with three bags stacked behind it",
    eyebrow: "ACL Pro 2027",
    description: "A hard-charging eight-speed finish paired with a sticky three-speed side for blocks, cuts, and dirty-board work.",
    features: ["Fast side speed: 8", "Control side speed: 3", ...bagFeatures],
    colors: ["Patriot Mark"],
    sizes: ["Set of 4"],
    speedFast: 8,
    speedControl: 3,
  },
  {
    slug: "prodigy-x-bags",
    name: "Prodigy X",
    category: "cornhole-bags",
    categoryLabel: "Cornhole Bags",
    price: 79.99,
    image: "/images/shop/prodigy-x.jpeg",
    alt: "Patriotic skull Prodigy X cornhole bag with three bags stacked behind it",
    eyebrow: "ACL Pro 2027",
    description: "A versatile eight-and-five pairing for a quick finish, dependable pushes, and an easy everyday control side.",
    features: ["Fast side speed: 8", "Control side speed: 5", ...bagFeatures],
    colors: ["Patriot Skull"],
    sizes: ["Set of 4"],
    speedFast: 8,
    speedControl: 5,
  },
  {
    slug: "hellion-x-bags",
    name: "Hellion X",
    category: "cornhole-bags",
    categoryLabel: "Cornhole Bags",
    price: 79.99,
    image: "/images/shop/hellion-x.jpeg",
    alt: "Patriotic Hellion X cornhole bag with three bags stacked behind it",
    eyebrow: "ACL Pro 2027",
    description: "A fast eight-speed side with a four-speed control face for players who want pace, shape, and recovery in one set.",
    features: ["Fast side speed: 8", "Control side speed: 4", ...bagFeatures],
    colors: ["Ice Blue / Patriot"],
    sizes: ["Set of 4"],
    speedFast: 8,
    speedControl: 4,
  },
  {
    slug: "clarkston-eagles-custom-board",
    name: "Custom Boards",
    category: "custom-boards",
    categoryLabel: "Custom Boards",
    price: 249.99,
    image: "/images/shop/custom-boards-knights.png",
    alt: "Burgundy and black Knights artwork for a custom YG Cornhole board",
    eyebrow: "Custom build",
    description: "A custom cornhole board design featuring bold Knights artwork in burgundy, black, and white.",
    features: boardFeatures,
    colors: ["Burgundy / Black"],
    sizes: ["Single board", "Regulation set"],
    badge: "Custom build",
  },
];

export const BOARD_SHIPPING_CENTS = 10_000;

export function shippingCentsForCart(lines: ReadonlyArray<{ slug: string; quantity: number }>) {
  return lines.reduce((total, line) =>
    total + (getProduct(line.slug)?.category === "custom-boards" ? BOARD_SHIPPING_CENTS * line.quantity : 0), 0);
}

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}
