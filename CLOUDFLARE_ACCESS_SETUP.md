# Cloudflare Access Setup Guide

## Problem
Your app is stuck in a login loop because Cloudflare Access is not configured. The app expects JWT tokens from Cloudflare Access but they're never being created.

## Your Configuration
- **Domain**: `artifacts.jbcloud.app`
- **Account ID**: `e2613c1c17024c32ab14618614e2b309`
- **Dashboard**: https://one.dash.cloudflare.com/

---

## Setup Steps

### 1. Go to Cloudflare Zero Trust Dashboard

Visit: **https://one.dash.cloudflare.com/**

Log in with your Cloudflare account.

### 2. Navigate to Access Applications

In the left sidebar:
1. Click **Access**
2. Click **Applications**
3. Click **Add an Application** button

### 3. Select Application Type

Choose: **Self-hosted**

### 4. Configure Application Settings

Fill in the following:

**Application Configuration:**
- **Application name**: `Artifact Manager`
- **Session Duration**: `24 hours` (recommended)
- **Application domain**:
  - Add: `artifacts.jbcloud.app`
  - Path: Leave blank (protects entire domain)

**Optional Settings:**
- **Enable automatic cloudflared authentication**: Leave unchecked
- **Browser rendering**: `Render page in browser`

Click **Next**

### 5. Add Authentication Policy

You need at least one policy to allow access. Common options:

#### Option A: Allow Specific Email Addresses
- **Policy name**: `Allow My Email`
- **Action**: `Allow`
- **Rule type**: `Include`
- **Selector**: `Emails`
- **Value**: Your email address (e.g., `you@example.com`)

#### Option B: Allow Email Domain
- **Policy name**: `Allow My Domain`
- **Action**: `Allow`
- **Rule type**: `Include`
- **Selector**: `Email domains`
- **Value**: Your domain (e.g., `example.com`)

#### Option C: Use Identity Provider (Google, GitHub, etc.)
- **Policy name**: `Allow via Google`
- **Action**: `Allow`
- **Rule type**: `Include`
- **Selector**: `Login Methods`
- **Value**: Select your provider (Google, GitHub, Azure AD, etc.)

Click **Next**

### 6. Configure Additional Settings (Optional)

- **CORS Settings**: Leave as default
- **Cookie Settings**: Leave as default
- **Custom Claims**: Not needed

Click **Add Application**

---

## Verification Steps

### Test 1: Check Cloudflare Access is Active

1. Visit **https://artifacts.jbcloud.app** in a private/incognito browser window
2. **Expected behavior**: You should see a Cloudflare login page (NOT your app's landing page)
3. If you still see your app's landing page, Access is not configured correctly

### Test 2: Complete Authentication

1. On the Cloudflare login page, choose your authentication method
2. Complete the login (Google, email code, etc.)
3. **Expected behavior**: Redirected to your app's dashboard with your email displayed
4. If you see the landing page again, the JWT is not being passed correctly

### Test 3: Verify JWT Cookie

After successful login, open browser DevTools:

**Chrome/Edge:**
1. Press `F12`
2. Go to **Application** tab
3. Expand **Cookies** → `https://artifacts.jbcloud.app`
4. Look for cookie named: `CF_Authorization`
5. **Expected**: Should contain a long JWT token

**Firefox:**
1. Press `F12`
2. Go to **Storage** tab
3. Expand **Cookies** → `https://artifacts.jbcloud.app`
4. Look for: `CF_Authorization`

### Test 4: Test API Endpoints

After logging in successfully, test the API:

```bash
# This should return your artifacts (empty array if none exist)
curl https://artifacts.jbcloud.app/api/artifacts \
  -H "Cookie: CF_Authorization=YOUR_TOKEN_HERE"
```

---

## Common Issues & Solutions

### Issue: Still seeing landing page after setup

**Solution**:
- Make sure the application domain exactly matches: `artifacts.jbcloud.app`
- No `https://` prefix
- No trailing slash
- Path should be blank (not `/` or `/*`)

### Issue: Cloudflare login page appears but redirects back to login

**Solution**:
- Check your authentication policy allows your email/domain
- Try using "One-time PIN" authentication method first to test
- Verify session duration is set (not 0)

### Issue: "Access Denied" error

**Solution**:
- Your email doesn't match the policy rules
- Add your specific email address to an Include rule
- Or broaden the policy to allow your email domain

### Issue: JWT cookie not appearing

**Solution**:
- Clear all cookies for `artifacts.jbcloud.app`
- Try in incognito/private mode
- Check if third-party cookies are blocked in browser settings
- Verify Cloudflare Access application is "Active" (not paused)

### Issue: API returns 401 Unauthorized

**Solution**:
- The JWT token is present but invalid
- Check the `getUserEmail()` function is correctly parsing the JWT
- Verify JWT contains an `email` field in the payload

---

## Testing Authentication Locally

If you want to test locally with `wrangler dev`, you'll need to:

1. **Get a valid JWT token** from your production site after logging in
2. **Extract the `CF_Authorization` cookie value**
3. **Pass it to your local dev environment**:

```bash
# Start local dev
wrangler dev

# In another terminal, test with the cookie
curl http://localhost:8787/api/artifacts \
  -H "Cookie: CF_Authorization=YOUR_PRODUCTION_JWT_HERE"
```

**Note**: Local dev (`wrangler dev`) does NOT trigger Cloudflare Access, so you can't test the full login flow locally.

---

## Disable Authentication for Testing (NOT RECOMMENDED)

If you want to temporarily bypass authentication for testing:

**Edit `web/worker.js` line 61:**

```javascript
// BEFORE (with auth):
const userEmail = await getUserEmail(request);

// AFTER (no auth - TESTING ONLY):
const userEmail = 'test@example.com'; // Hardcoded for testing
```

**WARNING**: This removes all security. Only use for local testing. Never deploy this to production.

---

## Next Steps After Setup

Once Cloudflare Access is working:

1. ✅ Login should work - no more loops
2. ✅ API endpoints should be accessible
3. ✅ Your email will be displayed in the app header
4. ✅ Browser extension can save artifacts using the JWT
5. ✅ Each user's data is automatically isolated by email

---

## Support Resources

- **Cloudflare Access Docs**: https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-apps/
- **Cloudflare Zero Trust Dashboard**: https://one.dash.cloudflare.com/
- **Identity Provider Setup**: https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/

---

## Questions?

If you're still having issues after following these steps, check:

1. Is the Cloudflare Access application showing as "Active"?
2. Can you see the `CF_Authorization` cookie in your browser?
3. Does the JWT decode successfully? (Try https://jwt.io)
4. Is the `email` field present in the JWT payload?

The worker logs might also help:
```bash
wrangler tail
```

Then visit your site and watch for errors.
