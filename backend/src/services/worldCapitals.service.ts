import { prisma } from '../config/database.js';
import { AttractionCategory } from '@prisma/client';

const continents = [
  { name: 'Africa', code: 'AF', color: '#FF9800', latitude: 0, longitude: 20, latitudeDelta: 60, longitudeDelta: 60 },
  { name: 'Asia', code: 'AS', color: '#E91E63', latitude: 35, longitude: 100, latitudeDelta: 60, longitudeDelta: 80 },
  { name: 'Europe', code: 'EU', color: '#2196F3', latitude: 50, longitude: 15, latitudeDelta: 35, longitudeDelta: 40 },
  { name: 'North America', code: 'NA', color: '#4CAF50', latitude: 45, longitude: -100, latitudeDelta: 50, longitudeDelta: 60 },
  { name: 'Oceania', code: 'OC', color: '#9C27B0', latitude: -25, longitude: 140, latitudeDelta: 50, longitudeDelta: 60 },
  { name: 'South America', code: 'SA', color: '#FF5722', latitude: -15, longitude: -60, latitudeDelta: 50, longitudeDelta: 40 },
];

interface CountryData {
  name: string;
  code: string;
  capital: string;
  lat: number;
  lng: number;
  countryLat: number;
  countryLng: number;
}

