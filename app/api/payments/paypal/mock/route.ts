import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

/**
 * Mock PayPal payment page for development/testing
 * In production, this would be handled by PayPal's actual payment page
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    const searchParams = request.nextUrl.searchParams
    const amount = searchParams.get('amount')
    const currency = searchParams.get('currency') || 'USD'
    const orderId = searchParams.get('orderId')
    const formData = searchParams.get('formData')
    const orderData = searchParams.get('orderData')
    const callback = searchParams.get('callback') // For checkout callback

    // Simple HTML page to simulate PayPal approval
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PayPal Payment - Mock</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #003087; }
            .info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
            }
            .button {
              background: #0070ba;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
              margin: 10px 5px;
            }
            .button:hover { background: #005ea6; }
            .button.cancel {
              background: #6c757d;
            }
            .button.cancel:hover { background: #5a6268; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>PayPal Payment (Mock)</h1>
            <div class="info">
              <p><strong>Amount:</strong> ${currency} ${amount}</p>
              <p><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
              <p><em>This is a mock payment page for development.</em></p>
            </div>
            <p>Click "Approve Payment" to simulate a successful PayPal payment.</p>
            <div>
              <button class="button" onclick="approvePayment()">Approve Payment</button>
              <button class="button cancel" onclick="cancelPayment()">Cancel</button>
            </div>
          </div>
          <script>
            function approvePayment() {
              const callbackUrl = '${callback || '/api/payments/paypal/callback'}';
              const url = new URL(callbackUrl, window.location.origin);
              url.searchParams.set('success', 'true');
              url.searchParams.set('orderId', '${orderId || `MOCK_${Date.now()}`}');
              ${formData ? `url.searchParams.set('formData', '${formData}');` : ''}
              ${orderData ? `url.searchParams.set('orderData', '${orderData}');` : ''}
              window.location.href = url.toString();
            }
            function cancelPayment() {
              const callbackUrl = '${callback || '/api/payments/paypal/callback'}';
              const url = new URL(callbackUrl, window.location.origin);
              url.searchParams.set('success', 'false');
              window.location.href = url.toString();
            }
          </script>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error: any) {
    console.error('Error in mock PayPal page:', error)
    return new NextResponse('Error loading payment page', { status: 500 })
  }
}

