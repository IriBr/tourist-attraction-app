import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Country code mapping (name -> ISO 3166-1 alpha-2)
const COUNTRY_CODES: Record<string, string> = {
  'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Andorra': 'AD', 'Angola': 'AO',
  'Argentina': 'AR', 'Armenia': 'AM', 'Australia': 'AU', 'Austria': 'AT', 'Azerbaijan': 'AZ',
  'Bahamas': 'BS', 'Bahrain': 'BH', 'Bangladesh': 'BD', 'Belgium': 'BE', 'Bhutan': 'BT',
  'Bolivia': 'BO', 'Bosnia and Herzegovina': 'BA', 'Botswana': 'BW', 'Brazil': 'BR',
  'Bulgaria': 'BG', 'Cambodia': 'KH', 'Cameroon': 'CM', 'Canada': 'CA', 'Chile': 'CL',
  'China': 'CN', 'Colombia': 'CO', 'Costa Rica': 'CR', 'Croatia': 'HR', 'Cuba': 'CU',
  'Cyprus': 'CY', 'Czech Republic': 'CZ', 'Denmark': 'DK', 'Dominican Republic': 'DO',
  'Ecuador': 'EC', 'Egypt': 'EG', 'El Salvador': 'SV', 'Estonia': 'EE', 'Ethiopia': 'ET',
  'Fiji': 'FJ', 'Finland': 'FI', 'France': 'FR', 'Georgia': 'GE', 'Germany': 'DE',
  'Ghana': 'GH', 'Greece': 'GR', 'Guatemala': 'GT', 'Honduras': 'HN', 'Hong Kong': 'HK',
  'Hungary': 'HU', 'Iceland': 'IS', 'India': 'IN', 'Indonesia': 'ID', 'Iran': 'IR',
  'Iraq': 'IQ', 'Ireland': 'IE', 'Israel': 'IL', 'Italy': 'IT', 'Jamaica': 'JM',
  'Japan': 'JP', 'Jordan': 'JO', 'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Kuwait': 'KW',
  'Laos': 'LA', 'Latvia': 'LV', 'Lebanon': 'LB', 'Lithuania': 'LT', 'Luxembourg': 'LU',
  'Macedonia': 'MK', 'North Macedonia': 'MK', 'Malaysia': 'MY', 'Maldives': 'MV', 'Malta': 'MT',
  'Mexico': 'MX', 'Moldova': 'MD', 'Monaco': 'MC', 'Mongolia': 'MN', 'Montenegro': 'ME',
  'Morocco': 'MA', 'Myanmar': 'MM', 'Namibia': 'NA', 'Nepal': 'NP', 'Netherlands': 'NL',
  'New Zealand': 'NZ', 'Nicaragua': 'NI', 'Nigeria': 'NG', 'Norway': 'NO', 'Oman': 'OM',
  'Pakistan': 'PK', 'Panama': 'PA', 'Paraguay': 'PY', 'Peru': 'PE', 'Philippines': 'PH',
  'Poland': 'PL', 'Portugal': 'PT', 'Puerto Rico': 'PR', 'Qatar': 'QA', 'Romania': 'RO',
  'Russia': 'RU', 'Saudi Arabia': 'SA', 'Serbia': 'RS', 'Singapore': 'SG', 'Slovakia': 'SK',
  'Slovenia': 'SI', 'South Africa': 'ZA', 'South Korea': 'KR', 'Spain': 'ES', 'Sri Lanka': 'LK',
  'Sweden': 'SE', 'Switzerland': 'CH', 'Taiwan': 'TW', 'Tanzania': 'TZ', 'Thailand': 'TH',
  'Tunisia': 'TN', 'Turkey': 'TR', 'Türkiye': 'TR', 'Uganda': 'UG', 'Ukraine': 'UA',
  'United Arab Emirates': 'AE', 'UAE': 'AE', 'United Kingdom': 'GB', 'UK': 'GB',
  'United States': 'US', 'USA': 'US', 'Uruguay': 'UY', 'Uzbekistan': 'UZ', 'Vatican City': 'VA',
  'Venezuela': 'VE', 'Vietnam': 'VN', 'Zimbabwe': 'ZW',
};

// Use flagcdn.com for flag images (they provide free flags)
function getFlagUrl(countryCode: string): string {
  return `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
}

// Use Unsplash for city images (search API not available without key, so use placeholder or known URLs)
// Using picsum.photos for random city images as placeholder
function getCityImageUrl(cityName: string): string {
  // Use a hash of city name to get consistent but varied images
  const hash = cityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `https://picsum.photos/seed/${hash}/800/600`;
}

async function main() {
  console.log('='.repeat(60));
  console.log(' ADDING LOCATION IMAGES');
  console.log('='.repeat(60));

  // Update countries with flags
  const countries = await prisma.country.findMany();
  console.log(`\nUpdating ${countries.length} countries with flag URLs...`);

  let countriesUpdated = 0;
  for (const country of countries) {
    const code = COUNTRY_CODES[country.name] || country.code;
    if (code) {
      const flagUrl = getFlagUrl(code);
      await prisma.country.update({
        where: { id: country.id },
        data: {
          flagUrl,
          code: code.toUpperCase(),
        },
      });
      countriesUpdated++;
      console.log(`  ✓ ${country.name}: ${flagUrl.substring(0, 50)}...`);
    } else {
      console.log(`  ✗ ${country.name}: No code found`);
    }
  }

  // Update cities with images
  const cities = await prisma.city.findMany({
    include: { country: true },
  });
  console.log(`\nUpdating ${cities.length} cities with image URLs...`);

  let citiesUpdated = 0;
  for (const city of cities) {
    const imageUrl = getCityImageUrl(city.name);
    await prisma.city.update({
      where: { id: city.id },
      data: { imageUrl },
    });
    citiesUpdated++;
  }

  // Update continents with images
  const continents = await prisma.continent.findMany();
  console.log(`\nUpdating ${continents.length} continents with image URLs...`);

  const CONTINENT_IMAGES: Record<string, string> = {
    'Africa': 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
    'Asia': 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800',
    'Europe': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800',
    'North America': 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800',
    'South America': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
    'Oceania': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
    'Antarctica': 'https://images.unsplash.com/photo-1551415923-a2297c7fda79?w=800',
  };

  for (const continent of continents) {
    const imageUrl = CONTINENT_IMAGES[continent.name] || `https://picsum.photos/seed/${continent.name}/800/600`;
    await prisma.continent.update({
      where: { id: continent.id },
      data: { imageUrl },
    });
    console.log(`  ✓ ${continent.name}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(' SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Countries updated: ${countriesUpdated}`);
  console.log(`  Cities updated: ${citiesUpdated}`);
  console.log(`  Continents updated: ${continents.length}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
