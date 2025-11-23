/**
 * Iotec Payment Gateway Integration
 * Supports MTN and Airtel mobile money payments
 * 
 * API Documentation: https://pay.iotec.io
 * 
 * To use this integration:
 * 1. Get Iotec API credentials from https://iotec.io
 * 2. Add to .env.local:
 *    IOTEC_CLIENT_ID=your_client_id
 *    IOTEC_CLIENT_SECRET=your_client_secret
 *    IOTEC_WALLET_ID=your_wallet_id (UUID)
 *    IOTEC_BASE_URL=https://pay.iotec.io (default)
 *    IOTEC_AUTH_URL=https://id.iotec.io (default)
 */

interface IotecAccessToken {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
}

interface IotecPaymentRequest {
  amount: number
  currency: 'ITX' | 'UGX'
  phoneNumber: string
  provider: 'MTN' | 'AIRTEL'
  description: string
  externalId?: string
}

interface IotecPaymentResult {
  success: boolean
  transactionId?: string
  externalId?: string
  status?: string
  error?: string
}

interface IotecCollectionResponse {
  id: string
  status: 'Pending' | 'SentToVendor' | 'Success' | 'Failed' | 'AwaitingApproval' | 'RolledBack'
  statusCode: string
  statusMessage?: string
  externalId?: string
  amount: number
  currency: 'ITX' | 'UGX'
  payer: string
  createdAt: string
}

// Cache for access token
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get OAuth 2.0 access token from Iotec
 */
async function getIotecAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.IOTEC_CLIENT_ID
    const clientSecret = process.env.IOTEC_CLIENT_SECRET
    const authUrl = process.env.IOTEC_AUTH_URL || 'https://id.iotec.io'

    if (!clientId || !clientSecret) {
      console.warn('Iotec credentials not configured. Using mock payment.')
      return null
    }

    // Check if we have a valid cached token
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
      // Token is still valid (with 1 minute buffer)
      return cachedToken.token
    }

    // Request new token
    const response = await fetch(`${authUrl}/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`)
    }

    const data: IotecAccessToken = await response.json()

    // Cache the token (expires_in is in seconds)
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    }

    return data.access_token
  } catch (error: any) {
    console.error('Error getting Iotec access token:', error)
    return null
  }
}

/**
 * Normalize phone number to MSISDN format (256XXXXXXXXX or 0XXXXXXXXX)
 */
function normalizePhoneNumber(phone: string): string {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // If starts with 256, return as is
  if (cleaned.startsWith('256')) {
    return cleaned
  }
  
  // If starts with 0, return as is
  if (cleaned.startsWith('0')) {
    return cleaned
  }
  
  // Otherwise, assume it's missing the country code or leading 0
  // For Uganda, add 256 if it's 9 digits, or 0 if it's 9 digits
  if (cleaned.length === 9) {
    return `256${cleaned}`
  }
  
  return cleaned
}

/**
 * Determine payment category based on provider
 */
function getPaymentCategory(provider: 'MTN' | 'AIRTEL'): 'MobileMoney' {
  return 'MobileMoney'
}

