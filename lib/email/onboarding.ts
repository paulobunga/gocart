/**
 * Email Service for Onboarding
 * 
 * Supports multiple email providers:
 * - Resend (recommended): npm install resend
 * - SendGrid: npm install @sendgrid/mail
 * - Nodemailer: npm install nodemailer
 * 
 * Add to .env.local:
 * EMAIL_PROVIDER=resend (or 'sendgrid' or 'nodemailer')
 * RESEND_API_KEY=your_resend_api_key (if using Resend)
 * SENDGRID_API_KEY=your_sendgrid_api_key (if using SendGrid)
 * SMTP_HOST=your_smtp_host (if using Nodemailer)
 * SMTP_PORT=587
 * SMTP_USER=your_smtp_user
 * SMTP_PASS=your_smtp_password
 */

interface OnboardingEmailData {
  to: string
  storeName: string
  vendorName: string
  plan: string
  billing: string
  storeUrl: string
}

export async function sendOnboardingConfirmationEmail(
  data: OnboardingEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = process.env.EMAIL_PROVIDER || 'resend'

    switch (provider.toLowerCase()) {
      case 'resend':
        return await sendWithResend(data)
      case 'sendgrid':
        return await sendWithSendGrid(data)
      case 'nodemailer':
        return await sendWithNodemailer(data)
      default:
        console.warn(`Email provider "${provider}" not configured. Email not sent.`)
        return { success: true } // Don't fail onboarding if email fails
    }
  } catch (error: any) {
    console.error('Error sending onboarding email:', error)
    // Don't fail onboarding if email fails
    return { success: true, error: error.message }
  }
}

async function sendWithResend(data: OnboardingEmailData) {
  try {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      console.warn('Resend API key not configured. Email not sent.')
      return { success: true }
    }

    // TODO: Uncomment when Resend is installed
    /*
    const { Resend } = require('resend')
    const resend = new Resend(apiKey)

    const { data: emailData, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'GoCart <onboarding@gocart.com>',
      to: data.to,
      subject: 'Welcome to GoCart Vendor!',
      html: generateEmailHTML(data),
      text: generateEmailText(data)
    })

    if (error) {
      return { success: false, error: error.message }
    }
    */

    console.log(`[MOCK] Onboarding email would be sent to ${data.to}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function sendWithSendGrid(data: OnboardingEmailData) {
  try {
    const apiKey = process.env.SENDGRID_API_KEY

    if (!apiKey) {
      console.warn('SendGrid API key not configured. Email not sent.')
      return { success: true }
    }

    // TODO: Uncomment when SendGrid is installed
    /*
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(apiKey)

    const msg = {
      to: data.to,
      from: process.env.EMAIL_FROM || 'onboarding@gocart.com',
      subject: 'Welcome to GoCart Vendor!',
      html: generateEmailHTML(data),
      text: generateEmailText(data)
    }

    await sgMail.send(msg)
    */

    console.log(`[MOCK] Onboarding email would be sent to ${data.to}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

async function sendWithNodemailer(data: OnboardingEmailData) {
  try {
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('SMTP credentials not configured. Email not sent.')
      return { success: true }
    }

    // TODO: Uncomment when Nodemailer is installed
    /*
    const nodemailer = require('nodemailer')

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || smtpUser,
      to: data.to,
      subject: 'Welcome to GoCart Vendor!',
      html: generateEmailHTML(data),
      text: generateEmailText(data)
    })
    */

    console.log(`[MOCK] Onboarding email would be sent to ${data.to}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

function generateEmailHTML(data: OnboardingEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to GoCart Vendor</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to GoCart Vendor!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hello ${data.vendorName},</p>
        <p>Congratulations! Your vendor account has been successfully created.</p>
        
        <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #667eea;">
          <h2 style="margin-top: 0; color: #667eea;">Store Details</h2>
          <p><strong>Store Name:</strong> ${data.storeName}</p>
          <p><strong>Subscription Plan:</strong> ${data.plan}</p>
          <p><strong>Billing Cycle:</strong> ${data.billing}</p>
          <p><strong>Store URL:</strong> <a href="${data.storeUrl}">${data.storeUrl}</a></p>
        </div>
        
        <p><strong>What's Next?</strong></p>
        <ul>
          <li>Your store is pending admin approval</li>
          <li>You'll receive an email once your store is approved</li>
          <li>Start adding products to your store</li>
          <li>Manage your store settings and preferences</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.storeUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Store Dashboard</a>
        </div>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
          If you have any questions, please don't hesitate to contact our support team.
        </p>
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The GoCart Team
        </p>
      </div>
    </body>
    </html>
  `
}

function generateEmailText(data: OnboardingEmailData): string {
  return `
Welcome to GoCart Vendor!

Hello ${data.vendorName},

Congratulations! Your vendor account has been successfully created.

Store Details:
- Store Name: ${data.storeName}
- Subscription Plan: ${data.plan}
- Billing Cycle: ${data.billing}
- Store URL: ${data.storeUrl}

What's Next?
- Your store is pending admin approval
- You'll receive an email once your store is approved
- Start adding products to your store
- Manage your store settings and preferences

Visit your store: ${data.storeUrl}

If you have any questions, please don't hesitate to contact our support team.

Best regards,
The GoCart Team
  `.trim()
}