const countriesByContinent: Record<string, CountryData[]> = {
  'Africa': [
    { name: 'Algeria', code: 'DZ', capital: 'Algiers', lat: 36.7538, lng: 3.0588, countryLat: 28.0339, countryLng: 1.6596 },
    { name: 'Angola', code: 'AO', capital: 'Luanda', lat: -8.8390, lng: 13.2894, countryLat: -11.2027, countryLng: 17.8739 },
    { name: 'Benin', code: 'BJ', capital: 'Porto-Novo', lat: 6.4969, lng: 2.6289, countryLat: 9.3077, countryLng: 2.3158 },
    { name: 'Botswana', code: 'BW', capital: 'Gaborone', lat: -24.6282, lng: 25.9231, countryLat: -22.3285, countryLng: 24.6849 },
    { name: 'Burkina Faso', code: 'BF', capital: 'Ouagadougou', lat: 12.3714, lng: -1.5197, countryLat: 12.2383, countryLng: -1.5616 },
    { name: 'Burundi', code: 'BI', capital: 'Gitega', lat: -3.4264, lng: 29.9306, countryLat: -3.3731, countryLng: 29.9189 },
    { name: 'Cabo Verde', code: 'CV', capital: 'Praia', lat: 14.9331, lng: -23.5133, countryLat: 16.5388, countryLng: -23.0418 },
    { name: 'Cameroon', code: 'CM', capital: 'Yaounde', lat: 3.8480, lng: 11.5021, countryLat: 7.3697, countryLng: 12.3547 },
    { name: 'Central African Republic', code: 'CF', capital: 'Bangui', lat: 4.3947, lng: 18.5582, countryLat: 6.6111, countryLng: 20.9394 },
    { name: 'Chad', code: 'TD', capital: 'NDjamena', lat: 12.1348, lng: 15.0557, countryLat: 15.4542, countryLng: 18.7322 },
    { name: 'Comoros', code: 'KM', capital: 'Moroni', lat: -11.7022, lng: 43.2551, countryLat: -11.6455, countryLng: 43.3333 },
    { name: 'Democratic Republic of the Congo', code: 'CD', capital: 'Kinshasa', lat: -4.4419, lng: 15.2663, countryLat: -4.0383, countryLng: 21.7587 },
    { name: 'Republic of the Congo', code: 'CG', capital: 'Brazzaville', lat: -4.2634, lng: 15.2429, countryLat: -0.2280, countryLng: 15.8277 },
    { name: 'Cote dIvoire', code: 'CI', capital: 'Yamoussoukro', lat: 6.8276, lng: -5.2893, countryLat: 7.5400, countryLng: -5.5471 },
    { name: 'Djibouti', code: 'DJ', capital: 'Djibouti', lat: 11.5886, lng: 43.1456, countryLat: 11.8251, countryLng: 42.5903 },
    { name: 'Egypt', code: 'EG', capital: 'Cairo', lat: 30.0444, lng: 31.2357, countryLat: 26.8206, countryLng: 30.8025 },
    { name: 'Equatorial Guinea', code: 'GQ', capital: 'Malabo', lat: 3.7523, lng: 8.7742, countryLat: 1.6508, countryLng: 10.2679 },
    { name: 'Eritrea', code: 'ER', capital: 'Asmara', lat: 15.3229, lng: 38.9251, countryLat: 15.1794, countryLng: 39.7823 },
    { name: 'Eswatini', code: 'SZ', capital: 'Mbabane', lat: -26.3054, lng: 31.1367, countryLat: -26.5225, countryLng: 31.4659 },
    { name: 'Ethiopia', code: 'ET', capital: 'Addis Ababa', lat: 9.0320, lng: 38.7469, countryLat: 9.1450, countryLng: 40.4897 },
    { name: 'Gabon', code: 'GA', capital: 'Libreville', lat: 0.4162, lng: 9.4673, countryLat: -0.8037, countryLng: 11.6094 },
    { name: 'Gambia', code: 'GM', capital: 'Banjul', lat: 13.4549, lng: -16.5790, countryLat: 13.4432, countryLng: -15.3101 },
    { name: 'Ghana', code: 'GH', capital: 'Accra', lat: 5.6037, lng: -0.1870, countryLat: 7.9465, countryLng: -1.0232 },
    { name: 'Guinea', code: 'GN', capital: 'Conakry', lat: 9.6412, lng: -13.5784, countryLat: 9.9456, countryLng: -9.6966 },
    { name: 'Guinea-Bissau', code: 'GW', capital: 'Bissau', lat: 11.8816, lng: -15.6178, countryLat: 11.8037, countryLng: -15.1804 },
    { name: 'Kenya', code: 'KE', capital: 'Nairobi', lat: -1.2921, lng: 36.8219, countryLat: -0.0236, countryLng: 37.9062 },
    { name: 'Lesotho', code: 'LS', capital: 'Maseru', lat: -29.3167, lng: 27.4833, countryLat: -29.6100, countryLng: 28.2336 },
    { name: 'Liberia', code: 'LR', capital: 'Monrovia', lat: 6.2907, lng: -10.7605, countryLat: 6.4281, countryLng: -9.4295 },
    { name: 'Libya', code: 'LY', capital: 'Tripoli', lat: 32.8867, lng: 13.1900, countryLat: 26.3351, countryLng: 17.2283 },
    { name: 'Madagascar', code: 'MG', capital: 'Antananarivo', lat: -18.8792, lng: 47.5079, countryLat: -18.7669, countryLng: 46.8691 },
    { name: 'Malawi', code: 'MW', capital: 'Lilongwe', lat: -13.9626, lng: 33.7741, countryLat: -13.2543, countryLng: 34.3015 },
    { name: 'Mali', code: 'ML', capital: 'Bamako', lat: 12.6392, lng: -8.0029, countryLat: 17.5707, countryLng: -3.9962 },
    { name: 'Mauritania', code: 'MR', capital: 'Nouakchott', lat: 18.0735, lng: -15.9582, countryLat: 21.0079, countryLng: -10.9408 },
    { name: 'Mauritius', code: 'MU', capital: 'Port Louis', lat: -20.1609, lng: 57.5012, countryLat: -20.3484, countryLng: 57.5522 },
    { name: 'Morocco', code: 'MA', capital: 'Rabat', lat: 34.0209, lng: -6.8416, countryLat: 31.7917, countryLng: -7.0926 },
    { name: 'Mozambique', code: 'MZ', capital: 'Maputo', lat: -25.9692, lng: 32.5732, countryLat: -18.6657, countryLng: 35.5296 },
    { name: 'Namibia', code: 'NAM', capital: 'Windhoek', lat: -22.5609, lng: 17.0658, countryLat: -22.9576, countryLng: 18.4904 },
    { name: 'Niger', code: 'NE', capital: 'Niamey', lat: 13.5137, lng: 2.1098, countryLat: 17.6078, countryLng: 8.0817 },
    { name: 'Nigeria', code: 'NG', capital: 'Abuja', lat: 9.0765, lng: 7.3986, countryLat: 9.0820, countryLng: 8.6753 },
    { name: 'Rwanda', code: 'RW', capital: 'Kigali', lat: -1.9403, lng: 29.8739, countryLat: -1.9403, countryLng: 29.8739 },
    { name: 'Sao Tome and Principe', code: 'ST', capital: 'Sao Tome', lat: 0.3302, lng: 6.7333, countryLat: 0.1864, countryLng: 6.6131 },
    { name: 'Senegal', code: 'SN', capital: 'Dakar', lat: 14.7167, lng: -17.4677, countryLat: 14.4974, countryLng: -14.4524 },
    { name: 'Seychelles', code: 'SC', capital: 'Victoria', lat: -4.6191, lng: 55.4513, countryLat: -4.6796, countryLng: 55.4920 },
    { name: 'Sierra Leone', code: 'SL', capital: 'Freetown', lat: 8.4657, lng: -13.2317, countryLat: 8.4606, countryLng: -11.7799 },
    { name: 'Somalia', code: 'SO', capital: 'Mogadishu', lat: 2.0469, lng: 45.3182, countryLat: 5.1521, countryLng: 46.1996 },
    { name: 'South Africa', code: 'ZA', capital: 'Pretoria', lat: -25.7479, lng: 28.2293, countryLat: -30.5595, countryLng: 22.9375 },
    { name: 'South Sudan', code: 'SS', capital: 'Juba', lat: 4.8594, lng: 31.5713, countryLat: 6.8770, countryLng: 31.3070 },
    { name: 'Sudan', code: 'SD', capital: 'Khartoum', lat: 15.5007, lng: 32.5599, countryLat: 12.8628, countryLng: 30.2176 },
    { name: 'Tanzania', code: 'TZ', capital: 'Dodoma', lat: -6.1630, lng: 35.7516, countryLat: -6.3690, countryLng: 34.8888 },
    { name: 'Togo', code: 'TG', capital: 'Lome', lat: 6.1256, lng: 1.2254, countryLat: 8.6195, countryLng: 0.8248 },
    { name: 'Tunisia', code: 'TN', capital: 'Tunis', lat: 36.8065, lng: 10.1815, countryLat: 33.8869, countryLng: 9.5375 },
    { name: 'Uganda', code: 'UG', capital: 'Kampala', lat: 0.3476, lng: 32.5825, countryLat: 1.3733, countryLng: 32.2903 },
    { name: 'Zambia', code: 'ZM', capital: 'Lusaka', lat: -15.3875, lng: 28.3228, countryLat: -13.1339, countryLng: 27.8493 },
    { name: 'Zimbabwe', code: 'ZW', capital: 'Harare', lat: -17.8292, lng: 31.0522, countryLat: -19.0154, countryLng: 29.1549 },
  ],
  'Asia': [
    { name: 'Afghanistan', code: 'AFG', capital: 'Kabul', lat: 34.5553, lng: 69.2075, countryLat: 33.9391, countryLng: 67.7100 },
    { name: 'Armenia', code: 'AM', capital: 'Yerevan', lat: 40.1792, lng: 44.4991, countryLat: 40.0691, countryLng: 45.0382 },
    { name: 'Azerbaijan', code: 'AZ', capital: 'Baku', lat: 40.4093, lng: 49.8671, countryLat: 40.1431, countryLng: 47.5769 },
    { name: 'Bahrain', code: 'BH', capital: 'Manama', lat: 26.2285, lng: 50.5860, countryLat: 26.0667, countryLng: 50.5577 },
    { name: 'Bangladesh', code: 'BD', capital: 'Dhaka', lat: 23.8103, lng: 90.4125, countryLat: 23.6850, countryLng: 90.3563 },
    { name: 'Bhutan', code: 'BT', capital: 'Thimphu', lat: 27.4728, lng: 89.6393, countryLat: 27.5142, countryLng: 90.4336 },
    { name: 'Brunei', code: 'BN', capital: 'Bandar Seri Begawan', lat: 4.9031, lng: 114.9398, countryLat: 4.5353, countryLng: 114.7277 },
    { name: 'Cambodia', code: 'KH', capital: 'Phnom Penh', lat: 11.5564, lng: 104.9282, countryLat: 12.5657, countryLng: 104.9910 },
    { name: 'China', code: 'CN', capital: 'Beijing', lat: 39.9042, lng: 116.4074, countryLat: 35.8617, countryLng: 104.1954 },
    { name: 'Cyprus', code: 'CY', capital: 'Nicosia', lat: 35.1856, lng: 33.3823, countryLat: 35.1264, countryLng: 33.4299 },
    { name: 'Georgia', code: 'GEO', capital: 'Tbilisi', lat: 41.7151, lng: 44.8271, countryLat: 42.3154, countryLng: 43.3569 },
    { name: 'India', code: 'IN', capital: 'New Delhi', lat: 28.6139, lng: 77.2090, countryLat: 20.5937, countryLng: 78.9629 },
    { name: 'Indonesia', code: 'ID', capital: 'Jakarta', lat: -6.2088, lng: 106.8456, countryLat: -0.7893, countryLng: 113.9213 },
    { name: 'Iran', code: 'IR', capital: 'Tehran', lat: 35.6892, lng: 51.3890, countryLat: 32.4279, countryLng: 53.6880 },
    { name: 'Iraq', code: 'IQ', capital: 'Baghdad', lat: 33.3128, lng: 44.3615, countryLat: 33.2232, countryLng: 43.6793 },
    { name: 'Israel', code: 'IL', capital: 'Jerusalem', lat: 31.7683, lng: 35.2137, countryLat: 31.0461, countryLng: 34.8516 },
    { name: 'Japan', code: 'JP', capital: 'Tokyo', lat: 35.6762, lng: 139.6503, countryLat: 36.2048, countryLng: 138.2529 },
    { name: 'Jordan', code: 'JO', capital: 'Amman', lat: 31.9454, lng: 35.9284, countryLat: 30.5852, countryLng: 36.2384 },
    { name: 'Kazakhstan', code: 'KZ', capital: 'Astana', lat: 51.1694, lng: 71.4491, countryLat: 48.0196, countryLng: 66.9237 },
    { name: 'Kuwait', code: 'KW', capital: 'Kuwait City', lat: 29.3759, lng: 47.9774, countryLat: 29.3117, countryLng: 47.4818 },
    { name: 'Kyrgyzstan', code: 'KG', capital: 'Bishkek', lat: 42.8746, lng: 74.5698, countryLat: 41.2044, countryLng: 74.7661 },
    { name: 'Laos', code: 'LA', capital: 'Vientiane', lat: 17.9757, lng: 102.6331, countryLat: 19.8563, countryLng: 102.4955 },
    { name: 'Lebanon', code: 'LB', capital: 'Beirut', lat: 33.8938, lng: 35.5018, countryLat: 33.8547, countryLng: 35.8623 },
    { name: 'Malaysia', code: 'MY', capital: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, countryLat: 4.2105, countryLng: 101.9758 },
    { name: 'Maldives', code: 'MV', capital: 'Male', lat: 4.1755, lng: 73.5093, countryLat: 3.2028, countryLng: 73.2207 },
    { name: 'Mongolia', code: 'MN', capital: 'Ulaanbaatar', lat: 47.8864, lng: 106.9057, countryLat: 46.8625, countryLng: 103.8467 },
    { name: 'Myanmar', code: 'MM', capital: 'Naypyidaw', lat: 19.7633, lng: 96.0785, countryLat: 21.9162, countryLng: 95.9560 },
    { name: 'Nepal', code: 'NP', capital: 'Kathmandu', lat: 27.7172, lng: 85.3240, countryLat: 28.3949, countryLng: 84.1240 },
    { name: 'North Korea', code: 'KP', capital: 'Pyongyang', lat: 39.0392, lng: 125.7625, countryLat: 40.3399, countryLng: 127.5101 },
    { name: 'Oman', code: 'OM', capital: 'Muscat', lat: 23.5880, lng: 58.3829, countryLat: 21.4735, countryLng: 55.9754 },
    { name: 'Pakistan', code: 'PK', capital: 'Islamabad', lat: 33.6844, lng: 73.0479, countryLat: 30.3753, countryLng: 69.3451 },
    { name: 'Palestine', code: 'PS', capital: 'Ramallah', lat: 31.9038, lng: 35.2034, countryLat: 31.9522, countryLng: 35.2332 },
    { name: 'Philippines', code: 'PH', capital: 'Manila', lat: 14.5995, lng: 120.9842, countryLat: 12.8797, countryLng: 121.7740 },
    { name: 'Qatar', code: 'QA', capital: 'Doha', lat: 25.2854, lng: 51.5310, countryLat: 25.3548, countryLng: 51.1839 },
    { name: 'Saudi Arabia', code: 'SAU', capital: 'Riyadh', lat: 24.7136, lng: 46.6753, countryLat: 23.8859, countryLng: 45.0792 },
    { name: 'Singapore', code: 'SG', capital: 'Singapore', lat: 1.3521, lng: 103.8198, countryLat: 1.3521, countryLng: 103.8198 },
    { name: 'South Korea', code: 'KR', capital: 'Seoul', lat: 37.5665, lng: 126.9780, countryLat: 35.9078, countryLng: 127.7669 },
    { name: 'Sri Lanka', code: 'LK', capital: 'Sri Jayawardenepura Kotte', lat: 6.9271, lng: 79.8612, countryLat: 7.8731, countryLng: 80.7718 },
    { name: 'Syria', code: 'SY', capital: 'Damascus', lat: 33.5138, lng: 36.2765, countryLat: 34.8021, countryLng: 38.9968 },
    { name: 'Taiwan', code: 'TW', capital: 'Taipei', lat: 25.0330, lng: 121.5654, countryLat: 23.6978, countryLng: 120.9605 },
    { name: 'Tajikistan', code: 'TJ', capital: 'Dushanbe', lat: 38.5598, lng: 68.7740, countryLat: 38.8610, countryLng: 71.2761 },
    { name: 'Thailand', code: 'TH', capital: 'Bangkok', lat: 13.7563, lng: 100.5018, countryLat: 15.8700, countryLng: 100.9925 },
    { name: 'Timor-Leste', code: 'TL', capital: 'Dili', lat: -8.5569, lng: 125.5603, countryLat: -8.8742, countryLng: 125.7275 },
    { name: 'Turkey', code: 'TR', capital: 'Ankara', lat: 39.9334, lng: 32.8597, countryLat: 38.9637, countryLng: 35.2433 },
    { name: 'Turkmenistan', code: 'TM', capital: 'Ashgabat', lat: 37.9601, lng: 58.3261, countryLat: 38.9697, countryLng: 59.5563 },
    { name: 'United Arab Emirates', code: 'AE', capital: 'Abu Dhabi', lat: 24.4539, lng: 54.3773, countryLat: 23.4241, countryLng: 53.8478 },
    { name: 'Uzbekistan', code: 'UZ', capital: 'Tashkent', lat: 41.2995, lng: 69.2401, countryLat: 41.3775, countryLng: 64.5853 },
    { name: 'Vietnam', code: 'VN', capital: 'Hanoi', lat: 21.0278, lng: 105.8342, countryLat: 14.0583, countryLng: 108.2772 },
    { name: 'Yemen', code: 'YE', capital: 'Sanaa', lat: 15.3694, lng: 44.1910, countryLat: 15.5527, countryLng: 48.5164 },
  ],
  'Europe': [
    { name: 'Albania', code: 'AL', capital: 'Tirana', lat: 41.3275, lng: 19.8187, countryLat: 41.1533, countryLng: 20.1683 },
    { name: 'Andorra', code: 'AD', capital: 'Andorra la Vella', lat: 42.5063, lng: 1.5218, countryLat: 42.5063, countryLng: 1.5218 },
    { name: 'Austria', code: 'AT', capital: 'Vienna', lat: 48.2082, lng: 16.3738, countryLat: 47.5162, countryLng: 14.5501 },
    { name: 'Belarus', code: 'BY', capital: 'Minsk', lat: 53.9006, lng: 27.5590, countryLat: 53.7098, countryLng: 27.9534 },
    { name: 'Belgium', code: 'BE', capital: 'Brussels', lat: 50.8503, lng: 4.3517, countryLat: 50.5039, countryLng: 4.4699 },
    { name: 'Bosnia and Herzegovina', code: 'BA', capital: 'Sarajevo', lat: 43.8563, lng: 18.4131, countryLat: 43.9159, countryLng: 17.6791 },
    { name: 'Bulgaria', code: 'BG', capital: 'Sofia', lat: 42.6977, lng: 23.3219, countryLat: 42.7339, countryLng: 25.4858 },
    { name: 'Croatia', code: 'HR', capital: 'Zagreb', lat: 45.8150, lng: 15.9819, countryLat: 45.1000, countryLng: 15.2000 },
    { name: 'Czech Republic', code: 'CZ', capital: 'Prague', lat: 50.0755, lng: 14.4378, countryLat: 49.8175, countryLng: 15.4730 },
    { name: 'Denmark', code: 'DK', capital: 'Copenhagen', lat: 55.6761, lng: 12.5683, countryLat: 56.2639, countryLng: 9.5018 },
    { name: 'Estonia', code: 'EE', capital: 'Tallinn', lat: 59.4370, lng: 24.7536, countryLat: 58.5953, countryLng: 25.0136 },
    { name: 'Finland', code: 'FI', capital: 'Helsinki', lat: 60.1699, lng: 24.9384, countryLat: 61.9241, countryLng: 25.7482 },
    { name: 'France', code: 'FR', capital: 'Paris', lat: 48.8566, lng: 2.3522, countryLat: 46.2276, countryLng: 2.2137 },
    { name: 'Germany', code: 'DE', capital: 'Berlin', lat: 52.5200, lng: 13.4050, countryLat: 51.1657, countryLng: 10.4515 },
    { name: 'Greece', code: 'GR', capital: 'Athens', lat: 37.9838, lng: 23.7275, countryLat: 39.0742, countryLng: 21.8243 },
    { name: 'Hungary', code: 'HU', capital: 'Budapest', lat: 47.4979, lng: 19.0402, countryLat: 47.1625, countryLng: 19.5033 },
    { name: 'Iceland', code: 'IS', capital: 'Reykjavik', lat: 64.1466, lng: -21.9426, countryLat: 64.9631, countryLng: -19.0208 },
    { name: 'Ireland', code: 'IE', capital: 'Dublin', lat: 53.3498, lng: -6.2603, countryLat: 53.1424, countryLng: -7.6921 },
    { name: 'Italy', code: 'IT', capital: 'Rome', lat: 41.9028, lng: 12.4964, countryLat: 41.8719, countryLng: 12.5674 },
    { name: 'Kosovo', code: 'XK', capital: 'Pristina', lat: 42.6629, lng: 21.1655, countryLat: 42.6026, countryLng: 20.9020 },
    { name: 'Latvia', code: 'LV', capital: 'Riga', lat: 56.9496, lng: 24.1052, countryLat: 56.8796, countryLng: 24.6032 },
    { name: 'Liechtenstein', code: 'LI', capital: 'Vaduz', lat: 47.1410, lng: 9.5209, countryLat: 47.1660, countryLng: 9.5554 },
    { name: 'Lithuania', code: 'LT', capital: 'Vilnius', lat: 54.6872, lng: 25.2797, countryLat: 55.1694, countryLng: 23.8813 },
    { name: 'Luxembourg', code: 'LU', capital: 'Luxembourg City', lat: 49.6116, lng: 6.1319, countryLat: 49.8153, countryLng: 6.1296 },
    { name: 'Malta', code: 'MT', capital: 'Valletta', lat: 35.8989, lng: 14.5146, countryLat: 35.9375, countryLng: 14.3754 },
    { name: 'Moldova', code: 'MD', capital: 'Chisinau', lat: 47.0105, lng: 28.8638, countryLat: 47.4116, countryLng: 28.3699 },
    { name: 'Monaco', code: 'MC', capital: 'Monaco', lat: 43.7384, lng: 7.4246, countryLat: 43.7384, countryLng: 7.4246 },
    { name: 'Montenegro', code: 'ME', capital: 'Podgorica', lat: 42.4304, lng: 19.2594, countryLat: 42.7087, countryLng: 19.3744 },
    { name: 'Netherlands', code: 'NL', capital: 'Amsterdam', lat: 52.3676, lng: 4.9041, countryLat: 52.1326, countryLng: 5.2913 },
    { name: 'North Macedonia', code: 'MK', capital: 'Skopje', lat: 41.9973, lng: 21.4280, countryLat: 41.5124, countryLng: 21.7453 },
    { name: 'Norway', code: 'NO', capital: 'Oslo', lat: 59.9139, lng: 10.7522, countryLat: 60.4720, countryLng: 8.4689 },
    { name: 'Poland', code: 'PL', capital: 'Warsaw', lat: 52.2297, lng: 21.0122, countryLat: 51.9194, countryLng: 19.1451 },
    { name: 'Portugal', code: 'PT', capital: 'Lisbon', lat: 38.7223, lng: -9.1393, countryLat: 39.3999, countryLng: -8.2245 },
    { name: 'Romania', code: 'RO', capital: 'Bucharest', lat: 44.4268, lng: 26.1025, countryLat: 45.9432, countryLng: 24.9668 },
    { name: 'Russia', code: 'RU', capital: 'Moscow', lat: 55.7558, lng: 37.6173, countryLat: 61.5240, countryLng: 105.3188 },
    { name: 'San Marino', code: 'SM', capital: 'San Marino', lat: 43.9424, lng: 12.4578, countryLat: 43.9424, countryLng: 12.4578 },
    { name: 'Serbia', code: 'RS', capital: 'Belgrade', lat: 44.7866, lng: 20.4489, countryLat: 44.0165, countryLng: 21.0059 },
    { name: 'Slovakia', code: 'SK', capital: 'Bratislava', lat: 48.1486, lng: 17.1077, countryLat: 48.6690, countryLng: 19.6990 },
    { name: 'Slovenia', code: 'SI', capital: 'Ljubljana', lat: 46.0569, lng: 14.5058, countryLat: 46.1512, countryLng: 14.9955 },
    { name: 'Spain', code: 'ES', capital: 'Madrid', lat: 40.4168, lng: -3.7038, countryLat: 40.4637, countryLng: -3.7492 },
    { name: 'Sweden', code: 'SE', capital: 'Stockholm', lat: 59.3293, lng: 18.0686, countryLat: 60.1282, countryLng: 18.6435 },
    { name: 'Switzerland', code: 'CH', capital: 'Bern', lat: 46.9480, lng: 7.4474, countryLat: 46.8182, countryLng: 8.2275 },
    { name: 'Ukraine', code: 'UA', capital: 'Kyiv', lat: 50.4501, lng: 30.5234, countryLat: 48.3794, countryLng: 31.1656 },
    { name: 'United Kingdom', code: 'GB', capital: 'London', lat: 51.5074, lng: -0.1278, countryLat: 55.3781, countryLng: -3.4360 },
    { name: 'Vatican City', code: 'VA', capital: 'Vatican City', lat: 41.9029, lng: 12.4534, countryLat: 41.9029, countryLng: 12.4534 },
  ],
  'North America': [
    { name: 'Antigua and Barbuda', code: 'AG', capital: 'Saint Johns', lat: 17.1274, lng: -61.8468, countryLat: 17.0608, countryLng: -61.7964 },
    { name: 'Bahamas', code: 'BS', capital: 'Nassau', lat: 25.0343, lng: -77.3963, countryLat: 25.0343, countryLng: -77.3963 },
    { name: 'Barbados', code: 'BB', capital: 'Bridgetown', lat: 13.1132, lng: -59.5988, countryLat: 13.1939, countryLng: -59.5432 },
    { name: 'Belize', code: 'BZ', capital: 'Belmopan', lat: 17.2510, lng: -88.7590, countryLat: 17.1899, countryLng: -88.4976 },
    { name: 'Canada', code: 'CA', capital: 'Ottawa', lat: 45.4215, lng: -75.6972, countryLat: 56.1304, countryLng: -106.3468 },
    { name: 'Costa Rica', code: 'CR', capital: 'San Jose', lat: 9.9281, lng: -84.0907, countryLat: 9.7489, countryLng: -83.7534 },
    { name: 'Cuba', code: 'CU', capital: 'Havana', lat: 23.1136, lng: -82.3666, countryLat: 21.5218, countryLng: -77.7812 },
    { name: 'Dominica', code: 'DM', capital: 'Roseau', lat: 15.3092, lng: -61.3794, countryLat: 15.4150, countryLng: -61.3710 },
    { name: 'Dominican Republic', code: 'DO', capital: 'Santo Domingo', lat: 18.4861, lng: -69.9312, countryLat: 18.7357, countryLng: -70.1627 },
    { name: 'El Salvador', code: 'SV', capital: 'San Salvador', lat: 13.6929, lng: -89.2182, countryLat: 13.7942, countryLng: -88.8965 },
    { name: 'Grenada', code: 'GD', capital: 'Saint Georges', lat: 12.0561, lng: -61.7488, countryLat: 12.1165, countryLng: -61.6790 },
    { name: 'Guatemala', code: 'GT', capital: 'Guatemala City', lat: 14.6349, lng: -90.5069, countryLat: 15.7835, countryLng: -90.2308 },
    { name: 'Haiti', code: 'HT', capital: 'Port-au-Prince', lat: 18.5944, lng: -72.3074, countryLat: 18.9712, countryLng: -72.2852 },
    { name: 'Honduras', code: 'HN', capital: 'Tegucigalpa', lat: 14.0723, lng: -87.1921, countryLat: 15.2000, countryLng: -86.2419 },
    { name: 'Jamaica', code: 'JM', capital: 'Kingston', lat: 18.0179, lng: -76.8099, countryLat: 18.1096, countryLng: -77.2975 },
    { name: 'Mexico', code: 'MX', capital: 'Mexico City', lat: 19.4326, lng: -99.1332, countryLat: 23.6345, countryLng: -102.5528 },
    { name: 'Nicaragua', code: 'NI', capital: 'Managua', lat: 12.1150, lng: -86.2362, countryLat: 12.8654, countryLng: -85.2072 },
    { name: 'Panama', code: 'PA', capital: 'Panama City', lat: 8.9824, lng: -79.5199, countryLat: 8.5380, countryLng: -80.7821 },
    { name: 'Saint Kitts and Nevis', code: 'KN', capital: 'Basseterre', lat: 17.3026, lng: -62.7177, countryLat: 17.3578, countryLng: -62.7830 },
    { name: 'Saint Lucia', code: 'LC', capital: 'Castries', lat: 14.0101, lng: -60.9875, countryLat: 13.9094, countryLng: -60.9789 },
    { name: 'Saint Vincent and the Grenadines', code: 'VC', capital: 'Kingstown', lat: 13.1600, lng: -61.2248, countryLat: 12.9843, countryLng: -61.2872 },
    { name: 'Trinidad and Tobago', code: 'TT', capital: 'Port of Spain', lat: 10.6549, lng: -61.5019, countryLat: 10.6918, countryLng: -61.2225 },
    { name: 'United States', code: 'US', capital: 'Washington DC', lat: 38.9072, lng: -77.0369, countryLat: 37.0902, countryLng: -95.7129 },
  ],
  'Oceania': [
    { name: 'Australia', code: 'AU', capital: 'Canberra', lat: -35.2809, lng: 149.1300, countryLat: -25.2744, countryLng: 133.7751 },
    { name: 'Fiji', code: 'FJ', capital: 'Suva', lat: -18.1416, lng: 178.4419, countryLat: -17.7134, countryLng: 178.0650 },
    { name: 'Kiribati', code: 'KI', capital: 'South Tarawa', lat: 1.3382, lng: 173.0176, countryLat: -3.3704, countryLng: -168.7340 },
    { name: 'Marshall Islands', code: 'MH', capital: 'Majuro', lat: 7.1164, lng: 171.1858, countryLat: 7.1315, countryLng: 171.1845 },
    { name: 'Micronesia', code: 'FM', capital: 'Palikir', lat: 6.9248, lng: 158.1610, countryLat: 7.4256, countryLng: 150.5508 },
    { name: 'Nauru', code: 'NR', capital: 'Yaren', lat: -0.5477, lng: 166.9209, countryLat: -0.5228, countryLng: 166.9315 },
    { name: 'New Zealand', code: 'NZ', capital: 'Wellington', lat: -41.2866, lng: 174.7756, countryLat: -40.9006, countryLng: 174.8860 },
    { name: 'Palau', code: 'PW', capital: 'Ngerulmud', lat: 7.5006, lng: 134.6242, countryLat: 7.5150, countryLng: 134.5825 },
    { name: 'Papua New Guinea', code: 'PG', capital: 'Port Moresby', lat: -9.4438, lng: 147.1803, countryLat: -6.3150, countryLng: 143.9555 },
    { name: 'Samoa', code: 'WS', capital: 'Apia', lat: -13.8506, lng: -171.7513, countryLat: -13.7590, countryLng: -172.1046 },
    { name: 'Solomon Islands', code: 'SB', capital: 'Honiara', lat: -9.4456, lng: 159.9729, countryLat: -9.6457, countryLng: 160.1562 },
    { name: 'Tonga', code: 'TO', capital: 'Nukualofa', lat: -21.2114, lng: -175.1998, countryLat: -21.1790, countryLng: -175.1982 },
    { name: 'Tuvalu', code: 'TV', capital: 'Funafuti', lat: -8.5167, lng: 179.2167, countryLat: -7.1095, countryLng: 179.1940 },
    { name: 'Vanuatu', code: 'VU', capital: 'Port Vila', lat: -17.7333, lng: 168.3167, countryLat: -15.3767, countryLng: 166.9592 },
  ],
  'South America': [
    { name: 'Argentina', code: 'AR', capital: 'Buenos Aires', lat: -34.6037, lng: -58.3816, countryLat: -38.4161, countryLng: -63.6167 },
    { name: 'Bolivia', code: 'BO', capital: 'Sucre', lat: -19.0196, lng: -65.2619, countryLat: -16.2902, countryLng: -63.5887 },
    { name: 'Brazil', code: 'BR', capital: 'Brasilia', lat: -15.8267, lng: -47.9218, countryLat: -14.2350, countryLng: -51.9253 },
    { name: 'Chile', code: 'CL', capital: 'Santiago', lat: -33.4489, lng: -70.6693, countryLat: -35.6751, countryLng: -71.5430 },
    { name: 'Colombia', code: 'CO', capital: 'Bogota', lat: 4.7110, lng: -74.0721, countryLat: 4.5709, countryLng: -74.2973 },
    { name: 'Ecuador', code: 'EC', capital: 'Quito', lat: -0.1807, lng: -78.4678, countryLat: -1.8312, countryLng: -78.1834 },
    { name: 'Guyana', code: 'GY', capital: 'Georgetown', lat: 6.8013, lng: -58.1551, countryLat: 4.8604, countryLng: -58.9302 },
    { name: 'Paraguay', code: 'PY', capital: 'Asuncion', lat: -25.2637, lng: -57.5759, countryLat: -23.4425, countryLng: -58.4438 },
    { name: 'Peru', code: 'PE', capital: 'Lima', lat: -12.0464, lng: -77.0428, countryLat: -9.1900, countryLng: -75.0152 },
    { name: 'Suriname', code: 'SR', capital: 'Paramaribo', lat: 5.8520, lng: -55.2038, countryLat: 3.9193, countryLng: -56.0278 },
    { name: 'Uruguay', code: 'UY', capital: 'Montevideo', lat: -34.9011, lng: -56.1645, countryLat: -32.5228, countryLng: -55.7658 },
    { name: 'Venezuela', code: 'VE', capital: 'Caracas', lat: 10.4806, lng: -66.9036, countryLat: 6.4238, countryLng: -66.5897 },
  ],
};

