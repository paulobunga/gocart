import { NextRequest, NextResponse } from 'next/server'

/**
 * Map country code to full country name
 */
function getCountryName(countryCode: string): string {
  const countryMap: Record<string, string> = {
    'UG': 'Uganda',
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'PL': 'Poland',
    'PT': 'Portugal',
    'IE': 'Ireland',
    'GR': 'Greece',
    'CZ': 'Czech Republic',
    'HU': 'Hungary',
    'RO': 'Romania',
    'BG': 'Bulgaria',
    'HR': 'Croatia',
    'SK': 'Slovakia',
    'SI': 'Slovenia',
    'LT': 'Lithuania',
    'LV': 'Latvia',
    'EE': 'Estonia',
    'LU': 'Luxembourg',
    'MT': 'Malta',
    'CY': 'Cyprus',
    'IS': 'Iceland',
    'LI': 'Liechtenstein',
    'MC': 'Monaco',
    'SM': 'San Marino',
    'VA': 'Vatican City',
    'AD': 'Andorra',
    'JP': 'Japan',
    'CN': 'China',
    'IN': 'India',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'AR': 'Argentina',
    'CL': 'Chile',
    'CO': 'Colombia',
    'PE': 'Peru',
    'VE': 'Venezuela',
    'EC': 'Ecuador',
    'BO': 'Bolivia',
    'PY': 'Paraguay',
    'UY': 'Uruguay',
    'CR': 'Costa Rica',
    'PA': 'Panama',
    'GT': 'Guatemala',
    'HN': 'Honduras',
    'NI': 'Nicaragua',
    'SV': 'El Salvador',
    'DO': 'Dominican Republic',
    'CU': 'Cuba',
    'JM': 'Jamaica',
    'HT': 'Haiti',
    'TT': 'Trinidad and Tobago',
    'BB': 'Barbados',
    'BS': 'Bahamas',
    'BZ': 'Belize',
    'GY': 'Guyana',
    'SR': 'Suriname',
    'GF': 'French Guiana',
    'ZA': 'South Africa',
    'EG': 'Egypt',
    'NG': 'Nigeria',
    'KE': 'Kenya',
    'GH': 'Ghana',
    'TZ': 'Tanzania',
    'ET': 'Ethiopia',
    'DZ': 'Algeria',
    'MA': 'Morocco',
    'TN': 'Tunisia',
    'LY': 'Libya',
    'SD': 'Sudan',
    'AO': 'Angola',
    'MZ': 'Mozambique',
    'ZM': 'Zambia',
    'ZW': 'Zimbabwe',
    'BW': 'Botswana',
    'NA': 'Namibia',
    'MG': 'Madagascar',
    'MU': 'Mauritius',
    'SC': 'Seychelles',
    'RW': 'Rwanda',
    'BI': 'Burundi',
    'MW': 'Malawi',
    'SO': 'Somalia',
    'DJ': 'Djibouti',
    'ER': 'Eritrea',
    'SS': 'South Sudan',
    'CF': 'Central African Republic',
    'TD': 'Chad',
    'CM': 'Cameroon',
    'GA': 'Gabon',
    'CG': 'Congo',
    'CD': 'Democratic Republic of the Congo',
    'ST': 'Sao Tome and Principe',
    'GQ': 'Equatorial Guinea',
    'GW': 'Guinea-Bissau',
    'GN': 'Guinea',
    'SL': 'Sierra Leone',
    'LR': 'Liberia',
    'CI': 'Ivory Coast',
    'BF': 'Burkina Faso',
    'ML': 'Mali',
    'NE': 'Niger',
    'MR': 'Mauritania',
    'SN': 'Senegal',
    'GM': 'Gambia',
    'TG': 'Togo',
    'BJ': 'Benin',
    'RU': 'Russia',
    'UA': 'Ukraine',
    'BY': 'Belarus',
    'KZ': 'Kazakhstan',
    'UZ': 'Uzbekistan',
    'TM': 'Turkmenistan',
    'TJ': 'Tajikistan',
    'KG': 'Kyrgyzstan',
    'AF': 'Afghanistan',
    'PK': 'Pakistan',
    'BD': 'Bangladesh',
    'LK': 'Sri Lanka',
    'NP': 'Nepal',
    'BT': 'Bhutan',
    'MV': 'Maldives',
    'MY': 'Malaysia',
    'SG': 'Singapore',
    'TH': 'Thailand',
    'VN': 'Vietnam',
    'PH': 'Philippines',
    'ID': 'Indonesia',
    'MM': 'Myanmar',
    'KH': 'Cambodia',
    'LA': 'Laos',
    'BN': 'Brunei',
    'TL': 'East Timor',
    'KR': 'South Korea',
    'KP': 'North Korea',
    'MN': 'Mongolia',
    'TW': 'Taiwan',
    'HK': 'Hong Kong',
    'MO': 'Macau',
    'NZ': 'New Zealand',
    'FJ': 'Fiji',
    'PG': 'Papua New Guinea',
    'SB': 'Solomon Islands',
    'VU': 'Vanuatu',
    'NC': 'New Caledonia',
    'PF': 'French Polynesia',
    'WS': 'Samoa',
    'TO': 'Tonga',
    'KI': 'Kiribati',
    'TV': 'Tuvalu',
    'NR': 'Nauru',
    'PW': 'Palau',
    'FM': 'Micronesia',
    'MH': 'Marshall Islands',
    'IL': 'Israel',
    'PS': 'Palestine',
    'JO': 'Jordan',
    'LB': 'Lebanon',
    'SY': 'Syria',
    'IQ': 'Iraq',
    'IR': 'Iran',
    'SA': 'Saudi Arabia',
    'AE': 'United Arab Emirates',
    'OM': 'Oman',
    'YE': 'Yemen',
    'KW': 'Kuwait',
    'QA': 'Qatar',
    'BH': 'Bahrain',
    'TR': 'Turkey',
    'GE': 'Georgia',
    'AM': 'Armenia',
    'AZ': 'Azerbaijan',
  }

  return countryMap[countryCode.toUpperCase()] || countryCode || 'Unknown'
}

