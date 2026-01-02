import { PrismaClient, AttractionCategory } from '@prisma/client';

const prisma = new PrismaClient();

// ============ CONFIGURATION ============
const OPENTRIPMAP_API_KEY = process.env.OPENTRIPMAP_API_KEY || 'YOUR_API_KEY_HERE';
const API_BASE_URL = 'https://api.opentripmap.com/0.1/en/places';
const DELAY_MS = 200; // Delay between API calls to avoid rate limiting

// ============ CAPITAL CITIES WITH COORDINATES ============
interface CityData {
  name: string;
  lat: number;
  lng: number;
  isCapital: boolean;
}

const citiesByCountry: Record<string, CityData[]> = {
  // AFRICA
  'DZ': [{ name: 'Algiers', lat: 36.7538, lng: 3.0588, isCapital: true }],
  'AO': [{ name: 'Luanda', lat: -8.8390, lng: 13.2894, isCapital: true }],
  'BJ': [{ name: 'Porto-Novo', lat: 6.4969, lng: 2.6289, isCapital: true }],
  'BW': [{ name: 'Gaborone', lat: -24.6282, lng: 25.9231, isCapital: true }],
  'BF': [{ name: 'Ouagadougou', lat: 12.3714, lng: -1.5197, isCapital: true }],
  'BI': [{ name: 'Gitega', lat: -3.4264, lng: 29.9306, isCapital: true }],
  'CV': [{ name: 'Praia', lat: 14.9330, lng: -23.5133, isCapital: true }],
  'CM': [{ name: 'Yaoundé', lat: 3.8480, lng: 11.5021, isCapital: true }],
  'CF': [{ name: 'Bangui', lat: 4.3947, lng: 18.5582, isCapital: true }],
  'TD': [{ name: 'N\'Djamena', lat: 12.1348, lng: 15.0557, isCapital: true }],
  'KM': [{ name: 'Moroni', lat: -11.7022, lng: 43.2551, isCapital: true }],
  'CG': [{ name: 'Brazzaville', lat: -4.2634, lng: 15.2429, isCapital: true }],
  'CD': [{ name: 'Kinshasa', lat: -4.4419, lng: 15.2663, isCapital: true }],
  'CI': [{ name: 'Yamoussoukro', lat: 6.8276, lng: -5.2893, isCapital: true }],
  'DJ': [{ name: 'Djibouti', lat: 11.5721, lng: 43.1456, isCapital: true }],
  'EG': [
    { name: 'Cairo', lat: 30.0444, lng: 31.2357, isCapital: true },
    { name: 'Giza', lat: 30.0131, lng: 31.2089, isCapital: false },
    { name: 'Luxor', lat: 25.6872, lng: 32.6396, isCapital: false },
    { name: 'Alexandria', lat: 31.2001, lng: 29.9187, isCapital: false },
  ],
  'GQ': [{ name: 'Malabo', lat: 3.7504, lng: 8.7371, isCapital: true }],
  'ER': [{ name: 'Asmara', lat: 15.3229, lng: 38.9251, isCapital: true }],
  'SZ': [{ name: 'Mbabane', lat: -26.3054, lng: 31.1367, isCapital: true }],
  'ET': [{ name: 'Addis Ababa', lat: 9.0320, lng: 38.7469, isCapital: true }],
  'GA': [{ name: 'Libreville', lat: 0.4162, lng: 9.4673, isCapital: true }],
  'GM': [{ name: 'Banjul', lat: 13.4549, lng: -16.5790, isCapital: true }],
  'GH': [{ name: 'Accra', lat: 5.6037, lng: -0.1870, isCapital: true }],
  'GN': [{ name: 'Conakry', lat: 9.6412, lng: -13.5784, isCapital: true }],
  'GW': [{ name: 'Bissau', lat: 11.8037, lng: -15.1804, isCapital: true }],
  'KE': [
    { name: 'Nairobi', lat: -1.2921, lng: 36.8219, isCapital: true },
    { name: 'Mombasa', lat: -4.0435, lng: 39.6682, isCapital: false },
  ],
  'LS': [{ name: 'Maseru', lat: -29.3167, lng: 27.4833, isCapital: true }],
  'LR': [{ name: 'Monrovia', lat: 6.3156, lng: -10.8074, isCapital: true }],
  'LY': [{ name: 'Tripoli', lat: 32.8872, lng: 13.1913, isCapital: true }],
  'MG': [{ name: 'Antananarivo', lat: -18.8792, lng: 47.5079, isCapital: true }],
  'MW': [{ name: 'Lilongwe', lat: -13.9626, lng: 33.7741, isCapital: true }],
  'ML': [{ name: 'Bamako', lat: 12.6392, lng: -8.0029, isCapital: true }],
  'MR': [{ name: 'Nouakchott', lat: 18.0735, lng: -15.9582, isCapital: true }],
  'MU': [{ name: 'Port Louis', lat: -20.1609, lng: 57.5012, isCapital: true }],
  'MA': [
    { name: 'Rabat', lat: 34.0209, lng: -6.8416, isCapital: true },
    { name: 'Marrakech', lat: 31.6295, lng: -7.9811, isCapital: false },
    { name: 'Casablanca', lat: 33.5731, lng: -7.5898, isCapital: false },
    { name: 'Fes', lat: 34.0181, lng: -5.0078, isCapital: false },
  ],
  'MZ': [{ name: 'Maputo', lat: -25.9692, lng: 32.5732, isCapital: true }],
  'NA': [{ name: 'Windhoek', lat: -22.5609, lng: 17.0658, isCapital: true }],
  'NE': [{ name: 'Niamey', lat: 13.5137, lng: 2.1098, isCapital: true }],
  'NG': [
    { name: 'Abuja', lat: 9.0765, lng: 7.3986, isCapital: true },
    { name: 'Lagos', lat: 6.5244, lng: 3.3792, isCapital: false },
  ],
  'RW': [{ name: 'Kigali', lat: -1.9403, lng: 29.8739, isCapital: true }],
  'ST': [{ name: 'São Tomé', lat: 0.3365, lng: 6.7273, isCapital: true }],
  'SN': [{ name: 'Dakar', lat: 14.7167, lng: -17.4677, isCapital: true }],
  'SC': [{ name: 'Victoria', lat: -4.6191, lng: 55.4513, isCapital: true }],
  'SL': [{ name: 'Freetown', lat: 8.4657, lng: -13.2317, isCapital: true }],
  'SO': [{ name: 'Mogadishu', lat: 2.0469, lng: 45.3182, isCapital: true }],
  'ZA': [
    { name: 'Pretoria', lat: -25.7461, lng: 28.1881, isCapital: true },
    { name: 'Cape Town', lat: -33.9249, lng: 18.4241, isCapital: false },
    { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, isCapital: false },
  ],
  'SS': [{ name: 'Juba', lat: 4.8594, lng: 31.5713, isCapital: true }],
  'SD': [{ name: 'Khartoum', lat: 15.5007, lng: 32.5599, isCapital: true }],
  'TZ': [
    { name: 'Dodoma', lat: -6.1630, lng: 35.7516, isCapital: true },
    { name: 'Dar es Salaam', lat: -6.7924, lng: 39.2083, isCapital: false },
    { name: 'Zanzibar', lat: -6.1659, lng: 39.2026, isCapital: false },
  ],
  'TG': [{ name: 'Lomé', lat: 6.1725, lng: 1.2314, isCapital: true }],
  'TN': [{ name: 'Tunis', lat: 36.8065, lng: 10.1815, isCapital: true }],
  'UG': [{ name: 'Kampala', lat: 0.3476, lng: 32.5825, isCapital: true }],
  'ZM': [{ name: 'Lusaka', lat: -15.3875, lng: 28.3228, isCapital: true }],
  'ZW': [{ name: 'Harare', lat: -17.8252, lng: 31.0335, isCapital: true }],

  // ASIA
  'AF': [{ name: 'Kabul', lat: 34.5553, lng: 69.2075, isCapital: true }],
  'AM': [{ name: 'Yerevan', lat: 40.1792, lng: 44.4991, isCapital: true }],
  'AZ': [{ name: 'Baku', lat: 40.4093, lng: 49.8671, isCapital: true }],
  'BH': [{ name: 'Manama', lat: 26.2285, lng: 50.5860, isCapital: true }],
  'BD': [{ name: 'Dhaka', lat: 23.8103, lng: 90.4125, isCapital: true }],
  'BT': [{ name: 'Thimphu', lat: 27.4728, lng: 89.6390, isCapital: true }],
  'BN': [{ name: 'Bandar Seri Begawan', lat: 4.9031, lng: 114.9398, isCapital: true }],
  'KH': [
    { name: 'Phnom Penh', lat: 11.5564, lng: 104.9282, isCapital: true },
    { name: 'Siem Reap', lat: 13.3671, lng: 103.8448, isCapital: false },
  ],
  'CN': [
    { name: 'Beijing', lat: 39.9042, lng: 116.4074, isCapital: true },
    { name: 'Shanghai', lat: 31.2304, lng: 121.4737, isCapital: false },
    { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, isCapital: false },
    { name: 'Xi\'an', lat: 34.3416, lng: 108.9398, isCapital: false },
    { name: 'Guangzhou', lat: 23.1291, lng: 113.2644, isCapital: false },
  ],
  'CY': [{ name: 'Nicosia', lat: 35.1856, lng: 33.3823, isCapital: true }],
  'GE': [{ name: 'Tbilisi', lat: 41.7151, lng: 44.8271, isCapital: true }],
  'IN': [
    { name: 'New Delhi', lat: 28.6139, lng: 77.2090, isCapital: true },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, isCapital: false },
    { name: 'Agra', lat: 27.1767, lng: 78.0081, isCapital: false },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873, isCapital: false },
    { name: 'Varanasi', lat: 25.3176, lng: 82.9739, isCapital: false },
  ],
  'ID': [
    { name: 'Jakarta', lat: -6.2088, lng: 106.8456, isCapital: true },
    { name: 'Bali', lat: -8.3405, lng: 115.0920, isCapital: false },
    { name: 'Yogyakarta', lat: -7.7956, lng: 110.3695, isCapital: false },
  ],
  'IR': [{ name: 'Tehran', lat: 35.6892, lng: 51.3890, isCapital: true }],
  'IQ': [{ name: 'Baghdad', lat: 33.3152, lng: 44.3661, isCapital: true }],
  'IL': [
    { name: 'Jerusalem', lat: 31.7683, lng: 35.2137, isCapital: true },
    { name: 'Tel Aviv', lat: 32.0853, lng: 34.7818, isCapital: false },
  ],
  'JP': [
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503, isCapital: true },
    { name: 'Kyoto', lat: 35.0116, lng: 135.7681, isCapital: false },
    { name: 'Osaka', lat: 34.6937, lng: 135.5023, isCapital: false },
    { name: 'Hiroshima', lat: 34.3853, lng: 132.4553, isCapital: false },
    { name: 'Nara', lat: 34.6851, lng: 135.8048, isCapital: false },
  ],
  'JO': [
    { name: 'Amman', lat: 31.9454, lng: 35.9284, isCapital: true },
    { name: 'Petra', lat: 30.3285, lng: 35.4444, isCapital: false },
  ],
  'KZ': [{ name: 'Astana', lat: 51.1694, lng: 71.4491, isCapital: true }],
  'KW': [{ name: 'Kuwait City', lat: 29.3759, lng: 47.9774, isCapital: true }],
  'KG': [{ name: 'Bishkek', lat: 42.8746, lng: 74.5698, isCapital: true }],
  'LA': [{ name: 'Vientiane', lat: 17.9757, lng: 102.6331, isCapital: true }],
  'LB': [{ name: 'Beirut', lat: 33.8938, lng: 35.5018, isCapital: true }],
  'MY': [
    { name: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, isCapital: true },
    { name: 'George Town', lat: 5.4141, lng: 100.3288, isCapital: false },
  ],
  'MV': [{ name: 'Malé', lat: 4.1755, lng: 73.5093, isCapital: true }],
  'MN': [{ name: 'Ulaanbaatar', lat: 47.8864, lng: 106.9057, isCapital: true }],
  'MM': [{ name: 'Naypyidaw', lat: 19.7633, lng: 96.0785, isCapital: true }],
  'NP': [{ name: 'Kathmandu', lat: 27.7172, lng: 85.3240, isCapital: true }],
  'KP': [{ name: 'Pyongyang', lat: 39.0392, lng: 125.7625, isCapital: true }],
  'OM': [{ name: 'Muscat', lat: 23.5880, lng: 58.3829, isCapital: true }],
  'PK': [{ name: 'Islamabad', lat: 33.6844, lng: 73.0479, isCapital: true }],
  'PS': [{ name: 'Ramallah', lat: 31.9038, lng: 35.2034, isCapital: true }],
  'PH': [
    { name: 'Manila', lat: 14.5995, lng: 120.9842, isCapital: true },
    { name: 'Cebu', lat: 10.3157, lng: 123.8854, isCapital: false },
  ],
  'QA': [{ name: 'Doha', lat: 25.2854, lng: 51.5310, isCapital: true }],
  'SA': [
    { name: 'Riyadh', lat: 24.7136, lng: 46.6753, isCapital: true },
    { name: 'Jeddah', lat: 21.4858, lng: 39.1925, isCapital: false },
  ],
  'SG': [{ name: 'Singapore', lat: 1.3521, lng: 103.8198, isCapital: true }],
  'KR': [
    { name: 'Seoul', lat: 37.5665, lng: 126.9780, isCapital: true },
    { name: 'Busan', lat: 35.1796, lng: 129.0756, isCapital: false },
  ],
  'LK': [{ name: 'Colombo', lat: 6.9271, lng: 79.8612, isCapital: true }],
  'SY': [{ name: 'Damascus', lat: 33.5138, lng: 36.2765, isCapital: true }],
  'TW': [{ name: 'Taipei', lat: 25.0330, lng: 121.5654, isCapital: true }],
  'TJ': [{ name: 'Dushanbe', lat: 38.5598, lng: 68.7870, isCapital: true }],
  'TH': [
    { name: 'Bangkok', lat: 13.7563, lng: 100.5018, isCapital: true },
    { name: 'Chiang Mai', lat: 18.7883, lng: 98.9853, isCapital: false },
    { name: 'Phuket', lat: 7.8804, lng: 98.3923, isCapital: false },
  ],
  'TL': [{ name: 'Dili', lat: -8.5569, lng: 125.5603, isCapital: true }],
  'TR': [
    { name: 'Ankara', lat: 39.9334, lng: 32.8597, isCapital: true },
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784, isCapital: false },
    { name: 'Antalya', lat: 36.8969, lng: 30.7133, isCapital: false },
  ],
  'TM': [{ name: 'Ashgabat', lat: 37.9601, lng: 58.3261, isCapital: true }],
  'AE': [
    { name: 'Abu Dhabi', lat: 24.4539, lng: 54.3773, isCapital: true },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708, isCapital: false },
  ],
  'UZ': [
    { name: 'Tashkent', lat: 41.2995, lng: 69.2401, isCapital: true },
    { name: 'Samarkand', lat: 39.6270, lng: 66.9750, isCapital: false },
  ],
  'VN': [
    { name: 'Hanoi', lat: 21.0285, lng: 105.8542, isCapital: true },
    { name: 'Ho Chi Minh City', lat: 10.8231, lng: 106.6297, isCapital: false },
    { name: 'Da Nang', lat: 16.0544, lng: 108.2022, isCapital: false },
  ],
  'YE': [{ name: 'Sana\'a', lat: 15.3694, lng: 44.1910, isCapital: true }],

  // EUROPE
  'AL': [{ name: 'Tirana', lat: 41.3275, lng: 19.8187, isCapital: true }],
  'AD': [{ name: 'Andorra la Vella', lat: 42.5063, lng: 1.5218, isCapital: true }],
  'AT': [
    { name: 'Vienna', lat: 48.2082, lng: 16.3738, isCapital: true },
    { name: 'Salzburg', lat: 47.8095, lng: 13.0550, isCapital: false },
  ],
  'BY': [{ name: 'Minsk', lat: 53.9045, lng: 27.5615, isCapital: true }],
  'BE': [
    { name: 'Brussels', lat: 50.8503, lng: 4.3517, isCapital: true },
    { name: 'Bruges', lat: 51.2093, lng: 3.2247, isCapital: false },
  ],
  'BA': [{ name: 'Sarajevo', lat: 43.8563, lng: 18.4131, isCapital: true }],
  'BG': [{ name: 'Sofia', lat: 42.6977, lng: 23.3219, isCapital: true }],
  'HR': [
    { name: 'Zagreb', lat: 45.8150, lng: 15.9819, isCapital: true },
    { name: 'Dubrovnik', lat: 42.6507, lng: 18.0944, isCapital: false },
    { name: 'Split', lat: 43.5081, lng: 16.4402, isCapital: false },
  ],
  'CZ': [{ name: 'Prague', lat: 50.0755, lng: 14.4378, isCapital: true }],
  'DK': [{ name: 'Copenhagen', lat: 55.6761, lng: 12.5683, isCapital: true }],
  'EE': [{ name: 'Tallinn', lat: 59.4370, lng: 24.7536, isCapital: true }],
  'FI': [{ name: 'Helsinki', lat: 60.1699, lng: 24.9384, isCapital: true }],
  'FR': [
    { name: 'Paris', lat: 48.8566, lng: 2.3522, isCapital: true },
    { name: 'Nice', lat: 43.7102, lng: 7.2620, isCapital: false },
    { name: 'Lyon', lat: 45.7640, lng: 4.8357, isCapital: false },
    { name: 'Marseille', lat: 43.2965, lng: 5.3698, isCapital: false },
    { name: 'Bordeaux', lat: 44.8378, lng: -0.5792, isCapital: false },
  ],
  'DE': [
    { name: 'Berlin', lat: 52.5200, lng: 13.4050, isCapital: true },
    { name: 'Munich', lat: 48.1351, lng: 11.5820, isCapital: false },
    { name: 'Hamburg', lat: 53.5511, lng: 9.9937, isCapital: false },
    { name: 'Frankfurt', lat: 50.1109, lng: 8.6821, isCapital: false },
    { name: 'Cologne', lat: 50.9375, lng: 6.9603, isCapital: false },
  ],
  'GR': [
    { name: 'Athens', lat: 37.9838, lng: 23.7275, isCapital: true },
    { name: 'Thessaloniki', lat: 40.6401, lng: 22.9444, isCapital: false },
    { name: 'Santorini', lat: 36.3932, lng: 25.4615, isCapital: false },
  ],
  'HU': [{ name: 'Budapest', lat: 47.4979, lng: 19.0402, isCapital: true }],
  'IS': [{ name: 'Reykjavik', lat: 64.1466, lng: -21.9426, isCapital: true }],
  'IE': [{ name: 'Dublin', lat: 53.3498, lng: -6.2603, isCapital: true }],
  'IT': [
    { name: 'Rome', lat: 41.9028, lng: 12.4964, isCapital: true },
    { name: 'Venice', lat: 45.4408, lng: 12.3155, isCapital: false },
    { name: 'Florence', lat: 43.7696, lng: 11.2558, isCapital: false },
    { name: 'Milan', lat: 45.4642, lng: 9.1900, isCapital: false },
    { name: 'Naples', lat: 40.8518, lng: 14.2681, isCapital: false },
  ],
  'XK': [{ name: 'Pristina', lat: 42.6629, lng: 21.1655, isCapital: true }],
  'LV': [{ name: 'Riga', lat: 56.9496, lng: 24.1052, isCapital: true }],
  'LI': [{ name: 'Vaduz', lat: 47.1410, lng: 9.5209, isCapital: true }],
  'LT': [{ name: 'Vilnius', lat: 54.6872, lng: 25.2797, isCapital: true }],
  'LU': [{ name: 'Luxembourg', lat: 49.6116, lng: 6.1319, isCapital: true }],
  'MT': [{ name: 'Valletta', lat: 35.8989, lng: 14.5146, isCapital: true }],
  'MD': [{ name: 'Chișinău', lat: 47.0105, lng: 28.8638, isCapital: true }],
  'MC': [{ name: 'Monaco', lat: 43.7384, lng: 7.4246, isCapital: true }],
  'ME': [{ name: 'Podgorica', lat: 42.4304, lng: 19.2594, isCapital: true }],
  'NL': [
    { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, isCapital: true },
    { name: 'Rotterdam', lat: 51.9244, lng: 4.4777, isCapital: false },
  ],
  'MK': [{ name: 'Skopje', lat: 41.9973, lng: 21.4280, isCapital: true }],
  'NO': [
    { name: 'Oslo', lat: 59.9139, lng: 10.7522, isCapital: true },
    { name: 'Bergen', lat: 60.3913, lng: 5.3221, isCapital: false },
  ],
  'PL': [
    { name: 'Warsaw', lat: 52.2297, lng: 21.0122, isCapital: true },
    { name: 'Krakow', lat: 50.0647, lng: 19.9450, isCapital: false },
    { name: 'Gdansk', lat: 54.3520, lng: 18.6466, isCapital: false },
  ],
  'PT': [
    { name: 'Lisbon', lat: 38.7223, lng: -9.1393, isCapital: true },
    { name: 'Porto', lat: 41.1579, lng: -8.6291, isCapital: false },
  ],
  'RO': [{ name: 'Bucharest', lat: 44.4268, lng: 26.1025, isCapital: true }],
  'RU': [
    { name: 'Moscow', lat: 55.7558, lng: 37.6173, isCapital: true },
    { name: 'Saint Petersburg', lat: 59.9311, lng: 30.3609, isCapital: false },
  ],
  'SM': [{ name: 'San Marino', lat: 43.9424, lng: 12.4578, isCapital: true }],
  'RS': [{ name: 'Belgrade', lat: 44.7866, lng: 20.4489, isCapital: true }],
  'SK': [{ name: 'Bratislava', lat: 48.1486, lng: 17.1077, isCapital: true }],
  'SI': [{ name: 'Ljubljana', lat: 46.0569, lng: 14.5058, isCapital: true }],
  'ES': [
    { name: 'Madrid', lat: 40.4168, lng: -3.7038, isCapital: true },
    { name: 'Barcelona', lat: 41.3851, lng: 2.1734, isCapital: false },
    { name: 'Seville', lat: 37.3891, lng: -5.9845, isCapital: false },
    { name: 'Valencia', lat: 39.4699, lng: -0.3763, isCapital: false },
    { name: 'Granada', lat: 37.1773, lng: -3.5986, isCapital: false },
  ],
  'SE': [{ name: 'Stockholm', lat: 59.3293, lng: 18.0686, isCapital: true }],
  'CH': [
    { name: 'Bern', lat: 46.9480, lng: 7.4474, isCapital: true },
    { name: 'Zurich', lat: 47.3769, lng: 8.5417, isCapital: false },
    { name: 'Geneva', lat: 46.2044, lng: 6.1432, isCapital: false },
  ],
  'UA': [{ name: 'Kyiv', lat: 50.4501, lng: 30.5234, isCapital: true }],
  'GB': [
    { name: 'London', lat: 51.5074, lng: -0.1278, isCapital: true },
    { name: 'Edinburgh', lat: 55.9533, lng: -3.1883, isCapital: false },
    { name: 'Manchester', lat: 53.4808, lng: -2.2426, isCapital: false },
    { name: 'Oxford', lat: 51.7520, lng: -1.2577, isCapital: false },
    { name: 'Cambridge', lat: 52.2053, lng: 0.1218, isCapital: false },
  ],
  'VA': [{ name: 'Vatican City', lat: 41.9029, lng: 12.4534, isCapital: true }],

  // NORTH AMERICA
  'AG': [{ name: 'Saint John\'s', lat: 17.1274, lng: -61.8468, isCapital: true }],
  'BS': [{ name: 'Nassau', lat: 25.0343, lng: -77.3963, isCapital: true }],
  'BB': [{ name: 'Bridgetown', lat: 13.1132, lng: -59.5988, isCapital: true }],
  'BZ': [{ name: 'Belmopan', lat: 17.2510, lng: -88.7590, isCapital: true }],
  'CA': [
    { name: 'Ottawa', lat: 45.4215, lng: -75.6972, isCapital: true },
    { name: 'Toronto', lat: 43.6532, lng: -79.3832, isCapital: false },
    { name: 'Vancouver', lat: 49.2827, lng: -123.1207, isCapital: false },
    { name: 'Montreal', lat: 45.5017, lng: -73.5673, isCapital: false },
    { name: 'Quebec City', lat: 46.8139, lng: -71.2080, isCapital: false },
  ],
  'CR': [{ name: 'San José', lat: 9.9281, lng: -84.0907, isCapital: true }],
  'CU': [{ name: 'Havana', lat: 23.1136, lng: -82.3666, isCapital: true }],
  'DM': [{ name: 'Roseau', lat: 15.3017, lng: -61.3881, isCapital: true }],
  'DO': [
    { name: 'Santo Domingo', lat: 18.4861, lng: -69.9312, isCapital: true },
    { name: 'Punta Cana', lat: 18.5601, lng: -68.3725, isCapital: false },
  ],
  'SV': [{ name: 'San Salvador', lat: 13.6929, lng: -89.2182, isCapital: true }],
  'GD': [{ name: 'Saint George\'s', lat: 12.0561, lng: -61.7488, isCapital: true }],
  'GT': [{ name: 'Guatemala City', lat: 14.6349, lng: -90.5069, isCapital: true }],
  'HT': [{ name: 'Port-au-Prince', lat: 18.5944, lng: -72.3074, isCapital: true }],
  'HN': [{ name: 'Tegucigalpa', lat: 14.0723, lng: -87.1921, isCapital: true }],
  'JM': [{ name: 'Kingston', lat: 18.0179, lng: -76.8099, isCapital: true }],
  'MX': [
    { name: 'Mexico City', lat: 19.4326, lng: -99.1332, isCapital: true },
    { name: 'Cancun', lat: 21.1619, lng: -86.8515, isCapital: false },
    { name: 'Guadalajara', lat: 20.6597, lng: -103.3496, isCapital: false },
    { name: 'Playa del Carmen', lat: 20.6296, lng: -87.0739, isCapital: false },
  ],
  'NI': [{ name: 'Managua', lat: 12.1149, lng: -86.2362, isCapital: true }],
  'PA': [{ name: 'Panama City', lat: 8.9824, lng: -79.5199, isCapital: true }],
  'KN': [{ name: 'Basseterre', lat: 17.3026, lng: -62.7177, isCapital: true }],
  'LC': [{ name: 'Castries', lat: 14.0101, lng: -60.9875, isCapital: true }],
  'VC': [{ name: 'Kingstown', lat: 13.1587, lng: -61.2248, isCapital: true }],
  'TT': [{ name: 'Port of Spain', lat: 10.6596, lng: -61.5086, isCapital: true }],
  'US': [
    { name: 'Washington D.C.', lat: 38.9072, lng: -77.0369, isCapital: true },
    { name: 'New York City', lat: 40.7128, lng: -74.0060, isCapital: false },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, isCapital: false },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194, isCapital: false },
    { name: 'Las Vegas', lat: 36.1699, lng: -115.1398, isCapital: false },
    { name: 'Miami', lat: 25.7617, lng: -80.1918, isCapital: false },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298, isCapital: false },
    { name: 'New Orleans', lat: 29.9511, lng: -90.0715, isCapital: false },
  ],

  // OCEANIA
  'AU': [
    { name: 'Canberra', lat: -35.2809, lng: 149.1300, isCapital: true },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093, isCapital: false },
    { name: 'Melbourne', lat: -37.8136, lng: 144.9631, isCapital: false },
    { name: 'Brisbane', lat: -27.4698, lng: 153.0251, isCapital: false },
    { name: 'Perth', lat: -31.9505, lng: 115.8605, isCapital: false },
  ],
  'FJ': [{ name: 'Suva', lat: -18.1416, lng: 178.4415, isCapital: true }],
  'KI': [{ name: 'Tarawa', lat: 1.3382, lng: 173.0176, isCapital: true }],
  'MH': [{ name: 'Majuro', lat: 7.1164, lng: 171.1858, isCapital: true }],
  'FM': [{ name: 'Palikir', lat: 6.9248, lng: 158.1610, isCapital: true }],
  'NR': [{ name: 'Yaren', lat: -0.5477, lng: 166.9209, isCapital: true }],
  'NZ': [
    { name: 'Wellington', lat: -41.2865, lng: 174.7762, isCapital: true },
    { name: 'Auckland', lat: -36.8509, lng: 174.7645, isCapital: false },
    { name: 'Queenstown', lat: -45.0312, lng: 168.6626, isCapital: false },
  ],
  'PW': [{ name: 'Ngerulmud', lat: 7.5006, lng: 134.6243, isCapital: true }],
  'PG': [{ name: 'Port Moresby', lat: -9.4438, lng: 147.1803, isCapital: true }],
  'WS': [{ name: 'Apia', lat: -13.8333, lng: -171.7500, isCapital: true }],
  'SB': [{ name: 'Honiara', lat: -9.4456, lng: 159.9729, isCapital: true }],
  'TO': [{ name: 'Nuku\'alofa', lat: -21.2114, lng: -175.1998, isCapital: true }],
  'TV': [{ name: 'Funafuti', lat: -8.5211, lng: 179.1983, isCapital: true }],
  'VU': [{ name: 'Port Vila', lat: -17.7334, lng: 168.3273, isCapital: true }],

  // SOUTH AMERICA
  'AR': [
    { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, isCapital: true },
    { name: 'Mendoza', lat: -32.8908, lng: -68.8272, isCapital: false },
  ],
  'BO': [{ name: 'La Paz', lat: -16.4897, lng: -68.1193, isCapital: true }],
  'BR': [
    { name: 'Brasília', lat: -15.8267, lng: -47.9218, isCapital: true },
    { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, isCapital: false },
    { name: 'São Paulo', lat: -23.5505, lng: -46.6333, isCapital: false },
    { name: 'Salvador', lat: -12.9714, lng: -38.5014, isCapital: false },
  ],
  'CL': [
    { name: 'Santiago', lat: -33.4489, lng: -70.6693, isCapital: true },
    { name: 'Valparaíso', lat: -33.0472, lng: -71.6127, isCapital: false },
  ],
  'CO': [
    { name: 'Bogotá', lat: 4.7110, lng: -74.0721, isCapital: true },
    { name: 'Cartagena', lat: 10.3910, lng: -75.4794, isCapital: false },
    { name: 'Medellín', lat: 6.2476, lng: -75.5658, isCapital: false },
  ],
  'EC': [
    { name: 'Quito', lat: -0.1807, lng: -78.4678, isCapital: true },
    { name: 'Guayaquil', lat: -2.1710, lng: -79.9224, isCapital: false },
  ],
  'GY': [{ name: 'Georgetown', lat: 6.8013, lng: -58.1551, isCapital: true }],
  'PY': [{ name: 'Asunción', lat: -25.2637, lng: -57.5759, isCapital: true }],
  'PE': [
    { name: 'Lima', lat: -12.0464, lng: -77.0428, isCapital: true },
    { name: 'Cusco', lat: -13.5319, lng: -71.9675, isCapital: false },
  ],
  'SR': [{ name: 'Paramaribo', lat: 5.8520, lng: -55.2038, isCapital: true }],
  'UY': [{ name: 'Montevideo', lat: -34.9011, lng: -56.1645, isCapital: true }],
  'VE': [{ name: 'Caracas', lat: 10.4806, lng: -66.9036, isCapital: true }],
};