export async function processIotecPayment(
  amount: number,
  phoneNumber: string,
  provider: 'MTN' | 'AIRTEL',
  currency: 'ITX' | 'UGX' = 'UGX',
  description: string = 'Vendor Subscription',
  externalId?: string
): Promise<IotecPaymentResult> {
  try {
    const clientId = process.env.IOTEC_CLIENT_ID
    const clientSecret = process.env.IOTEC_CLIENT_SECRET
    const walletId = process.env.IOTEC_WALLET_ID
    const baseUrl = process.env.IOTEC_BASE_URL || 'https://pay.iotec.io'

    if (!clientId || !clientSecret || !walletId) {
      console.warn('Iotec credentials not configured. Using mock payment.')
      // Return mock transaction for development
      return {
        success: true,
        transactionId: `IOTEC_${provider}_MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        externalId: externalId || `EXT_${Date.now()}`,
        status: 'Pending'
      }
    }

    // Validate minimum amount (500 according to API docs)
    if (amount < 500) {
      return {
        success: false,
        error: 'Amount must be at least 500'
      }
    }

    // Get access token
    const accessToken = await getIotecAccessToken()
    if (!accessToken) {
      return {
        success: false,
        error: 'Failed to authenticate with Iotec'
      }
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber)

    // Generate external ID if not provided
    const transactionExternalId = externalId || `gocart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Prepare collection request
    const collectionRequest = {
      category: getPaymentCategory(provider),
      currency: currency,
      walletId: walletId,
      externalId: transactionExternalId,
      payer: normalizedPhone,
      payerNote: description.substring(0, 100), // Max 100 chars
      amount: amount,
      payeeNote: `Vendor subscription payment - ${provider}`,
      channel: 'Api',
      transactionChargesCategory: 'ChargeCustomer' as const
    }

    // Make collection request
    const response = await fetch(`${baseUrl}/api/collections/collect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(collectionRequest),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }))
      return {
        success: false,
        error: errorData.message || `Iotec API error: ${response.status} ${response.statusText}`
      }
    }

    const data: IotecCollectionResponse = await response.json()

    return {
      success: true,
      transactionId: data.id,
      externalId: data.externalId || transactionExternalId,
      status: data.status
    }
  } catch (error: any) {
    console.error('Iotec payment error:', error)
    return {
      success: false,
      error: error.message || 'Iotec payment processing failed'
    }
  }
}

export async function verifyIotecPayment(transactionId: string): Promise<{ verified: boolean; status?: string; error?: string }> {
  try {
    const clientId = process.env.IOTEC_CLIENT_ID
    const clientSecret = process.env.IOTEC_CLIENT_SECRET
    const baseUrl = process.env.IOTEC_BASE_URL || 'https://pay.iotec.io'

    if (!clientId || !clientSecret) {
      console.warn('Iotec credentials not configured. Skipping verification.')
      return { verified: true } // Allow in development
    }

    // Get access token
    const accessToken = await getIotecAccessToken()
    if (!accessToken) {
      return {
        verified: false,
        error: 'Failed to authenticate with Iotec'
      }
    }

    // Check transaction status
    const response = await fetch(`${baseUrl}/api/collections/status/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return {
        verified: false,
        error: `Failed to verify transaction: ${response.status}`
      }
    }

    const data: IotecCollectionResponse = await response.json()

    return {
      verified: data.status === 'Success',
      status: data.status
    }
  } catch (error: any) {
    console.error('Iotec verification error:', error)
    return {
      verified: false,
      error: error.message || 'Verification failed'
    }
  }
}

/**
 * Check transaction status by external ID
 */
export async function checkIotecPaymentByExternalId(externalId: string): Promise<{ verified: boolean; status?: string; transactionId?: string; error?: string }> {
  try {
    const clientId = process.env.IOTEC_CLIENT_ID
    const clientSecret = process.env.IOTEC_CLIENT_SECRET
    const baseUrl = process.env.IOTEC_BASE_URL || 'https://pay.iotec.io'

    if (!clientId || !clientSecret) {
      console.warn('Iotec credentials not configured. Skipping verification.')
      return { verified: true } // Allow in development
    }

    // Get access token
    const accessToken = await getIotecAccessToken()
    if (!accessToken) {
      return {
        verified: false,
        error: 'Failed to authenticate with Iotec'
      }
    }

    // Check transaction status by external ID
    const response = await fetch(`${baseUrl}/api/collections/external-id/${externalId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return {
        verified: false,
        error: `Failed to verify transaction: ${response.status}`
      }
    }

    const data: IotecCollectionResponse = await response.json()

    return {
      verified: data.status === 'Success',
      status: data.status,
      transactionId: data.id
    }
  } catch (error: any) {
    console.error('Iotec verification error:', error)
    return {
      verified: false,
      error: error.message || 'Verification failed'
    }
  }
}

/**
 * Poll transaction status until it's confirmed or failed
 * @param transactionId - The transaction ID to poll
 * @param maxAttempts - Maximum number of polling attempts (default: 60)
 * @param intervalMs - Interval between polls in milliseconds (default: 2000 = 2 seconds)
 * @returns Promise with final status
 */
export async function pollIotecPaymentStatus(
  transactionId: string,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<{ status: string; verified: boolean; error?: string }> {
  try {
    const clientId = process.env.IOTEC_CLIENT_ID
    const clientSecret = process.env.IOTEC_CLIENT_SECRET
    const baseUrl = process.env.IOTEC_BASE_URL || 'https://pay.iotec.io'

    if (!clientId || !clientSecret) {
      console.warn('Iotec credentials not configured. Using mock verification.')
      // In development, simulate success after a short delay
      await new Promise(resolve => setTimeout(resolve, 3000))
      return { status: 'Success', verified: true }
    }

    // Get access token
    const accessToken = await getIotecAccessToken()
    if (!accessToken) {
      return {
        status: 'Failed',
        verified: false,
        error: 'Failed to authenticate with Iotec'
      }
    }

    // Poll for status
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`${baseUrl}/api/collections/status/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        return {
          status: 'Failed',
          verified: false,
          error: `Failed to check transaction status: ${response.status}`
        }
      }

      const data: IotecCollectionResponse = await response.json()

      // Check if transaction is in final state
      if (data.status === 'Success') {
        return {
          status: data.status,
          verified: true
        }
      }

      if (data.status === 'Failed' || data.status === 'RolledBack') {
        return {
          status: data.status,
          verified: false,
          error: data.statusMessage || 'Payment failed'
        }
      }

      // If still pending, wait and try again
      if (data.status === 'Pending' || data.status === 'SentToVendor' || data.status === 'AwaitingApproval') {
        await new Promise(resolve => setTimeout(resolve, intervalMs))
        continue
      }

      // Unknown status, return as is
      return {
        status: data.status,
        verified: false,
        error: data.statusMessage || 'Unknown payment status'
      }
    }

    // Timeout - max attempts reached
    return {
      status: 'Pending',
      verified: false,
      error: 'Payment confirmation timeout. Please check your phone and try again.'
    }
  } catch (error: any) {
    console.error('Iotec polling error:', error)
    return {
      status: 'Failed',
      verified: false,
      error: error.message || 'Failed to poll payment status'
    }
  }
}

