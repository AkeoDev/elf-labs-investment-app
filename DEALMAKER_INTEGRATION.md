# Elf Labs Investment Form - DealMaker Integration Package

This package contains all the files needed to integrate the custom Elf Labs investment form with your website and DealMaker's API.

---

## Quick Start Checklist

- [ ] Copy all files to your Next.js project
- [ ] Install dependency: `npm install swr`
- [ ] Add environment variables (see below)
- [ ] Update `lib/dealmaker.ts` with your deal settings
- [ ] Configure webhooks in DealMaker dashboard

---

## Package Contents

| File | Purpose |
|------|---------|
| `lib/dealmaker.ts` | DealMaker API client, OAuth, share calculations |
| `hooks/use-dealmaker.ts` | React hook for easy component integration |
| `app/api/dealmaker/investors/route.ts` | API route to create investors |
| `app/api/dealmaker/webhook/route.ts` | Webhook handler for investor events |
| `components/investment-amount.tsx` | Tier selector with gold bonus badges |
| `components/investment-flow.tsx` | Main accordion-style investment flow |
| `components/initial-form.tsx` | Email/name/phone signup form |
| `components/accordion-section.tsx` | Collapsible section component |
| `components/contact-information.tsx` | Contact info step |
| `components/investor-perks.tsx` | Bonus perks info panel |
| `components/additional-info.tsx` | Legal disclaimers |

---

## Setup

### 1. Create a DealMaker API Application

1. Log in to [DealMaker](https://app.dealmaker.tech)
2. Click your username in the top right → **Integrations**
3. Under API settings, click **Create New Application**
4. Name your application and set permissions:
   - `deals:read` - Read deal information
   - `deals:write` - Modify deal settings
   - `investors:read` - Read investor data
   - `investors:write` - Create/update investors
5. Save your **Client ID** and **Client Secret** (the secret won't be shown again!)

### 2. Configure Environment Variables

Add these to your `.env.local` or Vercel environment variables:

```env
# DealMaker OAuth Credentials
DEALMAKER_CLIENT_ID=your_client_id_here
DEALMAKER_CLIENT_SECRET=your_client_secret_here

# Your Deal ID (from the URL when viewing your deal)
DEALMAKER_DEAL_ID=your_deal_id_here

# Webhook secret (optional but recommended)
DEALMAKER_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Configure Webhooks (Optional but Recommended)

1. In DealMaker, go to **Integrations** → **Webhooks**
2. Add your webhook URL: `https://yourdomain.com/api/dealmaker/webhook`
3. Select the deal(s) to monitor
4. Optionally add a security token (saves as `DEALMAKER_WEBHOOK_SECRET`)
5. Select events to receive:
   - `investor.create`
   - `investor.update`
   - `investor.signed`
   - `investor.funded`
   - `investor.accepted`

## Usage

### Basic Flow

```tsx
import { useDealMaker } from "@/hooks/use-dealmaker"

function InvestmentForm() {
  const { createInvestor, isLoading, error, calculate, config } = useDealMaker()
  
  const handleSubmit = async (formData) => {
    const result = await createInvestor({
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      investmentAmount: formData.amount,
    })
    
    if (result?.investor.accessLink) {
      // Redirect to DealMaker to complete the investment
      window.location.href = result.investor.accessLink
    }
  }
  
  // Calculate shares for display
  const { baseShares, bonusShares, totalShares } = calculate(5000)
  
  return (
    <div>
      <p>Share Price: ${config.sharePrice}</p>
      <p>Base Shares: {baseShares}</p>
      <p>Bonus Shares: {bonusShares}</p>
      <p>Total: {totalShares}</p>
      {/* Your form here */}
    </div>
  )
}
```

### Server-Side Usage

```ts
import { createInvestor, calculateInvestment } from "@/lib/dealmaker"

// In a Server Action or API route
const investor = await createInvestor({
  email: "investor@example.com",
  first_name: "John",
  last_name: "Doe",
  phone_number: "+1234567890",
  investment_amount: 10000,
})

console.log("Created investor:", investor.id)
```

## Configuration

Edit `lib/dealmaker.ts` to match your deal settings:

```ts
export const DEALMAKER_CONFIG = {
  // Your deal-specific settings
  sharePrice: 2.25,        // Match your DealMaker deal
  minInvestment: 974.25,   // Match your DealMaker deal
  currency: "USD",
  securityType: "Common Stock",
  
  // Bonus tiers (match your DealMaker incentive plan)
  bonusTiers: [
    { minAmount: 2500, bonusPercent: 5 },
    { minAmount: 5000, bonusPercent: 10 },
    { minAmount: 10000, bonusPercent: 15 },
    { minAmount: 25000, bonusPercent: 20 },
    { minAmount: 100000, bonusPercent: 20 },
  ],
}
```

## Investor Flow

1. User fills out your custom form (email, name, phone, investment amount)
2. Your UI calls `/api/dealmaker/investors` to create the investor
3. DealMaker returns an `access_link`
4. Redirect user to the access link to complete:
   - Questionnaire
   - Subscription agreement signing
   - Payment

## Webhook Events

Handle investor lifecycle events in `app/api/dealmaker/webhook/route.ts`:

| Event | Description |
|-------|-------------|
| `investor.create` | New investor added |
| `investor.update` | Investor data changed |
| `investor.signed` | Agreement signed |
| `investor.funded` | Payment received |
| `investor.accepted` | Investment countersigned |
| `investor.delete` | Investor removed |

## Embed Option

Alternatively, you can embed DealMaker's native checkout directly:

```html
<div id="deal-flow" style="height: 700px; width: 100%">
  <script
    data-element="#deal-flow"
    data-hosted="false"
    src="https://app.dealmaker.tech/deals/YOUR_DEAL_ID/embed"
  ></script>
</div>
```

Set `data-hosted="true"` to redirect to DealMaker's site instead of embedding.

## API Reference

See the full DealMaker API documentation: https://docs.dealmaker.tech/

---

## File Structure to Copy

```
your-nextjs-project/
├── lib/
│   └── dealmaker.ts
├── hooks/
│   └── use-dealmaker.ts
├── app/
│   ├── page.tsx                    # Main investment page
│   ├── globals.css                 # Styles (includes dark theme)
│   └── api/
│       └── dealmaker/
│           ├── investors/
│           │   └── route.ts
│           └── webhook/
│               └── route.ts
└── components/
    ├── initial-form.tsx
    ├── investment-flow.tsx
    ├── investment-amount.tsx
    ├── accordion-section.tsx
    ├── contact-information.tsx
    ├── investor-perks.tsx
    └── additional-info.tsx
```

---

## Styling Requirements

The components use **Tailwind CSS**. Key colors used:

```css
/* Gold badges */
#c9a227

/* Pink accents & buttons */
#e91e8c

/* Dark backgrounds */
#0d0f1a (page bg)
#0f1629 (card bg)
#1a2744 (selected/highlight)
```

Make sure your Tailwind config supports these colors or they're used as arbitrary values `bg-[#c9a227]`.

---

## Security Checklist

- [ ] Environment variables set in hosting platform (never hardcoded)
- [ ] HTTPS enabled in production
- [ ] Client secret never exposed to browser/client-side code
- [ ] Webhook signature validation enabled (optional but recommended)

---

## Support

- DealMaker Help Center: https://help.dealmaker.tech
- API Documentation: https://docs.dealmaker.tech