// ============ HELPER FUNCTIONS ============

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mapOpenTripMapCategory(kinds: string): AttractionCategory {
  const kindLower = kinds.toLowerCase();

  if (kindLower.includes('museum')) return 'museum';
  if (kindLower.includes('beach')) return 'beach';
  if (kindLower.includes('park') || kindLower.includes('garden')) return 'park';
  if (kindLower.includes('church') || kindLower.includes('temple') || kindLower.includes('mosque') || kindLower.includes('religion')) return 'religious';
  if (kindLower.includes('historic') || kindLower.includes('castle') || kindLower.includes('fort') || kindLower.includes('monument')) return 'historical';
  if (kindLower.includes('theatre') || kindLower.includes('cinema') || kindLower.includes('entertainment')) return 'entertainment';
  if (kindLower.includes('shop') || kindLower.includes('market')) return 'shopping';
  if (kindLower.includes('natural') || kindLower.includes('mountain') || kindLower.includes('waterfall')) return 'nature';
  if (kindLower.includes('tower') || kindLower.includes('architecture') || kindLower.includes('bridge')) return 'landmark';

  return 'other';
}

interface OpenTripMapPlace {
  xid: string;
  name: string;
  kinds: string;
  point: { lat: number; lon: number };
  rate: number;
}

interface OpenTripMapPlaceDetails {
  xid: string;
  name: string;
  kinds: string;
  point: { lat: number; lon: number };
  rate: number;
  wikipedia?: string;
  wikipedia_extracts?: { text: string };
  preview?: { source: string };
  image?: string;
  address?: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  url?: string;
}

