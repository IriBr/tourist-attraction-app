import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Continent coordinates and colors
const continentData: Record<string, { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number; color: string }> = {
  'Africa': { latitude: 0, longitude: 20, latitudeDelta: 60, longitudeDelta: 70, color: '#FF9800' },
  'Antarctica': { latitude: -82, longitude: 0, latitudeDelta: 30, longitudeDelta: 180, color: '#90CAF9' },
  'Asia': { latitude: 35, longitude: 100, latitudeDelta: 70, longitudeDelta: 100, color: '#E91E63' },
  'Europe': { latitude: 50, longitude: 10, latitudeDelta: 35, longitudeDelta: 50, color: '#2196F3' },
  'North America': { latitude: 45, longitude: -100, latitudeDelta: 60, longitudeDelta: 80, color: '#4CAF50' },
  'Oceania': { latitude: -25, longitude: 140, latitudeDelta: 50, longitudeDelta: 70, color: '#9C27B0' },
  'South America': { latitude: -15, longitude: -60, latitudeDelta: 60, longitudeDelta: 50, color: '#FF5722' },
};

// Country coordinates (latitude, longitude, latitudeDelta, longitudeDelta)
const countryCoordinates: Record<string, { lat: number; lng: number; latD: number; lngD: number }> = {
  // Africa
  'DZ': { lat: 28.0339, lng: 1.6596, latD: 15, lngD: 15 }, // Algeria
  'AO': { lat: -11.2027, lng: 17.8739, latD: 15, lngD: 15 }, // Angola
  'BJ': { lat: 9.3077, lng: 2.3158, latD: 5, lngD: 3 }, // Benin
  'BW': { lat: -22.3285, lng: 24.6849, latD: 10, lngD: 10 }, // Botswana
  'BF': { lat: 12.2383, lng: -1.5616, latD: 6, lngD: 6 }, // Burkina Faso
  'BI': { lat: -3.3731, lng: 29.9189, latD: 3, lngD: 3 }, // Burundi
  'CV': { lat: 16.5388, lng: -23.0418, latD: 3, lngD: 3 }, // Cabo Verde
  'CM': { lat: 7.3697, lng: 12.3547, latD: 10, lngD: 10 }, // Cameroon
  'CF': { lat: 6.6111, lng: 20.9394, latD: 10, lngD: 15 }, // Central African Republic
  'TD': { lat: 15.4542, lng: 18.7322, latD: 15, lngD: 15 }, // Chad
  'KM': { lat: -11.6455, lng: 43.3333, latD: 2, lngD: 2 }, // Comoros
  'CG': { lat: -0.228, lng: 15.8277, latD: 8, lngD: 8 }, // Congo (Brazzaville)
  'CD': { lat: -4.0383, lng: 21.7587, latD: 15, lngD: 20 }, // Congo (Kinshasa)
  'CI': { lat: 7.54, lng: -5.5471, latD: 8, lngD: 8 }, // Côte d'Ivoire
  'DJ': { lat: 11.8251, lng: 42.5903, latD: 2, lngD: 2 }, // Djibouti
  'EG': { lat: 26.8206, lng: 30.8025, latD: 10, lngD: 12 }, // Egypt
  'GQ': { lat: 1.6508, lng: 10.2679, latD: 3, lngD: 5 }, // Equatorial Guinea
  'ER': { lat: 15.1794, lng: 39.7823, latD: 6, lngD: 8 }, // Eritrea
  'SZ': { lat: -26.5225, lng: 31.4659, latD: 2, lngD: 2 }, // Eswatini
  'ET': { lat: 9.145, lng: 40.4897, latD: 12, lngD: 12 }, // Ethiopia
  'GA': { lat: -0.8037, lng: 11.6094, latD: 6, lngD: 6 }, // Gabon
  'GM': { lat: 13.4432, lng: -15.3101, latD: 2, lngD: 4 }, // Gambia
  'GH': { lat: 7.9465, lng: -1.0232, latD: 7, lngD: 5 }, // Ghana
  'GN': { lat: 9.9456, lng: -9.6966, latD: 6, lngD: 8 }, // Guinea
  'GW': { lat: 11.8037, lng: -15.1804, latD: 3, lngD: 3 }, // Guinea-Bissau
  'KE': { lat: -0.0236, lng: 37.9062, latD: 10, lngD: 10 }, // Kenya
  'LS': { lat: -29.61, lng: 28.2336, latD: 3, lngD: 3 }, // Lesotho
  'LR': { lat: 6.4281, lng: -9.4295, latD: 5, lngD: 5 }, // Liberia
  'LY': { lat: 26.3351, lng: 17.2283, latD: 15, lngD: 20 }, // Libya
  'MG': { lat: -18.7669, lng: 46.8691, latD: 15, lngD: 10 }, // Madagascar
  'MW': { lat: -13.2543, lng: 34.3015, latD: 10, lngD: 5 }, // Malawi
  'ML': { lat: 17.5707, lng: -3.9962, latD: 15, lngD: 15 }, // Mali
  'MR': { lat: 21.0079, lng: -10.9408, latD: 12, lngD: 15 }, // Mauritania
  'MU': { lat: -20.3484, lng: 57.5522, latD: 2, lngD: 2 }, // Mauritius
  'MA': { lat: 31.7917, lng: -7.0926, latD: 10, lngD: 12 }, // Morocco
  'MZ': { lat: -18.6657, lng: 35.5296, latD: 18, lngD: 12 }, // Mozambique
  'NA': { lat: -22.9576, lng: 18.4904, latD: 15, lngD: 15 }, // Namibia
  'NE': { lat: 17.6078, lng: 8.0817, latD: 12, lngD: 15 }, // Niger
  'NG': { lat: 9.082, lng: 8.6753, latD: 12, lngD: 12 }, // Nigeria
  'RW': { lat: -1.9403, lng: 29.8739, latD: 3, lngD: 3 }, // Rwanda
  'ST': { lat: 0.1864, lng: 6.6131, latD: 2, lngD: 2 }, // São Tomé and Príncipe
  'SN': { lat: 14.4974, lng: -14.4524, latD: 6, lngD: 8 }, // Senegal
  'SC': { lat: -4.6796, lng: 55.492, latD: 2, lngD: 2 }, // Seychelles
  'SL': { lat: 8.461, lng: -11.7799, latD: 4, lngD: 4 }, // Sierra Leone
  'SO': { lat: 5.1521, lng: 46.1996, latD: 12, lngD: 12 }, // Somalia
  'ZA': { lat: -30.5595, lng: 22.9375, latD: 15, lngD: 18 }, // South Africa
  'SS': { lat: 6.877, lng: 31.307, latD: 10, lngD: 12 }, // South Sudan
  'SD': { lat: 12.8628, lng: 30.2176, latD: 15, lngD: 15 }, // Sudan
  'TZ': { lat: -6.369, lng: 34.8888, latD: 12, lngD: 12 }, // Tanzania
  'TG': { lat: 8.6195, lng: 0.8248, latD: 5, lngD: 2 }, // Togo
  'TN': { lat: 33.8869, lng: 9.5375, latD: 6, lngD: 6 }, // Tunisia
  'UG': { lat: 1.3733, lng: 32.2903, latD: 6, lngD: 5 }, // Uganda
  'ZM': { lat: -13.1339, lng: 27.8493, latD: 12, lngD: 12 }, // Zambia
  'ZW': { lat: -19.0154, lng: 29.1549, latD: 8, lngD: 8 }, // Zimbabwe

  // Asia
  'AF': { lat: 33.9391, lng: 67.71, latD: 10, lngD: 12 }, // Afghanistan
  'AM': { lat: 40.0691, lng: 45.0382, latD: 3, lngD: 3 }, // Armenia
  'AZ': { lat: 40.1431, lng: 47.5769, latD: 5, lngD: 8 }, // Azerbaijan
  'BH': { lat: 26.0667, lng: 50.5577, latD: 1, lngD: 1 }, // Bahrain
  'BD': { lat: 23.685, lng: 90.3563, latD: 6, lngD: 4 }, // Bangladesh
  'BT': { lat: 27.5142, lng: 90.4336, latD: 2, lngD: 3 }, // Bhutan
  'BN': { lat: 4.5353, lng: 114.7277, latD: 1, lngD: 2 }, // Brunei
  'KH': { lat: 12.5657, lng: 104.991, latD: 5, lngD: 5 }, // Cambodia
  'CN': { lat: 35.8617, lng: 104.1954, latD: 35, lngD: 50 }, // China
  'CY': { lat: 35.1264, lng: 33.4299, latD: 2, lngD: 2 }, // Cyprus
  'GE': { lat: 42.3154, lng: 43.3569, latD: 3, lngD: 5 }, // Georgia
  'IN': { lat: 20.5937, lng: 78.9629, latD: 25, lngD: 25 }, // India
  'ID': { lat: -0.7893, lng: 113.9213, latD: 20, lngD: 40 }, // Indonesia
  'IR': { lat: 32.4279, lng: 53.688, latD: 15, lngD: 20 }, // Iran
  'IQ': { lat: 33.2232, lng: 43.6793, latD: 8, lngD: 10 }, // Iraq
  'IL': { lat: 31.0461, lng: 34.8516, latD: 4, lngD: 2 }, // Israel
  'JP': { lat: 36.2048, lng: 138.2529, latD: 15, lngD: 20 }, // Japan
  'JO': { lat: 30.5852, lng: 36.2384, latD: 4, lngD: 4 }, // Jordan
  'KZ': { lat: 48.0196, lng: 66.9237, latD: 20, lngD: 40 }, // Kazakhstan
  'KW': { lat: 29.3117, lng: 47.4818, latD: 2, lngD: 2 }, // Kuwait
  'KG': { lat: 41.2044, lng: 74.7661, latD: 5, lngD: 8 }, // Kyrgyzstan
  'LA': { lat: 19.8563, lng: 102.4955, latD: 8, lngD: 6 }, // Laos
  'LB': { lat: 33.8547, lng: 35.8623, latD: 2, lngD: 1 }, // Lebanon
  'MY': { lat: 4.2105, lng: 101.9758, latD: 10, lngD: 15 }, // Malaysia
  'MV': { lat: 3.2028, lng: 73.2207, latD: 5, lngD: 2 }, // Maldives
  'MN': { lat: 46.8625, lng: 103.8467, latD: 12, lngD: 25 }, // Mongolia
  'MM': { lat: 21.9162, lng: 95.956, latD: 15, lngD: 10 }, // Myanmar
  'NP': { lat: 28.3949, lng: 84.124, latD: 4, lngD: 6 }, // Nepal
  'KP': { lat: 40.3399, lng: 127.5101, latD: 5, lngD: 5 }, // North Korea
  'OM': { lat: 21.4735, lng: 55.9754, latD: 8, lngD: 8 }, // Oman
  'PK': { lat: 30.3753, lng: 69.3451, latD: 12, lngD: 12 }, // Pakistan
  'PS': { lat: 31.9522, lng: 35.2332, latD: 2, lngD: 1 }, // Palestine
  'PH': { lat: 12.8797, lng: 121.774, latD: 15, lngD: 12 }, // Philippines
  'QA': { lat: 25.3548, lng: 51.1839, latD: 2, lngD: 1 }, // Qatar
  'SA': { lat: 23.8859, lng: 45.0792, latD: 15, lngD: 20 }, // Saudi Arabia
  'SG': { lat: 1.3521, lng: 103.8198, latD: 0.5, lngD: 0.5 }, // Singapore
  'KR': { lat: 35.9078, lng: 127.7669, latD: 5, lngD: 4 }, // South Korea
  'LK': { lat: 7.8731, lng: 80.7718, latD: 5, lngD: 3 }, // Sri Lanka
  'SY': { lat: 34.8021, lng: 38.9968, latD: 5, lngD: 6 }, // Syria
  'TW': { lat: 23.6978, lng: 120.9605, latD: 4, lngD: 3 }, // Taiwan
  'TJ': { lat: 38.861, lng: 71.2761, latD: 4, lngD: 6 }, // Tajikistan
  'TH': { lat: 15.87, lng: 100.9925, latD: 12, lngD: 10 }, // Thailand
  'TL': { lat: -8.8742, lng: 125.7275, latD: 2, lngD: 3 }, // Timor-Leste
  'TR': { lat: 38.9637, lng: 35.2433, latD: 10, lngD: 18 }, // Turkey
  'TM': { lat: 38.9697, lng: 59.5563, latD: 8, lngD: 15 }, // Turkmenistan
  'AE': { lat: 23.4241, lng: 53.8478, latD: 4, lngD: 5 }, // United Arab Emirates
  'UZ': { lat: 41.3775, lng: 64.5853, latD: 8, lngD: 15 }, // Uzbekistan
  'VN': { lat: 14.0583, lng: 108.2772, latD: 15, lngD: 8 }, // Vietnam
  'YE': { lat: 15.5527, lng: 48.5164, latD: 8, lngD: 10 }, // Yemen

  // Europe
  'AL': { lat: 41.1533, lng: 20.1683, latD: 3, lngD: 2 }, // Albania
  'AD': { lat: 42.5063, lng: 1.5218, latD: 0.5, lngD: 0.5 }, // Andorra
  'AT': { lat: 47.5162, lng: 14.5501, latD: 4, lngD: 5 }, // Austria
  'BY': { lat: 53.7098, lng: 27.9534, latD: 5, lngD: 8 }, // Belarus
  'BE': { lat: 50.5039, lng: 4.4699, latD: 2, lngD: 3 }, // Belgium
  'BA': { lat: 43.9159, lng: 17.6791, latD: 3, lngD: 4 }, // Bosnia and Herzegovina
  'BG': { lat: 42.7339, lng: 25.4858, latD: 4, lngD: 5 }, // Bulgaria
  'HR': { lat: 45.1, lng: 15.2, latD: 4, lngD: 6 }, // Croatia
  'CZ': { lat: 49.8175, lng: 15.473, latD: 3, lngD: 5 }, // Czech Republic
  'DK': { lat: 56.2639, lng: 9.5018, latD: 4, lngD: 5 }, // Denmark
  'EE': { lat: 58.5953, lng: 25.0136, latD: 3, lngD: 4 }, // Estonia
  'FI': { lat: 61.9241, lng: 25.7482, latD: 12, lngD: 15 }, // Finland
  'FR': { lat: 46.2276, lng: 2.2137, latD: 10, lngD: 12 }, // France
  'DE': { lat: 51.1657, lng: 10.4515, latD: 8, lngD: 10 }, // Germany
  'GR': { lat: 39.0742, lng: 21.8243, latD: 6, lngD: 8 }, // Greece
  'HU': { lat: 47.1625, lng: 19.5033, latD: 3, lngD: 5 }, // Hungary
  'IS': { lat: 64.9631, lng: -19.0208, latD: 5, lngD: 12 }, // Iceland
  'IE': { lat: 53.1424, lng: -7.6921, latD: 4, lngD: 5 }, // Ireland
  'IT': { lat: 41.8719, lng: 12.5674, latD: 10, lngD: 12 }, // Italy
  'XK': { lat: 42.6026, lng: 20.903, latD: 1.5, lngD: 1.5 }, // Kosovo
  'LV': { lat: 56.8796, lng: 24.6032, latD: 3, lngD: 5 }, // Latvia
  'LI': { lat: 47.166, lng: 9.5554, latD: 0.3, lngD: 0.3 }, // Liechtenstein
  'LT': { lat: 55.1694, lng: 23.8813, latD: 3, lngD: 5 }, // Lithuania
  'LU': { lat: 49.8153, lng: 6.1296, latD: 1, lngD: 1 }, // Luxembourg
  'MT': { lat: 35.9375, lng: 14.3754, latD: 0.5, lngD: 0.5 }, // Malta
  'MD': { lat: 47.4116, lng: 28.3699, latD: 3, lngD: 2 }, // Moldova
  'MC': { lat: 43.7384, lng: 7.4246, latD: 0.1, lngD: 0.1 }, // Monaco
  'ME': { lat: 42.7087, lng: 19.3744, latD: 2, lngD: 2 }, // Montenegro
  'NL': { lat: 52.1326, lng: 5.2913, latD: 3, lngD: 3 }, // Netherlands
  'MK': { lat: 41.5124, lng: 21.7453, latD: 2, lngD: 2 }, // North Macedonia
  'NO': { lat: 60.472, lng: 8.4689, latD: 15, lngD: 20 }, // Norway
  'PL': { lat: 51.9194, lng: 19.1451, latD: 6, lngD: 10 }, // Poland
  'PT': { lat: 39.3999, lng: -8.2245, latD: 5, lngD: 4 }, // Portugal
  'RO': { lat: 45.9432, lng: 24.9668, latD: 5, lngD: 7 }, // Romania
  'RU': { lat: 61.524, lng: 105.3188, latD: 40, lngD: 100 }, // Russia
  'SM': { lat: 43.9424, lng: 12.4578, latD: 0.2, lngD: 0.2 }, // San Marino
  'RS': { lat: 44.0165, lng: 21.0059, latD: 4, lngD: 4 }, // Serbia
  'SK': { lat: 48.669, lng: 19.699, latD: 3, lngD: 4 }, // Slovakia
  'SI': { lat: 46.1512, lng: 14.9955, latD: 2, lngD: 2 }, // Slovenia
  'ES': { lat: 40.4637, lng: -3.7492, latD: 10, lngD: 12 }, // Spain
  'SE': { lat: 60.1282, lng: 18.6435, latD: 15, lngD: 15 }, // Sweden
  'CH': { lat: 46.8182, lng: 8.2275, latD: 3, lngD: 3 }, // Switzerland
  'UA': { lat: 48.3794, lng: 31.1656, latD: 10, lngD: 15 }, // Ukraine
  'GB': { lat: 55.3781, lng: -3.436, latD: 10, lngD: 10 }, // United Kingdom
  'VA': { lat: 41.9029, lng: 12.4534, latD: 0.01, lngD: 0.01 }, // Vatican City

  // North America
  'AG': { lat: 17.0608, lng: -61.7964, latD: 0.5, lngD: 0.5 }, // Antigua and Barbuda
  'BS': { lat: 25.0343, lng: -77.3963, latD: 5, lngD: 5 }, // Bahamas
  'BB': { lat: 13.1939, lng: -59.5432, latD: 0.5, lngD: 0.5 }, // Barbados
  'BZ': { lat: 17.1899, lng: -88.4976, latD: 3, lngD: 2 }, // Belize
  'CA': { lat: 56.1304, lng: -106.3468, latD: 40, lngD: 60 }, // Canada
  'CR': { lat: 9.7489, lng: -83.7534, latD: 3, lngD: 4 }, // Costa Rica
  'CU': { lat: 21.5218, lng: -77.7812, latD: 5, lngD: 10 }, // Cuba
  'DM': { lat: 15.415, lng: -61.371, latD: 0.5, lngD: 0.5 }, // Dominica
  'DO': { lat: 18.7357, lng: -70.1627, latD: 3, lngD: 4 }, // Dominican Republic
  'SV': { lat: 13.7942, lng: -88.8965, latD: 2, lngD: 3 }, // El Salvador
  'GD': { lat: 12.1165, lng: -61.679, latD: 0.5, lngD: 0.5 }, // Grenada
  'GT': { lat: 15.7835, lng: -90.2308, latD: 4, lngD: 4 }, // Guatemala
  'HT': { lat: 18.9712, lng: -72.2852, latD: 2, lngD: 3 }, // Haiti
  'HN': { lat: 15.2, lng: -86.2419, latD: 4, lngD: 6 }, // Honduras
  'JM': { lat: 18.1096, lng: -77.2975, latD: 2, lngD: 3 }, // Jamaica
  'MX': { lat: 23.6345, lng: -102.5528, latD: 20, lngD: 30 }, // Mexico
  'NI': { lat: 12.8654, lng: -85.2072, latD: 4, lngD: 5 }, // Nicaragua
  'PA': { lat: 8.538, lng: -80.7821, latD: 3, lngD: 5 }, // Panama
  'KN': { lat: 17.3578, lng: -62.783, latD: 0.3, lngD: 0.3 }, // Saint Kitts and Nevis
  'LC': { lat: 13.9094, lng: -60.9789, latD: 0.5, lngD: 0.5 }, // Saint Lucia
  'VC': { lat: 12.9843, lng: -61.2872, latD: 0.5, lngD: 0.5 }, // Saint Vincent and the Grenadines
  'TT': { lat: 10.6918, lng: -61.2225, latD: 1.5, lngD: 1.5 }, // Trinidad and Tobago
  'US': { lat: 37.0902, lng: -95.7129, latD: 25, lngD: 55 }, // United States

  // Oceania
  'AU': { lat: -25.2744, lng: 133.7751, latD: 35, lngD: 40 }, // Australia
  'FJ': { lat: -17.7134, lng: 178.065, latD: 5, lngD: 8 }, // Fiji
  'KI': { lat: 1.8709, lng: -157.3626, latD: 5, lngD: 30 }, // Kiribati
  'MH': { lat: 7.1315, lng: 171.1845, latD: 5, lngD: 10 }, // Marshall Islands
  'FM': { lat: 7.4256, lng: 150.5508, latD: 5, lngD: 15 }, // Micronesia
  'NR': { lat: -0.5228, lng: 166.9315, latD: 0.2, lngD: 0.2 }, // Nauru
  'NZ': { lat: -40.9006, lng: 174.886, latD: 15, lngD: 12 }, // New Zealand
  'PW': { lat: 7.515, lng: 134.5825, latD: 2, lngD: 3 }, // Palau
  'PG': { lat: -6.315, lng: 143.9555, latD: 10, lngD: 15 }, // Papua New Guinea
  'WS': { lat: -13.759, lng: -172.1046, latD: 2, lngD: 2 }, // Samoa
  'SB': { lat: -9.6457, lng: 160.1562, latD: 8, lngD: 12 }, // Solomon Islands
  'TO': { lat: -21.179, lng: -175.1982, latD: 3, lngD: 4 }, // Tonga
  'TV': { lat: -7.1095, lng: 179.194, latD: 2, lngD: 2 }, // Tuvalu
  'VU': { lat: -15.3767, lng: 166.9592, latD: 8, lngD: 5 }, // Vanuatu

  // South America
  'AR': { lat: -38.4161, lng: -63.6167, latD: 30, lngD: 20 }, // Argentina
  'BO': { lat: -16.2902, lng: -63.5887, latD: 12, lngD: 12 }, // Bolivia
  'BR': { lat: -14.235, lng: -51.9253, latD: 35, lngD: 35 }, // Brazil
  'CL': { lat: -35.6751, lng: -71.543, latD: 35, lngD: 10 }, // Chile
  'CO': { lat: 4.5709, lng: -74.2973, latD: 12, lngD: 12 }, // Colombia
  'EC': { lat: -1.8312, lng: -78.1834, latD: 6, lngD: 5 }, // Ecuador
  'GY': { lat: 4.8604, lng: -58.9302, latD: 6, lngD: 5 }, // Guyana
  'PY': { lat: -23.4425, lng: -58.4438, latD: 8, lngD: 6 }, // Paraguay
  'PE': { lat: -9.19, lng: -75.0152, latD: 15, lngD: 12 }, // Peru
  'SR': { lat: 3.9193, lng: -56.0278, latD: 5, lngD: 5 }, // Suriname
  'UY': { lat: -32.5228, lng: -55.7658, latD: 5, lngD: 4 }, // Uruguay
  'VE': { lat: 6.4238, lng: -66.5897, latD: 12, lngD: 15 }, // Venezuela
};