/**
 * Check if IP is localhost or private
 */
function isPrivateIP(ip: string): boolean {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return true
  }
  
  // Check for private IP ranges
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
  ]
  
  return privateRanges.some(range => range.test(ip))
}

/**
 * GET /api/location/ip - Get location (city and country) from IP address
 */
export async function GET(request: NextRequest) {
  try {
    // Get IP address from request headers
    // Check various headers for the real IP (handles proxies, load balancers, etc.)
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0]?.trim() || realIp?.trim() || ''

    // For localhost/private IPs, return Kampala, Uganda for local development
    if (!ip || isPrivateIP(ip)) {
      return NextResponse.json({
        success: true,
        data: {
          city: 'Kampala',
          country: 'Uganda',
          countryCode: 'UG',
        }
      })
    }

    // Use ipinfo.io service with token
    const IPINFO_TOKEN = process.env.IPINFO_TOKEN || '0ee942d1ec7c95'
    
    try {
      const response = await fetch(`https://ipinfo.io/${ip}?token=${IPINFO_TOKEN}`, {
        headers: {
          'User-Agent': 'GoCart-App'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch location from IP')
      }

      const data = await response.json()

      // ipinfo.io returns: city, region, country (2-letter code), etc.
      // We need to map country code to full country name
      const city = data.city || 'Unknown'
      const countryCode = data.country || ''
      const countryName = getCountryName(countryCode)

      return NextResponse.json({
        success: true,
        data: {
          city: city,
          country: countryName,
          countryCode: countryCode,
        }
      })
    } catch (error: any) {
      console.error('Error fetching location from ipinfo.io:', error)
      // Return Kampala, Uganda as fallback
      return NextResponse.json({
        success: true,
        data: {
          city: 'Kampala',
          country: 'Uganda',
          countryCode: 'UG',
        }
      })
    }
  } catch (error: any) {
    console.error('Error fetching location from IP:', error)
    // Return Kampala, Uganda as fallback
    return NextResponse.json({
      success: true,
      data: {
        city: 'Kampala',
        country: 'Uganda',
        countryCode: 'UG',
      }
    })
  }
}