const EXCLUDED_TYPES = new Set([
  'bar', 'restaurant', 'night_club', 'liquor_store', 'cafe', 'bakery',
  'meal_delivery', 'meal_takeaway', 'food',
]);

function mapGoogleTypeToCategory(types: string[]): AttractionCategory | null {
  for (const type of types) {
    if (EXCLUDED_TYPES.has(type)) return null;
  }
  const typeMap: Record<string, AttractionCategory> = {
    'museum': 'museum', 'art_gallery': 'museum', 'park': 'park',
    'national_park': 'nature', 'amusement_park': 'entertainment',
    'tourist_attraction': 'landmark', 'point_of_interest': 'landmark',
    'church': 'religious', 'hindu_temple': 'religious', 'mosque': 'religious',
    'synagogue': 'religious', 'place_of_worship': 'religious',
    'natural_feature': 'nature', 'beach': 'beach', 'zoo': 'nature',
    'aquarium': 'nature', 'shopping_mall': 'shopping', 'stadium': 'entertainment',
    'movie_theater': 'entertainment', 'casino': 'entertainment',
    'historical_landmark': 'historical', 'monument': 'historical',
  };
  for (const type of types) {
    if (typeMap[type]) return typeMap[type];
  }
  return 'landmark';
}

const SEARCH_QUERIES = [
  'famous landmarks and monuments in',
  'museums and galleries in',
  'parks and gardens in',
  'historical sites in',
];