async function fetchPlacesInRadius(lat: number, lon: number, radiusMeters: number = 10000): Promise<OpenTripMapPlace[]> {
  const url = `${API_BASE_URL}/radius?radius=${radiusMeters}&lon=${lon}&lat=${lat}&kinds=interesting_places&rate=2&limit=20&apikey=${OPENTRIPMAP_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  API Error: ${response.status}`);
      return [];
    }
    const data = await response.json();
    return data.filter((p: OpenTripMapPlace) => p.name && p.name.trim() !== '');
  } catch (error) {
    console.error(`  Fetch error:`, error);
    return [];
  }
}

async function fetchPlaceDetails(xid: string): Promise<OpenTripMapPlaceDetails | null> {
  const url = `${API_BASE_URL}/xid/${xid}?apikey=${OPENTRIPMAP_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

// ============ MAIN FUNCTION ============

async function main() {
  if (OPENTRIPMAP_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('❌ Please set your OpenTripMap API key!');
    console.error('   Get one at: https://dev.opentripmap.org/register');
    console.error('   Then run: OPENTRIPMAP_API_KEY=your_key npx tsx src/scripts/seed-from-api.ts');
    process.exit(1);
  }

  console.log('🌍 Starting to fetch cities and attractions from OpenTripMap...\n');

  // Get all countries from DB
  const countries = await prisma.country.findMany({
    orderBy: { name: 'asc' },
  });

  console.log(`Found ${countries.length} countries in database\n`);

  let totalCities = 0;
  let totalAttractions = 0;

  for (const country of countries) {
    const cities = citiesByCountry[country.code];

    if (!cities || cities.length === 0) {
      continue;
    }

    console.log(`\n🏳️  ${country.name} (${country.code})`);

    for (const cityData of cities) {
      // Check if city already exists
      const existingCity = await prisma.city.findFirst({
        where: {
          name: cityData.name,
          countryId: country.id,
        },
      });

      let cityId: string;

      if (existingCity) {
        cityId = existingCity.id;
        console.log(`  📍 ${cityData.name} (exists)`);
      } else {
        // Create city
        const city = await prisma.city.create({
          data: {
            name: cityData.name,
            latitude: cityData.lat,
            longitude: cityData.lng,
            countryId: country.id,
          },
        });
        cityId = city.id;
        totalCities++;
        console.log(`  📍 ${cityData.name} (created)`);
      }

      // Fetch attractions from OpenTripMap
      await delay(DELAY_MS);
      const places = await fetchPlacesInRadius(cityData.lat, cityData.lng, 15000);

      if (places.length === 0) {
        console.log(`     No attractions found`);
        continue;
      }

      // Get details for top 5 places
      const topPlaces = places.slice(0, 5);
      let attractionsAdded = 0;

      for (const place of topPlaces) {
        // Check if attraction already exists
        const existingAttraction = await prisma.attraction.findFirst({
          where: {
            name: place.name,
            cityId: cityId,
          },
        });

        if (existingAttraction) continue;

        await delay(DELAY_MS);
        const details = await fetchPlaceDetails(place.xid);

        if (!details || !details.name) continue;

        try {
          await prisma.attraction.create({
            data: {
              name: details.name,
              description: details.wikipedia_extracts?.text || `Visit ${details.name} in ${cityData.name}`,
              shortDescription: details.wikipedia_extracts?.text?.substring(0, 150) || `Popular attraction in ${cityData.name}`,
              category: mapOpenTripMapCategory(details.kinds || ''),
              cityId: cityId,
              latitude: details.point.lat,
              longitude: details.point.lon,
              address: details.address
                ? `${details.address.road || ''}, ${details.address.city || cityData.name}, ${details.address.country || country.name}`.trim()
                : `${cityData.name}, ${country.name}`,
              thumbnailUrl: details.preview?.source || details.image || 'https://via.placeholder.com/400x300?text=No+Image',
              images: details.image ? [details.image] : [],
              website: details.url || null,
              isFree: true,
              highlights: [],
              tips: [],
              audioGuide: false,
              guidedTours: false,
              photography: true,
              familyFriendly: true,
            },
          });
          attractionsAdded++;
          totalAttractions++;
        } catch (e: any) {
          if (e.code !== 'P2002') {
            console.error(`     Error adding ${details.name}:`, e.message);
          }
        }
      }

      if (attractionsAdded > 0) {
        console.log(`     ✓ Added ${attractionsAdded} attractions`);
      }
    }
  }

  // Final summary
  const stats = await prisma.$transaction([
    prisma.continent.count(),
    prisma.country.count(),
    prisma.city.count(),
    prisma.attraction.count(),
  ]);

  console.log('\n═══════════════════════════════════════');
  console.log('📊 SEED COMPLETE - FINAL SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`   Continents:   ${stats[0]}`);
  console.log(`   Countries:    ${stats[1]}`);
  console.log(`   Cities:       ${stats[2]} (+${totalCities} new)`);
  console.log(`   Attractions:  ${stats[3]} (+${totalAttractions} new)`);
  console.log('═══════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