async function main() {
  console.log('🌍 Updating location coordinates...\n');

  // Update continents
  console.log('📍 Updating continents...');
  for (const [name, data] of Object.entries(continentData)) {
    await prisma.continent.updateMany({
      where: { name },
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        latitudeDelta: data.latitudeDelta,
        longitudeDelta: data.longitudeDelta,
        color: data.color,
      },
    });
    console.log(`  ✓ ${name}`);
  }

  // Update countries
  console.log('\n🏳️  Updating countries...');
  let countryCount = 0;
  for (const [code, coords] of Object.entries(countryCoordinates)) {
    const result = await prisma.country.updateMany({
      where: { code },
      data: {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: coords.latD,
        longitudeDelta: coords.lngD,
      },
    });
    if (result.count > 0) {
      countryCount++;
    }
  }
  console.log(`  ✓ Updated ${countryCount} countries`);

  // Summary
  const stats = {
    continentsWithCoords: await prisma.continent.count({ where: { latitude: { not: null } } }),
    countriesWithCoords: await prisma.country.count({ where: { latitude: { not: null } } }),
    citiesWithCoords: await prisma.city.count({ where: { latitude: { not: null } } }),
    attractionsWithCoords: await prisma.attraction.count({ where: { latitude: { not: null } } }),
  };

  console.log('\n═══════════════════════════════════════');
  console.log('📊 COORDINATE UPDATE COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`   Continents with coordinates: ${stats.continentsWithCoords}`);
  console.log(`   Countries with coordinates:  ${stats.countriesWithCoords}`);
  console.log(`   Cities with coordinates:     ${stats.citiesWithCoords}`);
  console.log(`   Attractions with coordinates: ${stats.attractionsWithCoords}`);
  console.log('═══════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('Error updating coordinates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