async function searchAttractions(query: string, lat: number, lng: number, apiKey: string): Promise<any[]> {
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.editorialSummary,places.photos,places.websiteUri',
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 25000 } },
        maxResultCount: 15,
        languageCode: 'en',
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.places || [];
  } catch {
    return [];
  }
}

function getPhotoUrl(photoName: string, apiKey: string): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${apiKey}`;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function seedWorldCapitals(): Promise<{
  stats: { continents: number; countries: number; cities: number; attractions: number; skipped: number };
  totals: { continents: number; countries: number; cities: number; attractions: number };
}> {
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY environment variable is required');
  }

  const stats = { continents: 0, countries: 0, cities: 0, attractions: 0, skipped: 0 };
  const continentMap: Record<string, string> = {};

  // Create/update continents
  for (const continent of continents) {
    const existing = await prisma.continent.findUnique({ where: { code: continent.code } });
    if (existing) {
      await prisma.continent.update({
        where: { id: existing.id },
        data: { latitude: continent.latitude, longitude: continent.longitude, latitudeDelta: continent.latitudeDelta, longitudeDelta: continent.longitudeDelta, color: continent.color },
      });
      continentMap[continent.name] = existing.id;
    } else {
      const created = await prisma.continent.create({ data: continent });
      continentMap[continent.name] = created.id;
      stats.continents++;
    }
  }

  // Process countries
  for (const [continentName, countries] of Object.entries(countriesByContinent)) {
    const continentId = continentMap[continentName];
    if (!continentId) continue;

    for (const countryData of countries) {
      let country = await prisma.country.findUnique({ where: { code: countryData.code } });
      if (!country) {
        try {
          country = await prisma.country.create({
            data: {
              name: countryData.name,
              code: countryData.code,
              continentId,
              latitude: countryData.countryLat,
              longitude: countryData.countryLng,
              latitudeDelta: 10,
              longitudeDelta: 10,
            },
          });
          stats.countries++;
        } catch (e: any) {
          if (e.code === 'P2002') continue;
          throw e;
        }
      }

      let city = await prisma.city.findFirst({ where: { name: countryData.capital, countryId: country.id } });
      if (!city) {
        city = await prisma.city.create({
          data: { name: countryData.capital, countryId: country.id, latitude: countryData.lat, longitude: countryData.lng },
        });
        stats.cities++;
      }

      const attractionCount = await prisma.attraction.count({ where: { cityId: city.id } });
      if (attractionCount >= 10) continue;

      const seenPlaceIds = new Set<string>();
      for (const queryPrefix of SEARCH_QUERIES) {
        const places = await searchAttractions(`${queryPrefix} ${countryData.capital}`, countryData.lat, countryData.lng, GOOGLE_API_KEY);
        for (const place of places) {
          if (seenPlaceIds.has(place.id)) continue;
          seenPlaceIds.add(place.id);

          const placeName = place.displayName?.text || '';
          if (!placeName) continue;

          const category = mapGoogleTypeToCategory(place.types || []);
          if (!category) { stats.skipped++; continue; }

          const rating = place.rating || 0;
          const reviews = place.userRatingCount || 0;
          if (rating < 3.5 || reviews < 10) { stats.skipped++; continue; }

          const existing = await prisma.attraction.findFirst({ where: { name: placeName, cityId: city.id } });
          if (existing) continue;

          const images: string[] = [];
          let thumbnailUrl = 'https://via.placeholder.com/400x300?text=No+Image';
          if (place.photos?.length > 0) {
            thumbnailUrl = getPhotoUrl(place.photos[0].name, GOOGLE_API_KEY);
            for (let i = 0; i < Math.min(place.photos.length, 3); i++) {
              images.push(getPhotoUrl(place.photos[i].name, GOOGLE_API_KEY));
            }
          }

          try {
            await prisma.attraction.create({
              data: {
                name: placeName,
                description: place.editorialSummary?.text || `A popular attraction in ${countryData.capital}, ${countryData.name}`,
                shortDescription: place.editorialSummary?.text?.substring(0, 150) || `Visit ${placeName}`,
                category,
                cityId: city.id,
                latitude: place.location?.latitude || countryData.lat,
                longitude: place.location?.longitude || countryData.lng,
                address: place.formattedAddress || `${countryData.capital}, ${countryData.name}`,
                images,
                thumbnailUrl,
                website: place.websiteUri || null,
                averageRating: rating,
                totalReviews: reviews,
                isFree: false,
              },
            });
            stats.attractions++;
          } catch {
            // Ignore duplicates
          }
        }
        await delay(200);
      }
      await delay(300);
    }
  }

  const totals = {
    continents: await prisma.continent.count(),
    countries: await prisma.country.count(),
    cities: await prisma.city.count(),
    attractions: await prisma.attraction.count(),
  };

  return { stats, totals };
}
