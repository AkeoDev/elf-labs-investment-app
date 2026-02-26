# Elf Labs Investment Form - Complete Setup Guide

This guide will walk you through everything from the moment you receive the project files to having the investment form live on your Webflow site. Even if you haven't worked with code before, you should be able to follow along.

---

## What You're Working With

When you download or receive the project package, you'll get a folder containing a Next.js application. This is a self-contained web app that handles the entire investment flow - from collecting investor information to connecting with DealMaker's system.

The key things to know:
- The form runs as its own mini-website that you'll host separately
- It connects to DealMaker using API credentials you'll provide
- Once hosted, you embed it into your Webflow site (similar to embedding a YouTube video)

---

## Part 1: Opening and Understanding the Project

### First Steps After Download

1. **Unzip the package** if it came as a ZIP file. You'll see a folder structure that looks something like this:

```
elf-investment-form/
├── app/                    (the pages and API routes)
├── components/             (all the UI pieces)
├── lib/                    (configuration and utilities)
├── hooks/                  (helper code for the form)
├── package.json            (project dependencies)
└── ... other config files
```

2. **Don't worry about most of these files.** The only ones you might need to touch are:
   - `lib/dealmaker.ts` - where you can adjust share price, minimum investment, and bonus tiers
   - Environment variables (we'll cover this in deployment)

### If You Want to Preview Locally (Optional)

This step is optional but helpful if you want to see the form before deploying. You'll need Node.js installed on your computer.

1. Open Terminal (Mac) or Command Prompt (Windows)
2. Navigate to the project folder:
   ```
   cd path/to/elf-investment-form
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open your browser to `http://localhost:3000`

You'll see the form, though it won't actually process investments until you add your API credentials.

---

## Part 2: Getting Your DealMaker API Credentials

Before the form can create real investors, you need to connect it to your DealMaker account. This requires three pieces of information.

### Finding Your Client ID and Client Secret

1. Log into your DealMaker dashboard at `app.dealmaker.tech`
2. Look for **Integrations** in the left sidebar and click it
3. Select **API Applications**
4. If you already have an application listed, click on it to view the credentials. If not:
   - Click **Create New Application**
   - Give it a name like "Elf Labs Website Form"
   - Click Create
5. You'll now see two values:
   - **Client ID** - a long string of letters and numbers
   - **Client Secret** - another long string (treat this like a password)

Write these down or copy them somewhere safe. You'll need them shortly.

### Finding Your Deal ID

1. Still in DealMaker, go to **Deals** in the sidebar
2. Click on the specific deal you want investors to flow into
3. Look at the URL in your browser - it will look like:
   ```
   https://app.dealmaker.tech/deals/12345/overview
   ```
4. The number in the middle (`12345` in this example) is your **Deal ID**

### A Note on Security

Your Client Secret is sensitive - anyone with it could potentially access your DealMaker account through the API. Here's how to keep it safe:

- Never put these credentials directly in the code files
- Never share them over email or chat if you can avoid it
- Only enter them into secure places like Vercel's environment variables (covered next)
- If you ever think they've been compromised, generate new ones in DealMaker immediately

---

## Part 3: Deploying the Project

The investment form needs to live on the internet before you can embed it in Webflow. We recommend Vercel because it's free, fast, and designed for exactly this type of project.

### Setting Up Vercel (First Time Only)

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** and choose to sign up with GitHub
   - If you don't have a GitHub account, create one at [github.com](https://github.com) first
   - This is free and takes about 2 minutes
3. Authorize Vercel to access your GitHub account when prompted

### Uploading Your Project to GitHub

Your project needs to be on GitHub so Vercel can access it.

1. Go to [github.com](https://github.com) and log in
2. Click the **+** icon in the top right, then **New repository**
3. Name it something like `elf-investment-form`
4. Keep it set to **Private** (recommended for security)
5. Click **Create repository**
6. You'll see instructions for uploading files. The easiest method:
   - Download [GitHub Desktop](https://desktop.github.com/) if you haven't
   - Clone your new empty repository
   - Copy all the project files into that folder
   - In GitHub Desktop, you'll see all the new files listed
   - Write a commit message like "Initial upload" and click **Commit to main**
   - Click **Push origin** to upload everything

### Deploying to Vercel

1. Go back to [vercel.com](https://vercel.com) and click **Add New Project**
2. You should see your GitHub repository listed - click **Import** next to it
3. Before clicking Deploy, click on **Environment Variables** to expand that section
4. Add your three credentials:

   | Name (copy exactly) | Value |
   |---------------------|-------|
   | `DEALMAKER_CLIENT_ID` | Paste your Client ID |
   | `DEALMAKER_CLIENT_SECRET` | Paste your Client Secret |
   | `DEALMAKER_DEAL_ID` | Paste your Deal ID |

5. Click **Deploy**

Vercel will take about 1-2 minutes to build and deploy your project. When it's done, you'll see a success screen with a URL like:
```
https://elf-investment-form.vercel.app
```

Click that URL to see your live investment form. Save this URL - you'll need it for the Webflow embed.

### Verifying It Works

1. Visit your new Vercel URL
2. Fill out the initial form with test information
3. Go through the investment flow
4. Check your DealMaker dashboard - you should see a new investor appear

If the investor shows up in DealMaker, everything is connected properly.

---

## Part 4: Embedding in Webflow

Now for the final step - getting the form onto your actual website.

### Option A: Simple Iframe Embed (Recommended)

This is the most straightforward approach and works reliably.

1. Open your Webflow project and go to the page where you want the investment form
2. In the left panel, find **Components** (or press `A` to open Add Elements)
3. Drag an **Embed** element onto your page where you want the form
4. Double-click the Embed element to open the code editor
5. Paste this code:

```html
<iframe 
  src="https://YOUR-VERCEL-URL.vercel.app" 
  width="100%" 
  height="1000" 
  frameborder="0"
  style="border: none; border-radius: 12px; max-width: 800px; margin: 0 auto; display: block;"
></iframe>
```

6. Replace `YOUR-VERCEL-URL` with your actual Vercel URL
7. Click **Save & Close**
8. Publish your Webflow site to see it live

**Adjusting the height:** The form is fairly tall, especially when all accordion sections are open. Start with `height="1000"` and adjust up or down based on how it looks. Typical values range from 900 to 1200.

### Option B: Responsive Iframe (Better for Mobile)

If Option A looks awkward on mobile devices, try this responsive version:

```html
<div style="position: relative; width: 100%; max-width: 800px; margin: 0 auto;">
  <iframe 
    src="https://YOUR-VERCEL-URL.vercel.app" 
    style="width: 100%; height: 100vh; min-height: 900px; max-height: 1200px; border: none; border-radius: 12px;"
  ></iframe>
</div>
```

This version adapts to the screen height while staying within reasonable bounds.

### Option C: Full-Page Embed

If you want the investment form to be its own dedicated page without any Webflow elements around it:

1. Create a new page in Webflow (e.g., `/invest`)
2. Remove all default sections so the page is empty
3. Add an Embed element
4. Use this code:

```html
<iframe 
  src="https://YOUR-VERCEL-URL.vercel.app" 
  style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; border: none;"
></iframe>
```

This makes the form take over the entire page.

### Option D: Custom Domain (Professional Touch)

Instead of showing `elf-investment-form.vercel.app` in the embed, you can use your own subdomain like `invest.elflabs.com`.

1. In Vercel, go to your project's **Settings** tab
2. Click **Domains** in the sidebar
3. Click **Add** and enter your desired subdomain (e.g., `invest.elflabs.com`)
4. Vercel will show you DNS records to add
5. Go to your domain registrar (wherever you bought your domain) and add those DNS records
6. Wait 5-30 minutes for DNS to propagate
7. Update your Webflow embed to use the new domain

---

## Troubleshooting Common Issues

**The form appears but looks squished or cut off**
- Increase the `height` value in your iframe code
- Make sure the Webflow container isn't restricting the width

**The form shows a blank white or gray screen**
- Visit your Vercel URL directly to make sure the deployment is working
- Check that you're using `https://` not `http://` in the iframe src

**Investments aren't appearing in DealMaker**
- Go to Vercel → Your Project → Settings → Environment Variables
- Verify all three variables are present and spelled exactly right (they're case-sensitive)
- Make sure there are no extra spaces before or after the values
- After any changes, you need to redeploy (Vercel → Deployments → click the three dots on the latest → Redeploy)

**Getting a CORS error in the browser console**
- This usually means the API routes didn't deploy correctly
- Try redeploying the project in Vercel
- Make sure the `app/api` folder structure is intact in your GitHub repository

**The iframe has a white border or doesn't match the site**
- Add `border: none;` to the iframe style
- The form has a dark background by default - if your site is light, this contrast is intentional
- You can wrap the iframe in a div with a dark background if you want seamless edges

**Mobile layout looks off**
- Use Option B (responsive iframe) instead of Option A
- Check that your Webflow container allows full width on mobile
- The form itself is responsive and should adapt, but the iframe container needs room

---

## Making Changes Later

### Updating Share Price or Bonus Tiers

If you need to change the financial details:

1. Open the project in your code editor (or edit directly on GitHub)
2. Navigate to `lib/dealmaker.ts`
3. Find these values near the top of the file:

```typescript
export const SHARE_PRICE = 2.25
export const MIN_INVESTMENT = 974.25

export const BONUS_TIERS = [
  { amount: 2500, bonusPercent: 5 },
  { amount: 5000, bonusPercent: 10 },
  // ... etc
]
```

4. Change the numbers as needed
5. Commit and push to GitHub
6. Vercel will automatically redeploy with the new values (takes about 1-2 minutes)

### Updating API Credentials

If you need to rotate your DealMaker credentials:

1. Generate new credentials in DealMaker
2. Go to Vercel → Your Project → Settings → Environment Variables
3. Update the values
4. Go to Deployments and redeploy the latest deployment

---

## Quick Reference

| What | Where |
|------|-------|
| DealMaker credentials | DealMaker → Integrations → API Applications |
| Deal ID | DealMaker → Deals → (your deal) → look at URL |
| Environment variables | Vercel → Your Project → Settings → Environment Variables |
| Pricing configuration | `lib/dealmaker.ts` in your codebase |
| Deployment logs | Vercel → Your Project → Deployments |

---

## Need Help?

If you run into issues not covered here, check:
- DealMaker's documentation: https://docs.dealmaker.tech
- DealMaker's help center: https://help.dealmaker.tech
- Vercel's documentation: https://vercel.com/docs
- Webflow's embed guide: https://university.webflow.com/lesson/custom-code-embed

Or reach out to your development contact for assistance.
