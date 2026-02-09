import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

/**
 * DealMaker Webhook Handler
 * 
 * This endpoint receives webhook events from DealMaker when investor
 * data changes. Configure this URL in your DealMaker Integrations settings.
 * 
 * Webhook URL: https://yourdomain.com/api/dealmaker/webhook
 */

// Your webhook secret from DealMaker (optional but recommended)
const WEBHOOK_SECRET = process.env.DEALMAKER_WEBHOOK_SECRET || ""

// Webhook event types
type WebhookEvent = 
  | "investor.create"
  | "investor.update"
  | "investor.signed"
  | "investor.funded"
  | "investor.accepted"
  | "investor.delete"

interface WebhookPayload {
  event: WebhookEvent
  event_id: string
  deal?: {
    id: number
    title: string
    state: string
    currency: string
    security_type: string
    price_per_security: number
  }
  investor: {
    id: number
    full_name: string
    first_name: string
    last_name: string
    email: string
    state: string
    investment_amount: number
    allocated_amount: number
    number_of_securities: number
    funding_state: string
    phone_number?: string
    created_at: string
    updated_at: string
  }
}

/**
 * Verify the webhook signature (if secret is configured)
 */
function verifySignature(payload: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) {
    // Skip verification if no secret is configured
    return true
  }
  
  const expectedSignature = crypto
    .createHmac("sha1", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex")
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("X-DealMaker-Signature")
    const rawBody = await request.text()
    
    // Verify signature
    if (!verifySignature(rawBody, signature)) {
      console.error("[DealMaker Webhook] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
    
    const payload: WebhookPayload = JSON.parse(rawBody)
    
    console.log(`[DealMaker Webhook] Received event: ${payload.event}`, {
      event_id: payload.event_id,
      investor_id: payload.investor.id,
      investor_state: payload.investor.state,
    })
    
    // Handle different event types
    switch (payload.event) {
      case "investor.create":
        await handleInvestorCreate(payload)
        break
        
      case "investor.update":
        await handleInvestorUpdate(payload)
        break
        
      case "investor.signed":
        await handleInvestorSigned(payload)
        break
        
      case "investor.funded":
        await handleInvestorFunded(payload)
        break
        
      case "investor.accepted":
        await handleInvestorAccepted(payload)
        break
        
      case "investor.delete":
        await handleInvestorDelete(payload)
        break
        
      default:
        console.log(`[DealMaker Webhook] Unknown event type: ${payload.event}`)
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[DealMaker Webhook] Error processing webhook:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Handle investor.create event
 */
async function handleInvestorCreate(payload: WebhookPayload) {
  console.log(`[DealMaker] New investor created: ${payload.investor.email}`)
  
  // TODO: Add your business logic here
  // Examples:
  // - Send a welcome email
  // - Update your CRM
  // - Track analytics
}

/**
 * Handle investor.update event
 */
async function handleInvestorUpdate(payload: WebhookPayload) {
  console.log(`[DealMaker] Investor updated: ${payload.investor.email}`, {
    state: payload.investor.state,
    funding_state: payload.investor.funding_state,
  })
  
  // TODO: Add your business logic here
  // Examples:
  // - Sync investor data to your database
  // - Update UI in real-time via websockets
}

/**
 * Handle investor.signed event
 */
async function handleInvestorSigned(payload: WebhookPayload) {
  console.log(`[DealMaker] Investor signed: ${payload.investor.email}`)
  
  // TODO: Add your business logic here
  // Examples:
  // - Send confirmation email
  // - Trigger post-signing workflow
}

/**
 * Handle investor.funded event
 */
async function handleInvestorFunded(payload: WebhookPayload) {
  console.log(`[DealMaker] Investor funded: ${payload.investor.email}`, {
    amount: payload.investor.investment_amount,
  })
  
  // TODO: Add your business logic here
  // Examples:
  // - Send payment confirmation
  // - Update investment totals
  // - Trigger fulfillment process
}

/**
 * Handle investor.accepted event
 */
async function handleInvestorAccepted(payload: WebhookPayload) {
  console.log(`[DealMaker] Investor accepted: ${payload.investor.email}`)
  
  // TODO: Add your business logic here
  // Examples:
  // - Send welcome to shareholders email
  // - Issue stock certificates
  // - Add to shareholder communications list
}

/**
 * Handle investor.delete event
 */
async function handleInvestorDelete(payload: WebhookPayload) {
  console.log(`[DealMaker] Investor deleted: ${payload.investor.email}`)
  
  // TODO: Add your business logic here
  // Examples:
  // - Remove from mailing lists
  // - Update analytics
}
