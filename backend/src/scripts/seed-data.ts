import { PrismaClient, AttractionCategory } from '@prisma/client';

const prisma = new PrismaClient();

// ============ CONTINENTS ============
const continents = [
  { name: 'Africa', code: 'AF' },
  { name: 'Antarctica', code: 'AN' },
  { name: 'Asia', code: 'AS' },
  { name: 'Europe', code: 'EU' },
  { name: 'North America', code: 'NA' },
  { name: 'Oceania', code: 'OC' },
  { name: 'South America', code: 'SA' },
];

// ============ COUNTRIES BY CONTINENT ============
const countriesByContinent: Record<string, Array<{ name: string; code: string }>> = {
  'Africa': [
    { name: 'Egypt', code: 'EG' },
    { name: 'Morocco', code: 'MA' },
    { name: 'South Africa', code: 'ZA' },
    { name: 'Kenya', code: 'KE' },
    { name: 'Tanzania', code: 'TZ' },
    { name: 'Tunisia', code: 'TN' },
    { name: 'Nigeria', code: 'NG' },
    { name: 'Ghana', code: 'GH' },
  ],
  'Asia': [
    { name: 'Japan', code: 'JP' },
    { name: 'China', code: 'CN' },
    { name: 'Thailand', code: 'TH' },
    { name: 'India', code: 'IN' },
    { name: 'Vietnam', code: 'VN' },
    { name: 'South Korea', code: 'KR' },
    { name: 'Indonesia', code: 'ID' },
    { name: 'Singapore', code: 'SG' },
    { name: 'Malaysia', code: 'MY' },
    { name: 'Philippines', code: 'PH' },
    { name: 'United Arab Emirates', code: 'AE' },
    { name: 'Turkey', code: 'TR' },
    { name: 'Israel', code: 'IL' },
    { name: 'Jordan', code: 'JO' },
  ],
  'Europe': [
    { name: 'France', code: 'FR' },
    { name: 'Italy', code: 'IT' },
    { name: 'Spain', code: 'ES' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'Germany', code: 'DE' },
    { name: 'Netherlands', code: 'NL' },
    { name: 'Greece', code: 'GR' },
    { name: 'Portugal', code: 'PT' },
    { name: 'Austria', code: 'AT' },
    { name: 'Switzerland', code: 'CH' },
    { name: 'Czech Republic', code: 'CZ' },
    { name: 'Belgium', code: 'BE' },
    { name: 'Sweden', code: 'SE' },
    { name: 'Norway', code: 'NO' },
    { name: 'Denmark', code: 'DK' },
    { name: 'Ireland', code: 'IE' },
    { name: 'Poland', code: 'PL' },
    { name: 'Croatia', code: 'HR' },
    { name: 'Hungary', code: 'HU' },
    { name: 'Iceland', code: 'IS' },
  ],
  'North America': [
    { name: 'United States', code: 'US' },
    { name: 'Canada', code: 'CA' },
    { name: 'Mexico', code: 'MX' },
    { name: 'Costa Rica', code: 'CR' },
    { name: 'Cuba', code: 'CU' },
    { name: 'Jamaica', code: 'JM' },
    { name: 'Dominican Republic', code: 'DO' },
    { name: 'Panama', code: 'PA' },
  ],
  'Oceania': [
    { name: 'Australia', code: 'AU' },
    { name: 'New Zealand', code: 'NZ' },
    { name: 'Fiji', code: 'FJ' },
    { name: 'French Polynesia', code: 'PF' },
  ],
  'South America': [
    { name: 'Brazil', code: 'BR' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Peru', code: 'PE' },
    { name: 'Chile', code: 'CL' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Ecuador', code: 'EC' },
    { name: 'Uruguay', code: 'UY' },
  ],
  'Antarctica': [],
};

// ============ CITIES BY COUNTRY ============
const citiesByCountry: Record<string, Array<{ name: string; lat: number; lng: number }>> = {
  // EUROPE
  'FR': [
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'Nice', lat: 43.7102, lng: 7.2620 },
    { name: 'Lyon', lat: 45.7640, lng: 4.8357 },
    { name: 'Marseille', lat: 43.2965, lng: 5.3698 },
  ],
  'IT': [
    { name: 'Rome', lat: 41.9028, lng: 12.4964 },
    { name: 'Venice', lat: 45.4408, lng: 12.3155 },
    { name: 'Florence', lat: 43.7696, lng: 11.2558 },
    { name: 'Milan', lat: 45.4642, lng: 9.1900 },
    { name: 'Naples', lat: 40.8518, lng: 14.2681 },
  ],
  'ES': [
    { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
    { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
    { name: 'Seville', lat: 37.3891, lng: -5.9845 },
    { name: 'Valencia', lat: 39.4699, lng: -0.3763 },
  ],
  'GB': [
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Edinburgh', lat: 55.9533, lng: -3.1883 },
    { name: 'Manchester', lat: 53.4808, lng: -2.2426 },
    { name: 'Oxford', lat: 51.7520, lng: -1.2577 },
  ],
  'DE': [
    { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
    { name: 'Munich', lat: 48.1351, lng: 11.5820 },
    { name: 'Hamburg', lat: 53.5511, lng: 9.9937 },
    { name: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
  ],
  'NL': [
    { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
    { name: 'Rotterdam', lat: 51.9244, lng: 4.4777 },
  ],
  'GR': [
    { name: 'Athens', lat: 37.9838, lng: 23.7275 },
    { name: 'Santorini', lat: 36.3932, lng: 25.4615 },
    { name: 'Mykonos', lat: 37.4467, lng: 25.3289 },
  ],
  'PT': [
    { name: 'Lisbon', lat: 38.7223, lng: -9.1393 },
    { name: 'Porto', lat: 41.1579, lng: -8.6291 },
  ],
  'AT': [
    { name: 'Vienna', lat: 48.2082, lng: 16.3738 },
    { name: 'Salzburg', lat: 47.8095, lng: 13.0550 },
  ],
  'CH': [
    { name: 'Zurich', lat: 47.3769, lng: 8.5417 },
    { name: 'Geneva', lat: 46.2044, lng: 6.1432 },
  ],
  'CZ': [
    { name: 'Prague', lat: 50.0755, lng: 14.4378 },
  ],
  'BE': [
    { name: 'Brussels', lat: 50.8503, lng: 4.3517 },
    { name: 'Bruges', lat: 51.2093, lng: 3.2247 },
  ],
  'HR': [
    { name: 'Dubrovnik', lat: 42.6507, lng: 18.0944 },
    { name: 'Split', lat: 43.5081, lng: 16.4402 },
  ],
  'HU': [
    { name: 'Budapest', lat: 47.4979, lng: 19.0402 },
  ],
  'IS': [
    { name: 'Reykjavik', lat: 64.1466, lng: -21.9426 },
  ],
  'IE': [
    { name: 'Dublin', lat: 53.3498, lng: -6.2603 },
  ],
  'SE': [
    { name: 'Stockholm', lat: 59.3293, lng: 18.0686 },
  ],
  'NO': [
    { name: 'Oslo', lat: 59.9139, lng: 10.7522 },
    { name: 'Bergen', lat: 60.3913, lng: 5.3221 },
  ],
  'DK': [
    { name: 'Copenhagen', lat: 55.6761, lng: 12.5683 },
  ],
  'PL': [
    { name: 'Warsaw', lat: 52.2297, lng: 21.0122 },
    { name: 'Krakow', lat: 50.0647, lng: 19.9450 },
  ],

  // NORTH AMERICA
  'US': [
    { name: 'New York City', lat: 40.7128, lng: -74.0060 },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
    { name: 'Las Vegas', lat: 36.1699, lng: -115.1398 },
    { name: 'Miami', lat: 25.7617, lng: -80.1918 },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
    { name: 'Washington D.C.', lat: 38.9072, lng: -77.0369 },
    { name: 'New Orleans', lat: 29.9511, lng: -90.0715 },
    { name: 'Honolulu', lat: 21.3069, lng: -157.8583 },
  ],
  'CA': [
    { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
    { name: 'Vancouver', lat: 49.2827, lng: -123.1207 },
    { name: 'Montreal', lat: 45.5017, lng: -73.5673 },
    { name: 'Quebec City', lat: 46.8139, lng: -71.2080 },
  ],
  'MX': [
    { name: 'Mexico City', lat: 19.4326, lng: -99.1332 },
    { name: 'Cancun', lat: 21.1619, lng: -86.8515 },
    { name: 'Playa del Carmen', lat: 20.6296, lng: -87.0739 },
  ],

  // ASIA
  'JP': [
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Kyoto', lat: 35.0116, lng: 135.7681 },
    { name: 'Osaka', lat: 34.6937, lng: 135.5023 },
    { name: 'Hiroshima', lat: 34.3853, lng: 132.4553 },
  ],
  'CN': [
    { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
    { name: 'Shanghai', lat: 31.2304, lng: 121.4737 },
    { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
    { name: 'Xian', lat: 34.3416, lng: 108.9398 },
  ],
  'TH': [
    { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
    { name: 'Phuket', lat: 7.8804, lng: 98.3923 },
    { name: 'Chiang Mai', lat: 18.7883, lng: 98.9853 },
  ],
  'IN': [
    { name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Agra', lat: 27.1767, lng: 78.0081 },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  ],
  'VN': [
    { name: 'Hanoi', lat: 21.0285, lng: 105.8542 },
    { name: 'Ho Chi Minh City', lat: 10.8231, lng: 106.6297 },
    { name: 'Ha Long', lat: 20.9101, lng: 107.1839 },
  ],
  'KR': [
    { name: 'Seoul', lat: 37.5665, lng: 126.9780 },
    { name: 'Busan', lat: 35.1796, lng: 129.0756 },
  ],
  'SG': [
    { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  ],
  'ID': [
    { name: 'Bali', lat: -8.3405, lng: 115.0920 },
    { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
  ],
  'AE': [
    { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
    { name: 'Abu Dhabi', lat: 24.4539, lng: 54.3773 },
  ],
  'TR': [
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
    { name: 'Cappadocia', lat: 38.6431, lng: 34.8289 },
  ],
  'IL': [
    { name: 'Jerusalem', lat: 31.7683, lng: 35.2137 },
    { name: 'Tel Aviv', lat: 32.0853, lng: 34.7818 },
  ],
  'JO': [
    { name: 'Amman', lat: 31.9454, lng: 35.9284 },
    { name: 'Petra', lat: 30.3285, lng: 35.4444 },
  ],

  // AFRICA
  'EG': [
    { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
    { name: 'Luxor', lat: 25.6872, lng: 32.6396 },
    { name: 'Giza', lat: 30.0131, lng: 31.2089 },
  ],
  'MA': [
    { name: 'Marrakech', lat: 31.6295, lng: -7.9811 },
    { name: 'Fes', lat: 34.0181, lng: -5.0078 },
    { name: 'Casablanca', lat: 33.5731, lng: -7.5898 },
  ],
  'ZA': [
    { name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
    { name: 'Johannesburg', lat: -26.2041, lng: 28.0473 },
  ],
  'KE': [
    { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
  ],
  'TZ': [
    { name: 'Zanzibar', lat: -6.1659, lng: 39.2026 },
  ],

  // SOUTH AMERICA
  'BR': [
    { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
    { name: 'Sao Paulo', lat: -23.5505, lng: -46.6333 },
    { name: 'Salvador', lat: -12.9714, lng: -38.5014 },
  ],
  'AR': [
    { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
    { name: 'Mendoza', lat: -32.8908, lng: -68.8272 },
  ],
  'PE': [
    { name: 'Lima', lat: -12.0464, lng: -77.0428 },
    { name: 'Cusco', lat: -13.5319, lng: -71.9675 },
  ],
  'CL': [
    { name: 'Santiago', lat: -33.4489, lng: -70.6693 },
    { name: 'Valparaiso', lat: -33.0472, lng: -71.6127 },
  ],
  'CO': [
    { name: 'Bogota', lat: 4.7110, lng: -74.0721 },
    { name: 'Cartagena', lat: 10.3910, lng: -75.4794 },
  ],

  // OCEANIA
  'AU': [
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
    { name: 'Brisbane', lat: -27.4698, lng: 153.0251 },
    { name: 'Perth', lat: -31.9505, lng: 115.8605 },
    { name: 'Cairns', lat: -16.9186, lng: 145.7781 },
  ],
  'NZ': [
    { name: 'Auckland', lat: -36.8509, lng: 174.7645 },
    { name: 'Queenstown', lat: -45.0312, lng: 168.6626 },
    { name: 'Wellington', lat: -41.2865, lng: 174.7762 },
  ],
};

// ============ ATTRACTIONS BY CITY ============
interface AttractionData {
  name: string;
  description: string;
  shortDescription: string;
  category: AttractionCategory;
  lat: number;
  lng: number;
  address: string;
  thumbnailUrl: string;
  images: string[];
  isFree: boolean;
  adultPrice?: number;
  currency?: string;
}

const attractionsByCity: Record<string, AttractionData[]> = {
  // PARIS
  'Paris': [
    {
      name: 'Eiffel Tower',
      description: 'The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris. Named after engineer Gustave Eiffel, it was constructed from 1887 to 1889 as the centerpiece of the 1889 World\'s Fair. The tower is 330 meters tall and offers stunning panoramic views of Paris from its observation decks.',
      shortDescription: 'Iconic iron lattice tower and symbol of Paris',
      category: 'landmark',
      lat: 48.8584,
      lng: 2.2945,
      address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=400',
      images: ['https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=800'],
      isFree: false,
      adultPrice: 26.80,
      currency: 'EUR',
    },
    {
      name: 'Louvre Museum',
      description: 'The Louvre is the world\'s largest art museum and a historic monument in Paris. Home to approximately 38,000 objects from prehistory to the 21st century, its most famous works include the Mona Lisa and the Venus de Milo. The museum is housed in the Louvre Palace, originally built as a fortress in the late 12th century.',
      shortDescription: 'World\'s largest art museum, home to the Mona Lisa',
      category: 'museum',
      lat: 48.8606,
      lng: 2.3376,
      address: 'Rue de Rivoli, 75001 Paris',
      thumbnailUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400',
      images: ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800'],
      isFree: false,
      adultPrice: 17,
      currency: 'EUR',
    },
    {
      name: 'Notre-Dame Cathedral',
      description: 'Notre-Dame de Paris is a medieval Catholic cathedral known for its French Gothic architecture. Construction began in 1163 and was completed in 1345. The cathedral is renowned for its stunning stained glass windows, flying buttresses, and gargoyles.',
      shortDescription: 'Medieval Gothic cathedral with iconic architecture',
      category: 'religious',
      lat: 48.8530,
      lng: 2.3499,
      address: '6 Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris',
      thumbnailUrl: 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=400',
      images: ['https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=800'],
      isFree: true,
    },
    {
      name: 'Arc de Triomphe',
      description: 'The Arc de Triomphe honours those who fought and died for France in the French Revolutionary and Napoleonic Wars. Standing at the western end of the Champs-Élysées, it is the linchpin of the historic axis of Paris.',
      shortDescription: 'Triumphal arch honoring French soldiers',
      category: 'landmark',
      lat: 48.8738,
      lng: 2.2950,
      address: 'Place Charles de Gaulle, 75008 Paris',
      thumbnailUrl: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=400',
      images: ['https://images.unsplash.com/photo-1549144511-f099e773c147?w=800'],
      isFree: false,
      adultPrice: 13,
      currency: 'EUR',
    },
  ],

  // ROME
  'Rome': [
    {
      name: 'Colosseum',
      description: 'The Colosseum is an oval amphitheatre in the centre of Rome, built of travertine limestone, tuff, and brick-faced concrete. The largest ancient amphitheatre ever built, it could hold between 50,000 and 80,000 spectators for gladiatorial contests and public spectacles.',
      shortDescription: 'Ancient Roman amphitheatre and iconic landmark',
      category: 'historical',
      lat: 41.8902,
      lng: 12.4922,
      address: 'Piazza del Colosseo, 1, 00184 Roma RM',
      thumbnailUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400',
      images: ['https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800'],
      isFree: false,
      adultPrice: 16,
      currency: 'EUR',
    },
    {
      name: 'Vatican Museums',
      description: 'The Vatican Museums display works from the immense collection amassed by the Catholic Church through the centuries. The museums contain roughly 70,000 works, of which 20,000 are on display, including the Sistine Chapel with Michelangelo\'s famous ceiling.',
      shortDescription: 'Vast art collection including the Sistine Chapel',
      category: 'museum',
      lat: 41.9065,
      lng: 12.4536,
      address: 'Viale Vaticano, 00165 Roma RM',
      thumbnailUrl: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400',
      images: ['https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800'],
      isFree: false,
      adultPrice: 17,
      currency: 'EUR',
    },
    {
      name: 'Trevi Fountain',
      description: 'The Trevi Fountain is the largest Baroque fountain in Rome and one of the most famous fountains in the world. Tradition holds that visitors who throw coins into the fountain are ensured a return to Rome.',
      shortDescription: 'Baroque masterpiece and Rome\'s largest fountain',
      category: 'landmark',
      lat: 41.9009,
      lng: 12.4833,
      address: 'Piazza di Trevi, 00187 Roma RM',
      thumbnailUrl: 'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=400',
      images: ['https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800'],
      isFree: true,
    },
    {
      name: 'Pantheon',
      description: 'The Pantheon is a former Roman temple and since 609 AD, a Catholic church. It is the best-preserved building of ancient Rome, with its remarkable dome featuring an oculus at the top that is the main source of natural light.',
      shortDescription: 'Best-preserved ancient Roman building',
      category: 'historical',
      lat: 41.8986,
      lng: 12.4769,
      address: 'Piazza della Rotonda, 00186 Roma RM',
      thumbnailUrl: 'https://images.unsplash.com/photo-1548585744-e4e9c9c4ad0d?w=400',
      images: ['https://images.unsplash.com/photo-1548585744-e4e9c9c4ad0d?w=800'],
      isFree: true,
    },
  ],

  // LONDON
  'London': [
    {
      name: 'Tower of London',
      description: 'Her Majesty\'s Royal Palace and Fortress of the Tower of London is a historic castle on the north bank of the River Thames. Founded in 1066 as part of the Norman Conquest, it has served as a royal residence, treasury, armory, and infamous prison.',
      shortDescription: 'Historic castle and home of the Crown Jewels',
      category: 'historical',
      lat: 51.5081,
      lng: -0.0759,
      address: 'Tower of London, London EC3N 4AB',
      thumbnailUrl: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400',
      images: ['https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800'],
      isFree: false,
      adultPrice: 29.90,
      currency: 'GBP',
    },
    {
      name: 'British Museum',
      description: 'The British Museum is dedicated to human history, art, and culture. Its permanent collection of some eight million works is among the largest in the world, including the Rosetta Stone and the Elgin Marbles.',
      shortDescription: 'World-class museum of human history and culture',
      category: 'museum',
      lat: 51.5194,
      lng: -0.1270,
      address: 'Great Russell St, London WC1B 3DG',
      thumbnailUrl: 'https://images.unsplash.com/photo-1590099033615-be195f8d575c?w=400',
      images: ['https://images.unsplash.com/photo-1590099033615-be195f8d575c?w=800'],
      isFree: true,
    },
    {
      name: 'Big Ben & Westminster',
      description: 'Big Ben is the nickname for the Great Bell of the striking clock at the north end of the Palace of Westminster. The Elizabeth Tower, which houses Big Ben, is an iconic symbol of London and the United Kingdom.',
      shortDescription: 'Iconic clock tower and seat of UK Parliament',
      category: 'landmark',
      lat: 51.5007,
      lng: -0.1246,
      address: 'Westminster, London SW1A 0AA',
      thumbnailUrl: 'https://images.unsplash.com/photo-1529180184525-78f99adb8e98?w=400',
      images: ['https://images.unsplash.com/photo-1529180184525-78f99adb8e98?w=800'],
      isFree: true,
    },
    {
      name: 'Buckingham Palace',
      description: 'Buckingham Palace is the London residence and administrative headquarters of the monarch of the United Kingdom. The palace has 775 rooms and is surrounded by 39 acres of gardens.',
      shortDescription: 'Official residence of the British monarch',
      category: 'landmark',
      lat: 51.5014,
      lng: -0.1419,
      address: 'Westminster, London SW1A 1AA',
      thumbnailUrl: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=400',
      images: ['https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800'],
      isFree: false,
      adultPrice: 30,
      currency: 'GBP',
    },
  ],

  // NEW YORK CITY
  'New York City': [
    {
      name: 'Statue of Liberty',
      description: 'The Statue of Liberty is a colossal neoclassical sculpture on Liberty Island in New York Harbor. A gift from France to the United States, it was designed by French sculptor Frédéric Auguste Bartholdi and dedicated in 1886.',
      shortDescription: 'Iconic symbol of freedom and democracy',
      category: 'landmark',
      lat: 40.6892,
      lng: -74.0445,
      address: 'Liberty Island, New York, NY 10004',
      thumbnailUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400',
      images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800'],
      isFree: false,
      adultPrice: 24.30,
      currency: 'USD',
    },
    {
      name: 'Central Park',
      description: 'Central Park is an urban park in New York City spanning 843 acres. It is the most visited urban park in the United States with an estimated 42 million visitors annually, featuring lakes, gardens, walking trails, and iconic landmarks.',
      shortDescription: 'Iconic 843-acre urban park in Manhattan',
      category: 'park',
      lat: 40.7829,
      lng: -73.9654,
      address: 'Central Park, New York, NY',
      thumbnailUrl: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400',
      images: ['https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800'],
      isFree: true,
    },
    {
      name: 'Empire State Building',
      description: 'The Empire State Building is a 102-story Art Deco skyscraper in Midtown Manhattan. Completed in 1931, it was the world\'s tallest building for nearly 40 years and offers spectacular views from its observation decks.',
      shortDescription: 'Iconic Art Deco skyscraper with observation deck',
      category: 'landmark',
      lat: 40.7484,
      lng: -73.9857,
      address: '350 Fifth Avenue, New York, NY 10118',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555109307-f7d9da25c244?w=400',
      images: ['https://images.unsplash.com/photo-1555109307-f7d9da25c244?w=800'],
      isFree: false,
      adultPrice: 44,
      currency: 'USD',
    },
    {
      name: 'Metropolitan Museum of Art',
      description: 'The Metropolitan Museum of Art is the largest art museum in the Americas, with collections spanning 5,000 years of world culture. Its permanent collection contains over two million works of art.',
      shortDescription: 'Largest art museum in the Americas',
      category: 'museum',
      lat: 40.7794,
      lng: -73.9632,
      address: '1000 Fifth Avenue, New York, NY 10028',
      thumbnailUrl: 'https://images.unsplash.com/photo-1587124544375-4e13e951ac44?w=400',
      images: ['https://images.unsplash.com/photo-1587124544375-4e13e951ac44?w=800'],
      isFree: false,
      adultPrice: 30,
      currency: 'USD',
    },
    {
      name: 'Times Square',
      description: 'Times Square is a major commercial intersection and tourist destination in Midtown Manhattan. Known for its bright lights, Broadway theaters, and the annual New Year\'s Eve ball drop.',
      shortDescription: 'Bustling commercial hub and entertainment center',
      category: 'entertainment',
      lat: 40.7580,
      lng: -73.9855,
      address: 'Times Square, Manhattan, NY 10036',
      thumbnailUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400',
      images: ['https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800'],
      isFree: true,
    },
  ],

  // TOKYO
  'Tokyo': [
    {
      name: 'Senso-ji Temple',
      description: 'Senso-ji is an ancient Buddhist temple located in Asakusa. It is Tokyo\'s oldest temple and one of its most significant. The temple is approached via the Nakamise, a shopping street that has been providing temple visitors with traditional goods for centuries.',
      shortDescription: 'Tokyo\'s oldest and most famous Buddhist temple',
      category: 'religious',
      lat: 35.7148,
      lng: 139.7967,
      address: '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032',
      thumbnailUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400',
      images: ['https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800'],
      isFree: true,
    },
    {
      name: 'Tokyo Tower',
      description: 'Tokyo Tower is a communications and observation tower inspired by the Eiffel Tower. Standing at 333 meters, it offers panoramic views of Tokyo and Mount Fuji on clear days from its two observation decks.',
      shortDescription: 'Iconic red-and-white communications tower',
      category: 'landmark',
      lat: 35.6586,
      lng: 139.7454,
      address: '4 Chome-2-8 Shibakoen, Minato City, Tokyo 105-0011',
      thumbnailUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400',
      images: ['https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800'],
      isFree: false,
      adultPrice: 1200,
      currency: 'JPY',
    },
    {
      name: 'Meiji Shrine',
      description: 'Meiji Shrine is a Shinto shrine dedicated to the deified spirits of Emperor Meiji and his wife. Set in a 170-acre forest, the shrine offers a peaceful escape from the bustling city.',
      shortDescription: 'Serene Shinto shrine in a forested park',
      category: 'religious',
      lat: 35.6764,
      lng: 139.6993,
      address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557',
      thumbnailUrl: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=400',
      images: ['https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=800'],
      isFree: true,
    },
    {
      name: 'Shibuya Crossing',
      description: 'Shibuya Crossing is one of the busiest pedestrian crossings in the world. Located in front of Shibuya Station, up to 3,000 people cross at a time during peak hours, creating a mesmerizing urban spectacle.',
      shortDescription: 'World\'s busiest pedestrian crossing',
      category: 'landmark',
      lat: 35.6595,
      lng: 139.7004,
      address: 'Shibuya, Tokyo 150-0043',
      thumbnailUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400',
      images: ['https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800'],
      isFree: true,
    },
  ],

  // SYDNEY
  'Sydney': [
    {
      name: 'Sydney Opera House',
      description: 'The Sydney Opera House is a multi-venue performing arts centre. One of the 20th century\'s most famous and distinctive buildings, it became a UNESCO World Heritage Site in 2007.',
      shortDescription: 'Iconic performing arts center and UNESCO site',
      category: 'landmark',
      lat: -33.8568,
      lng: 151.2153,
      address: 'Bennelong Point, Sydney NSW 2000',
      thumbnailUrl: 'https://images.unsplash.com/photo-1523428096881-5bd79d043006?w=400',
      images: ['https://images.unsplash.com/photo-1523428096881-5bd79d043006?w=800'],
      isFree: false,
      adultPrice: 43,
      currency: 'AUD',
    },
    {
      name: 'Sydney Harbour Bridge',
      description: 'The Sydney Harbour Bridge is a steel through arch bridge across Sydney Harbour. Nicknamed "The Coathanger," it carries rail, vehicular, bicycle, and pedestrian traffic. Visitors can climb to the top for panoramic views.',
      shortDescription: 'Iconic steel arch bridge with climb experience',
      category: 'landmark',
      lat: -33.8523,
      lng: 151.2108,
      address: 'Sydney Harbour Bridge, Sydney NSW 2060',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400',
      images: ['https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800'],
      isFree: false,
      adultPrice: 388,
      currency: 'AUD',
    },
    {
      name: 'Bondi Beach',
      description: 'Bondi Beach is one of Australia\'s most famous beaches, known for its golden sand, excellent surf, and vibrant atmosphere. The coastal walk from Bondi to Coogee offers stunning cliff-top views.',
      shortDescription: 'Famous beach with golden sand and great surf',
      category: 'beach',
      lat: -33.8915,
      lng: 151.2767,
      address: 'Bondi Beach, Sydney NSW 2026',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=400',
      images: ['https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800'],
      isFree: true,
    },
  ],

  // BARCELONA
  'Barcelona': [
    {
      name: 'La Sagrada Familia',
      description: 'The Basílica de la Sagrada Família is a large unfinished Roman Catholic minor basilica designed by architect Antoni Gaudí. Construction began in 1882 and continues today, combining Gothic and Art Nouveau forms.',
      shortDescription: 'Gaudí\'s unfinished masterpiece basilica',
      category: 'religious',
      lat: 41.4036,
      lng: 2.1744,
      address: 'C/ de Mallorca, 401, 08013 Barcelona',
      thumbnailUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400',
      images: ['https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800'],
      isFree: false,
      adultPrice: 26,
      currency: 'EUR',
    },
    {
      name: 'Park Güell',
      description: 'Park Güell is a public park composed of gardens and architectural elements designed by Antoni Gaudí. The park features colorful mosaic work and whimsical structures offering panoramic views of Barcelona.',
      shortDescription: 'Gaudí\'s whimsical park with colorful mosaics',
      category: 'park',
      lat: 41.4145,
      lng: 2.1527,
      address: '08024 Barcelona',
      thumbnailUrl: 'https://images.unsplash.com/photo-1583779457166-6cf3f9dad7a8?w=400',
      images: ['https://images.unsplash.com/photo-1583779457166-6cf3f9dad7a8?w=800'],
      isFree: false,
      adultPrice: 10,
      currency: 'EUR',
    },
    {
      name: 'La Rambla',
      description: 'La Rambla is a street in central Barcelona, popular with tourists and locals alike. A tree-lined pedestrian mall, it stretches 1.2 kilometers connecting Plaça de Catalunya with the Christopher Columbus Monument at Port Vell.',
      shortDescription: 'Famous tree-lined pedestrian boulevard',
      category: 'landmark',
      lat: 41.3797,
      lng: 2.1746,
      address: 'La Rambla, 08002 Barcelona',
      thumbnailUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400',
      images: ['https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800'],
      isFree: true,
    },
  ],

  // DUBAI
  'Dubai': [
    {
      name: 'Burj Khalifa',
      description: 'The Burj Khalifa is a skyscraper in Dubai and the tallest structure in the world, standing at 828 meters. The observation decks on floors 124, 125, and 148 offer breathtaking views of the city and beyond.',
      shortDescription: 'World\'s tallest building with observation decks',
      category: 'landmark',
      lat: 25.1972,
      lng: 55.2744,
      address: '1 Sheikh Mohammed bin Rashid Blvd, Dubai',
      thumbnailUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400',
      images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800'],
      isFree: false,
      adultPrice: 169,
      currency: 'AED',
    },
    {
      name: 'Palm Jumeirah',
      description: 'Palm Jumeirah is an artificial archipelago in the shape of a palm tree. It hosts luxury hotels, residences, and attractions including Atlantis, The Palm resort.',
      shortDescription: 'Iconic palm-shaped artificial island',
      category: 'landmark',
      lat: 25.1124,
      lng: 55.1390,
      address: 'Palm Jumeirah, Dubai',
      thumbnailUrl: 'https://images.unsplash.com/photo-1591656636620-ca0f8be8b3bf?w=400',
      images: ['https://images.unsplash.com/photo-1591656636620-ca0f8be8b3bf?w=800'],
      isFree: true,
    },
    {
      name: 'Dubai Mall',
      description: 'The Dubai Mall is the largest mall in the world by total area. It houses over 1,200 retail stores, an ice rink, aquarium, and the Dubai Fountain—the world\'s largest choreographed fountain system.',
      shortDescription: 'World\'s largest mall with aquarium and fountain',
      category: 'shopping',
      lat: 25.1978,
      lng: 55.2791,
      address: 'Financial Center Rd, Dubai',
      thumbnailUrl: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=400',
      images: ['https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800'],
      isFree: true,
    },
  ],

  // CAIRO
  'Cairo': [
    {
      name: 'Egyptian Museum',
      description: 'The Egyptian Museum houses the world\'s most extensive collection of ancient Egyptian artifacts, including the treasures of Tutankhamun and royal mummies. Founded in 1902, it contains over 120,000 items.',
      shortDescription: 'World\'s largest collection of Egyptian antiquities',
      category: 'museum',
      lat: 30.0478,
      lng: 31.2336,
      address: 'El-Tahrir Square, Cairo',
      thumbnailUrl: 'https://images.unsplash.com/photo-1568322503620-6a6b5b5b12cd?w=400',
      images: ['https://images.unsplash.com/photo-1568322503620-6a6b5b5b12cd?w=800'],
      isFree: false,
      adultPrice: 200,
      currency: 'EGP',
    },
    {
      name: 'Khan el-Khalili',
      description: 'Khan el-Khalili is a famous bazaar and souq in the historic center of Cairo. Dating back to the 14th century, it offers a labyrinth of narrow streets filled with traditional crafts, spices, jewelry, and souvenirs.',
      shortDescription: 'Historic bazaar dating to 14th century',
      category: 'shopping',
      lat: 30.0477,
      lng: 31.2626,
      address: 'El-Gamaleya, Cairo',
      thumbnailUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=400',
      images: ['https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800'],
      isFree: true,
    },
  ],

  // GIZA (near Cairo)
  'Giza': [
    {
      name: 'Great Pyramid of Giza',
      description: 'The Great Pyramid of Giza is the oldest and largest of the pyramids in the Giza pyramid complex. Built c. 2560 BCE for Pharaoh Khufu, it is the only one of the Seven Wonders of the Ancient World still in existence.',
      shortDescription: 'Ancient wonder and oldest of the Seven Wonders',
      category: 'historical',
      lat: 29.9792,
      lng: 31.1342,
      address: 'Al Haram, Giza Governorate',
      thumbnailUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=400',
      images: ['https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800'],
      isFree: false,
      adultPrice: 600,
      currency: 'EGP',
    },
    {
      name: 'Great Sphinx of Giza',
      description: 'The Great Sphinx is a limestone statue of a mythical creature with the head of a human and the body of a lion. Dating from the reign of Pharaoh Khafre (c. 2558–2532 BCE), it is the oldest known monumental sculpture in Egypt.',
      shortDescription: 'Ancient limestone statue with human head, lion body',
      category: 'historical',
      lat: 29.9753,
      lng: 31.1376,
      address: 'Al Haram, Giza Governorate',
      thumbnailUrl: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=400',
      images: ['https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800'],
      isFree: false,
      adultPrice: 600,
      currency: 'EGP',
    },
  ],

  // RIO DE JANEIRO
  'Rio de Janeiro': [
    {
      name: 'Christ the Redeemer',
      description: 'Christ the Redeemer is an Art Deco statue of Jesus Christ in Rio de Janeiro. Created by French sculptor Paul Landowski, it stands 30 meters tall atop Corcovado mountain and is one of the New Seven Wonders of the World.',
      shortDescription: 'Iconic Art Deco statue atop Corcovado mountain',
      category: 'landmark',
      lat: -22.9519,
      lng: -43.2105,
      address: 'Parque Nacional da Tijuca - Alto da Boa Vista, Rio de Janeiro',
      thumbnailUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400',
      images: ['https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800'],
      isFree: false,
      adultPrice: 79.20,
      currency: 'BRL',
    },
    {
      name: 'Copacabana Beach',
      description: 'Copacabana Beach is one of the most famous beaches in the world, stretching 4 km along the Atlantic Ocean. Known for its distinctive wave-pattern promenade designed by Roberto Burle Marx.',
      shortDescription: 'World-famous 4km beach with iconic promenade',
      category: 'beach',
      lat: -22.9711,
      lng: -43.1822,
      address: 'Copacabana, Rio de Janeiro',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=400',
      images: ['https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=800'],
      isFree: true,
    },
    {
      name: 'Sugarloaf Mountain',
      description: 'Sugarloaf Mountain is a peak situated at the mouth of Guanabara Bay. Rising 396 meters above the harbor, it is accessible by cable car and offers spectacular views of Rio de Janeiro.',
      shortDescription: 'Iconic peak with cable car and stunning views',
      category: 'nature',
      lat: -22.9492,
      lng: -43.1545,
      address: 'Av. Pasteur, 520 - Urca, Rio de Janeiro',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=400',
      images: ['https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=800'],
      isFree: false,
      adultPrice: 130,
      currency: 'BRL',
    },
  ],

  // CUSCO
  'Cusco': [
    {
      name: 'Machu Picchu',
      description: 'Machu Picchu is a 15th-century Inca citadel located in the Eastern Cordillera of southern Peru. Set high in the Andes Mountains, it is the most familiar icon of the Inca Empire and a UNESCO World Heritage Site.',
      shortDescription: '15th-century Inca citadel in the Andes',
      category: 'historical',
      lat: -13.1631,
      lng: -72.5450,
      address: 'Machu Picchu, Cusco Region',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400',
      images: ['https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800'],
      isFree: false,
      adultPrice: 152,
      currency: 'PEN',
    },
    {
      name: 'Plaza de Armas',
      description: 'The Plaza de Armas is the historic central square of Cusco, surrounded by colonial-era buildings and churches. It was the heart of the Inca capital and remains the vibrant center of the city.',
      shortDescription: 'Historic central square of the Inca capital',
      category: 'landmark',
      lat: -13.5170,
      lng: -71.9785,
      address: 'Plaza de Armas, Cusco',
      thumbnailUrl: 'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=400',
      images: ['https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=800'],
      isFree: true,
    },
  ],

  // SINGAPORE
  'Singapore': [
    {
      name: 'Marina Bay Sands',
      description: 'Marina Bay Sands is an integrated resort fronting Marina Bay. Its most distinctive feature is the SkyPark observation deck spanning the three towers, offering 360-degree views of the Singapore skyline.',
      shortDescription: 'Iconic resort with rooftop infinity pool',
      category: 'landmark',
      lat: 1.2834,
      lng: 103.8607,
      address: '10 Bayfront Avenue, Singapore 018956',
      thumbnailUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400',
      images: ['https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800'],
      isFree: false,
      adultPrice: 26,
      currency: 'SGD',
    },
    {
      name: 'Gardens by the Bay',
      description: 'Gardens by the Bay is a nature park spanning 101 hectares in the Central Region of Singapore. Its Supertree Grove features vertical gardens up to 50 meters tall, connected by a skyway.',
      shortDescription: 'Futuristic garden with iconic Supertrees',
      category: 'park',
      lat: 1.2816,
      lng: 103.8636,
      address: '18 Marina Gardens Dr, Singapore 018953',
      thumbnailUrl: 'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=400',
      images: ['https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800'],
      isFree: false,
      adultPrice: 28,
      currency: 'SGD',
    },
    {
      name: 'Sentosa Island',
      description: 'Sentosa is a resort island off Singapore\'s southern coast. Connected by a causeway, it features Universal Studios Singapore, S.E.A. Aquarium, beaches, and numerous attractions.',
      shortDescription: 'Resort island with theme parks and beaches',
      category: 'entertainment',
      lat: 1.2494,
      lng: 103.8303,
      address: 'Sentosa Island, Singapore',
      thumbnailUrl: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=400',
      images: ['https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800'],
      isFree: true,
    },
  ],

  // ISTANBUL
  'Istanbul': [
    {
      name: 'Hagia Sophia',
      description: 'Hagia Sophia is a Late Antique place of worship, built in 537 AD as a Christian cathedral. It was the world\'s largest building for nearly a thousand years and is renowned for its massive dome and Byzantine architecture.',
      shortDescription: 'Ancient cathedral with iconic Byzantine dome',
      category: 'religious',
      lat: 41.0086,
      lng: 28.9802,
      address: 'Sultan Ahmet, Ayasofya Meydanı, 34122 Fatih/İstanbul',
      thumbnailUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400',
      images: ['https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800'],
      isFree: true,
    },
    {
      name: 'Blue Mosque',
      description: 'The Blue Mosque, known as Sultanahmet Camii, was built between 1609-1616. It is known for its hand-painted blue tiles adorning its interior walls and its six minarets.',
      shortDescription: 'Historic mosque with blue-tiled interior',
      category: 'religious',
      lat: 41.0054,
      lng: 28.9768,
      address: 'Sultan Ahmet, Atmeydanı Cd. No:7, 34122 Fatih/İstanbul',
      thumbnailUrl: 'https://images.unsplash.com/photo-1545158535-c3f7168c28b6?w=400',
      images: ['https://images.unsplash.com/photo-1545158535-c3f7168c28b6?w=800'],
      isFree: true,
    },
    {
      name: 'Grand Bazaar',
      description: 'The Grand Bazaar is one of the largest and oldest covered markets in the world. With 61 covered streets and over 4,000 shops, it attracts between 250,000 and 400,000 visitors daily.',
      shortDescription: 'One of world\'s largest and oldest covered markets',
      category: 'shopping',
      lat: 41.0108,
      lng: 28.9680,
      address: 'Beyazıt, Kalpakçılar Cd., 34126 Fatih/İstanbul',
      thumbnailUrl: 'https://images.unsplash.com/photo-1530841377377-3ff06c0ca713?w=400',
      images: ['https://images.unsplash.com/photo-1530841377377-3ff06c0ca713?w=800'],
      isFree: true,
    },
  ],

  // AMSTERDAM
  'Amsterdam': [
    {
      name: 'Anne Frank House',
      description: 'The Anne Frank House is a biographical museum dedicated to Jewish wartime diarist Anne Frank. The building is located on a canal called the Prinsengracht, where her family hid from Nazi persecution during World War II.',
      shortDescription: 'Museum in Anne Frank\'s wartime hiding place',
      category: 'museum',
      lat: 52.3752,
      lng: 4.8840,
      address: 'Prinsengracht 263-267, 1016 GV Amsterdam',
      thumbnailUrl: 'https://images.unsplash.com/photo-1584003564911-a7bfd5f5a776?w=400',
      images: ['https://images.unsplash.com/photo-1584003564911-a7bfd5f5a776?w=800'],
      isFree: false,
      adultPrice: 16,
      currency: 'EUR',
    },
    {
      name: 'Van Gogh Museum',
      description: 'The Van Gogh Museum houses the world\'s largest collection of artworks by Vincent van Gogh. The collection includes over 200 paintings, 500 drawings, and more than 750 personal letters.',
      shortDescription: 'World\'s largest Van Gogh collection',
      category: 'museum',
      lat: 52.3584,
      lng: 4.8811,
      address: 'Museumplein 6, 1071 DJ Amsterdam',
      thumbnailUrl: 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=400',
      images: ['https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800'],
      isFree: false,
      adultPrice: 22,
      currency: 'EUR',
    },
    {
      name: 'Rijksmuseum',
      description: 'The Rijksmuseum is the national museum of the Netherlands dedicated to Dutch arts and history. Its collection of 1 million objects includes masterpieces by Rembrandt, Vermeer, and Frans Hals.',
      shortDescription: 'Netherlands\' national museum of art and history',
      category: 'museum',
      lat: 52.3600,
      lng: 4.8852,
      address: 'Museumstraat 1, 1071 XX Amsterdam',
      thumbnailUrl: 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=400',
      images: ['https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800'],
      isFree: false,
      adultPrice: 22.50,
      currency: 'EUR',
    },
  ],

  // BALI
  'Bali': [
    {
      name: 'Tanah Lot Temple',
      description: 'Tanah Lot is a rock formation off the Indonesian island of Bali. It is home to an ancient Hindu pilgrimage temple and is one of the most popular tourist attractions in Bali, especially at sunset.',
      shortDescription: 'Ancient sea temple on a rock formation',
      category: 'religious',
      lat: -8.6213,
      lng: 115.0868,
      address: 'Beraban, Kediri, Tabanan Regency, Bali',
      thumbnailUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400',
      images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800'],
      isFree: false,
      adultPrice: 60000,
      currency: 'IDR',
    },
    {
      name: 'Ubud Monkey Forest',
      description: 'The Sacred Monkey Forest Sanctuary is a nature reserve and Hindu temple complex in Ubud. It is home to over 1,260 Balinese long-tailed macaques and features ancient temple ruins covered in moss.',
      shortDescription: 'Sacred forest sanctuary with Balinese macaques',
      category: 'nature',
      lat: -8.5195,
      lng: 115.2587,
      address: 'Jl. Monkey Forest, Ubud, Kabupaten Gianyar, Bali',
      thumbnailUrl: 'https://images.unsplash.com/photo-1604841986189-55d61d5b6d57?w=400',
      images: ['https://images.unsplash.com/photo-1604841986189-55d61d5b6d57?w=800'],
      isFree: false,
      adultPrice: 80000,
      currency: 'IDR',
    },
    {
      name: 'Tegallalang Rice Terraces',
      description: 'The Tegallalang Rice Terraces are famous for their beautiful scenes of rice paddies involving the traditional Balinese irrigation system known as subak. The landscape is among Bali\'s most iconic.',
      shortDescription: 'Iconic terraced rice paddies near Ubud',
      category: 'nature',
      lat: -8.4312,
      lng: 115.2791,
      address: 'Tegallalang, Gianyar Regency, Bali',
      thumbnailUrl: 'https://images.unsplash.com/photo-1531592937781-344ad608fabf?w=400',
      images: ['https://images.unsplash.com/photo-1531592937781-344ad608fabf?w=800'],
      isFree: false,
      adultPrice: 15000,
      currency: 'IDR',
    },
  ],

  // CAPE TOWN
  'Cape Town': [
    {
      name: 'Table Mountain',
      description: 'Table Mountain is a flat-topped mountain forming a prominent landmark overlooking Cape Town. A cable car takes visitors to the summit for panoramic views. It is one of the New7Wonders of Nature.',
      shortDescription: 'Iconic flat-topped mountain with cable car',
      category: 'nature',
      lat: -33.9628,
      lng: 18.4098,
      address: 'Table Mountain National Park, Cape Town',
      thumbnailUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400',
      images: ['https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800'],
      isFree: false,
      adultPrice: 440,
      currency: 'ZAR',
    },
    {
      name: 'Robben Island',
      description: 'Robben Island is an island in Table Bay where Nelson Mandela was imprisoned for 18 years. Now a UNESCO World Heritage Site, it serves as a museum and symbol of the triumph of democracy over oppression.',
      shortDescription: 'Historic prison island, UNESCO World Heritage Site',
      category: 'historical',
      lat: -33.8060,
      lng: 18.3714,
      address: 'Robben Island, Cape Town',
      thumbnailUrl: 'https://images.unsplash.com/photo-1591198936750-9de5f4b7cf89?w=400',
      images: ['https://images.unsplash.com/photo-1591198936750-9de5f4b7cf89?w=800'],
      isFree: false,
      adultPrice: 600,
      currency: 'ZAR',
    },
    {
      name: 'V&A Waterfront',
      description: 'The Victoria & Alfred Waterfront is a mixed-use development and popular destination built on a historic harbour. It features over 450 retail stores, restaurants, museums, and the Two Oceans Aquarium.',
      shortDescription: 'Vibrant harbor with shopping and entertainment',
      category: 'shopping',
      lat: -33.9036,
      lng: 18.4208,
      address: '19 Dock Road, V&A Waterfront, Cape Town',
      thumbnailUrl: 'https://images.unsplash.com/photo-1591198936750-9de5f4b7cf89?w=400',
      images: ['https://images.unsplash.com/photo-1591198936750-9de5f4b7cf89?w=800'],
      isFree: true,
    },
  ],

  // PRAGUE
  'Prague': [
    {
      name: 'Charles Bridge',
      description: 'Charles Bridge is a medieval stone arch bridge that crosses the Vltava river. Construction started in 1357 under King Charles IV. The bridge is decorated with 30 statues of saints.',
      shortDescription: 'Historic medieval bridge with baroque statues',
      category: 'landmark',
      lat: 50.0865,
      lng: 14.4114,
      address: 'Karlův most, 110 00 Praha 1',
      thumbnailUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400',
      images: ['https://images.unsplash.com/photo-1541849546-216549ae216d?w=800'],
      isFree: true,
    },
    {
      name: 'Prague Castle',
      description: 'Prague Castle is the largest ancient castle in the world according to the Guinness Book of Records. Dating from the 9th century, it has served as the seat of Czech rulers throughout history.',
      shortDescription: 'World\'s largest ancient castle complex',
      category: 'historical',
      lat: 50.0909,
      lng: 14.4013,
      address: 'Hradčany, 119 08 Prague 1',
      thumbnailUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400',
      images: ['https://images.unsplash.com/photo-1541849546-216549ae216d?w=800'],
      isFree: false,
      adultPrice: 350,
      currency: 'CZK',
    },
    {
      name: 'Old Town Square',
      description: 'Old Town Square is a historic square in the Old Town quarter of Prague. The square features the famous Astronomical Clock, Týn Church, and beautiful baroque and gothic architecture.',
      shortDescription: 'Historic square with Astronomical Clock',
      category: 'landmark',
      lat: 50.0875,
      lng: 14.4214,
      address: 'Staroměstské nám., 110 00 Staré Město',
      thumbnailUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=400',
      images: ['https://images.unsplash.com/photo-1541849546-216549ae216d?w=800'],
      isFree: true,
    },
  ],

  // BUDAPEST
  'Budapest': [
    {
      name: 'Hungarian Parliament Building',
      description: 'The Hungarian Parliament Building is the seat of the National Assembly of Hungary. Completed in 1904, it is the third largest parliament building in the world and a striking example of Neo-Gothic architecture.',
      shortDescription: 'Neo-Gothic parliament on the Danube',
      category: 'landmark',
      lat: 47.5073,
      lng: 19.0458,
      address: 'Budapest, Kossuth Lajos tér 1-3, 1055',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=400',
      images: ['https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800'],
      isFree: false,
      adultPrice: 6000,
      currency: 'HUF',
    },
    {
      name: 'Széchenyi Thermal Bath',
      description: 'Széchenyi Thermal Bath is one of the largest public baths in Europe. Built in 1913, the neo-baroque complex features 18 pools fed by two thermal springs, ranging from 27°C to 38°C.',
      shortDescription: 'Historic thermal baths in City Park',
      category: 'entertainment',
      lat: 47.5186,
      lng: 19.0820,
      address: 'Budapest, Állatkerti krt. 9-11, 1146',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=400',
      images: ['https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800'],
      isFree: false,
      adultPrice: 7900,
      currency: 'HUF',
    },
    {
      name: 'Buda Castle',
      description: 'Buda Castle is the historical castle and palace complex of the Hungarian kings in Budapest. First completed in 1265, the current Baroque palace was built between 1749 and 1769.',
      shortDescription: 'Historic royal palace on Castle Hill',
      category: 'historical',
      lat: 47.4962,
      lng: 19.0397,
      address: 'Budapest, Szent György tér 2, 1014',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=400',
      images: ['https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800'],
      isFree: true,
    },
  ],

  // MARRAKECH
  'Marrakech': [
    {
      name: 'Jemaa el-Fnaa',
      description: 'Jemaa el-Fnaa is a square and market place in the medina quarter of Marrakech. It remains the main square of Marrakech and is used by locals and tourists for shopping and entertainment.',
      shortDescription: 'Vibrant market square in the medina',
      category: 'shopping',
      lat: 31.6258,
      lng: -7.9891,
      address: 'Jemaa el-Fnaa, Marrakech',
      thumbnailUrl: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=400',
      images: ['https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800'],
      isFree: true,
    },
    {
      name: 'Bahia Palace',
      description: 'The Bahia Palace is a late 19th century palace built for the Grand Vizier of Marrakech. The name means "brilliance" and features stunning Islamic architecture, painted ceilings, and peaceful gardens.',
      shortDescription: '19th-century palace with Islamic architecture',
      category: 'historical',
      lat: 31.6216,
      lng: -7.9830,
      address: 'Avenue Imam El Ghazali, Marrakech',
      thumbnailUrl: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=400',
      images: ['https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800'],
      isFree: false,
      adultPrice: 70,
      currency: 'MAD',
    },
    {
      name: 'Majorelle Garden',
      description: 'Majorelle Garden is a botanical garden and artist\'s landscape garden created by French painter Jacques Majorelle. Later owned by Yves Saint Laurent, it features exotic plants and the iconic Majorelle Blue.',
      shortDescription: 'Artistic garden with iconic blue buildings',
      category: 'park',
      lat: 31.6418,
      lng: -8.0033,
      address: 'Rue Yves St Laurent, Marrakech 40090',
      thumbnailUrl: 'https://images.unsplash.com/photo-1553522991-71439aa62779?w=400',
      images: ['https://images.unsplash.com/photo-1553522991-71439aa62779?w=800'],
      isFree: false,
      adultPrice: 150,
      currency: 'MAD',
    },
  ],

  // AGRA
  'Agra': [
    {
      name: 'Taj Mahal',
      description: 'The Taj Mahal is an ivory-white marble mausoleum commissioned in 1632 by Mughal emperor Shah Jahan in memory of his wife Mumtaz Mahal. It is regarded as the finest example of Mughal architecture and a UNESCO World Heritage Site.',
      shortDescription: 'Iconic white marble mausoleum, UNESCO site',
      category: 'historical',
      lat: 27.1751,
      lng: 78.0421,
      address: 'Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001',
      thumbnailUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400',
      images: ['https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800'],
      isFree: false,
      adultPrice: 1100,
      currency: 'INR',
    },
    {
      name: 'Agra Fort',
      description: 'Agra Fort is a historical fort in Agra that served as the main residence of the Mughal emperors until 1638. A UNESCO World Heritage Site, it showcases stunning Mughal architecture with red sandstone.',
      shortDescription: 'Mughal-era fort and UNESCO World Heritage Site',
      category: 'historical',
      lat: 27.1795,
      lng: 78.0211,
      address: 'Agra Fort, Rakabganj, Agra, Uttar Pradesh 282003',
      thumbnailUrl: 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=400',
      images: ['https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=800'],
      isFree: false,
      adultPrice: 650,
      currency: 'INR',
    },
  ],

  // BANGKOK
  'Bangkok': [
    {
      name: 'Grand Palace',
      description: 'The Grand Palace is a complex of buildings at the heart of Bangkok. Established in 1782, it served as the official residence of the Kings of Siam and features stunning Thai architecture and the sacred Emerald Buddha.',
      shortDescription: 'Former royal residence with Emerald Buddha',
      category: 'historical',
      lat: 13.7500,
      lng: 100.4913,
      address: 'Na Phra Lan Rd, Phra Borom Maha Ratchawang, Bangkok 10200',
      thumbnailUrl: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400',
      images: ['https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800'],
      isFree: false,
      adultPrice: 500,
      currency: 'THB',
    },
    {
      name: 'Wat Arun',
      description: 'Wat Arun, or Temple of Dawn, is a Buddhist temple on the west bank of the Chao Phraya River. Its distinctive spires are decorated with colorful porcelain and seashells, creating a stunning sight especially at sunset.',
      shortDescription: 'Temple of Dawn with ornate spires',
      category: 'religious',
      lat: 13.7437,
      lng: 100.4890,
      address: '158 Thanon Wang Doem, Bangkok Yai, Bangkok 10600',
      thumbnailUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400',
      images: ['https://images.unsplash.com/photo-1528181304800-259b08848526?w=800'],
      isFree: false,
      adultPrice: 100,
      currency: 'THB',
    },
    {
      name: 'Chatuchak Weekend Market',
      description: 'Chatuchak Weekend Market is one of the world\'s largest weekend markets. Covering over 35 acres with more than 15,000 stalls, it sells everything from clothing and accessories to antiques and pets.',
      shortDescription: 'One of world\'s largest weekend markets',
      category: 'shopping',
      lat: 13.7999,
      lng: 100.5508,
      address: 'Kamphaeng Phet 2 Rd, Chatuchak, Bangkok 10900',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400',
      images: ['https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800'],
      isFree: true,
    },
  ],

  // ATHENS
  'Athens': [
    {
      name: 'Acropolis of Athens',
      description: 'The Acropolis of Athens is an ancient citadel located on a rocky outcrop above the city. It contains the remains of several ancient buildings of great architectural significance, most famously the Parthenon.',
      shortDescription: 'Ancient citadel with the iconic Parthenon',
      category: 'historical',
      lat: 37.9715,
      lng: 23.7257,
      address: 'Athens 105 58',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400',
      images: ['https://images.unsplash.com/photo-1555993539-1732b0258235?w=800'],
      isFree: false,
      adultPrice: 20,
      currency: 'EUR',
    },
    {
      name: 'Parthenon',
      description: 'The Parthenon is a former temple on the Athenian Acropolis dedicated to the goddess Athena. Constructed between 447-432 BCE, it is the most important surviving building of Classical Greece.',
      shortDescription: 'Ancient Greek temple dedicated to Athena',
      category: 'historical',
      lat: 37.9715,
      lng: 23.7267,
      address: 'Acropolis, Athens 105 58',
      thumbnailUrl: 'https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=400',
      images: ['https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=800'],
      isFree: false,
      adultPrice: 20,
      currency: 'EUR',
    },
    {
      name: 'Plaka District',
      description: 'Plaka is the old historical neighborhood of Athens, clustered around the northern and eastern slopes of the Acropolis. Known as "the Neighborhood of the Gods," it features neoclassical architecture and winding streets.',
      shortDescription: 'Historic neighborhood at foot of Acropolis',
      category: 'landmark',
      lat: 37.9722,
      lng: 23.7319,
      address: 'Plaka, Athens',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400',
      images: ['https://images.unsplash.com/photo-1555993539-1732b0258235?w=800'],
      isFree: true,
    },
  ],

  // KYOTO
  'Kyoto': [
    {
      name: 'Fushimi Inari Shrine',
      description: 'Fushimi Inari Taisha is the head shrine of the kami Inari. Famous for its thousands of vermilion torii gates, which straddle a network of trails behind its main buildings, the shrine sits at the base of Mount Inari.',
      shortDescription: 'Shrine famous for thousands of torii gates',
      category: 'religious',
      lat: 34.9671,
      lng: 135.7727,
      address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto, 612-0882',
      thumbnailUrl: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=400',
      images: ['https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=800'],
      isFree: true,
    },
    {
      name: 'Kinkaku-ji (Golden Pavilion)',
      description: 'Kinkaku-ji, officially named Rokuon-ji, is a Zen Buddhist temple. The top two floors of the pavilion are completely covered in gold leaf, creating a stunning reflection in the surrounding pond.',
      shortDescription: 'Zen temple with gold leaf-covered pavilion',
      category: 'religious',
      lat: 35.0394,
      lng: 135.7292,
      address: '1 Kinkakujicho, Kita Ward, Kyoto, 603-8361',
      thumbnailUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400',
      images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800'],
      isFree: false,
      adultPrice: 500,
      currency: 'JPY',
    },
    {
      name: 'Arashiyama Bamboo Grove',
      description: 'The Arashiyama Bamboo Grove is a natural forest of bamboo in Arashiyama. Walking through the towering bamboo stalks is a magical experience, especially when the wind blows and creates a rustling sound.',
      shortDescription: 'Enchanting bamboo forest pathway',
      category: 'nature',
      lat: 35.0170,
      lng: 135.6713,
      address: 'Sagaogurayama, Ukyo Ward, Kyoto, 616-8385',
      thumbnailUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400',
      images: ['https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800'],
      isFree: true,
    },
  ],

  // BEIJING
  'Beijing': [
    {
      name: 'Forbidden City',
      description: 'The Forbidden City is a palace complex in central Beijing. Constructed from 1406 to 1420, it was the Chinese imperial palace and home to emperors for almost 500 years. It contains 980 buildings with 8,886 rooms.',
      shortDescription: 'Imperial palace complex with 980 buildings',
      category: 'historical',
      lat: 39.9163,
      lng: 116.3972,
      address: '4 Jingshan Front St, Dongcheng, Beijing, 100009',
      thumbnailUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400',
      images: ['https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800'],
      isFree: false,
      adultPrice: 60,
      currency: 'CNY',
    },
    {
      name: 'Great Wall at Badaling',
      description: 'The Great Wall of China at Badaling is the most visited section of the wall. Built during the Ming Dynasty, this well-restored section offers relatively easy access and panoramic mountain views.',
      shortDescription: 'Most visited section of the Great Wall',
      category: 'historical',
      lat: 40.3540,
      lng: 116.0070,
      address: 'Badaling, Yanqing District, Beijing',
      thumbnailUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400',
      images: ['https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800'],
      isFree: false,
      adultPrice: 40,
      currency: 'CNY',
    },
    {
      name: 'Temple of Heaven',
      description: 'The Temple of Heaven is a medieval complex of religious buildings. Emperors of the Ming and Qing dynasties visited for annual ceremonies of prayer to Heaven for good harvest.',
      shortDescription: 'Imperial sacrificial altar and park',
      category: 'religious',
      lat: 39.8822,
      lng: 116.4066,
      address: '1 Tiantan E Rd, Dongcheng, Beijing, 100061',
      thumbnailUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400',
      images: ['https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800'],
      isFree: false,
      adultPrice: 34,
      currency: 'CNY',
    },
  ],
};

async function main() {
  console.log('🌍 Starting database seed...\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.attraction.deleteMany();
  await prisma.city.deleteMany();
  await prisma.country.deleteMany();
  await prisma.continent.deleteMany();
  console.log('✓ Existing data cleared\n');

  // Create continents
  console.log('🌎 Creating continents...');
  const continentMap: Record<string, string> = {};
  for (const continent of continents) {
    const created = await prisma.continent.create({
      data: continent,
    });
    continentMap[continent.name] = created.id;
    console.log(`  ✓ ${continent.name}`);
  }
  console.log(`✓ Created ${continents.length} continents\n`);

  // Create countries
  console.log('🏳️  Creating countries...');
  const countryMap: Record<string, string> = {};
  let countryCount = 0;
  for (const [continentName, countries] of Object.entries(countriesByContinent)) {
    const continentId = continentMap[continentName];
    if (!continentId) continue;

    for (const country of countries) {
      const created = await prisma.country.create({
        data: {
          name: country.name,
          code: country.code,
          continentId,
        },
      });
      countryMap[country.code] = created.id;
      countryCount++;
    }
  }
  console.log(`✓ Created ${countryCount} countries\n`);

  // Create cities
  console.log('🏙️  Creating cities...');
  const cityMap: Record<string, string> = {};
  let cityCount = 0;
  for (const [countryCode, cities] of Object.entries(citiesByCountry)) {
    const countryId = countryMap[countryCode];
    if (!countryId) continue;

    for (const city of cities) {
      const created = await prisma.city.create({
        data: {
          name: city.name,
          latitude: city.lat,
          longitude: city.lng,
          countryId,
        },
      });
      cityMap[city.name] = created.id;
      cityCount++;
    }
  }
  console.log(`✓ Created ${cityCount} cities\n`);

  // Create attractions
  console.log('🗽 Creating attractions...');
  let attractionCount = 0;
  for (const [cityName, attractions] of Object.entries(attractionsByCity)) {
    const cityId = cityMap[cityName];
    if (!cityId) {
      console.log(`  ⚠️  City not found: ${cityName}`);
      continue;
    }

    for (const attraction of attractions) {
      await prisma.attraction.create({
        data: {
          name: attraction.name,
          description: attraction.description,
          shortDescription: attraction.shortDescription,
          category: attraction.category,
          cityId,
          latitude: attraction.lat,
          longitude: attraction.lng,
          address: attraction.address,
          thumbnailUrl: attraction.thumbnailUrl,
          images: attraction.images,
          isFree: attraction.isFree,
          adultPrice: attraction.adultPrice,
          currency: attraction.currency,
        },
      });
      attractionCount++;
    }
    console.log(`  ✓ ${cityName}: ${attractions.length} attractions`);
  }
  console.log(`✓ Created ${attractionCount} attractions\n`);

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('📊 SEED COMPLETE - SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`   Continents: ${continents.length}`);
  console.log(`   Countries:  ${countryCount}`);
  console.log(`   Cities:     ${cityCount}`);
  console.log(`   Attractions: ${attractionCount}`);
  console.log('═══════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
