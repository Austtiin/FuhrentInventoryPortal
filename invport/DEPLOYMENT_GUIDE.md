# Deployment Guide: Azure Static Web Apps vs Azure App Service

## Current Issue

Your app is configured to deploy to **Azure Static Web Apps**, but your application requires **server-side features** that Static Web Apps cannot provide:

### Features Requiring a Server:
- ❌ **API Routes** (`/api/vehicles`, `/api/dashboard`, etc.)
- ❌ **Server Components** (Next.js App Router with database connections)
- ❌ **Dynamic Routes** (`/inventory/edit/[id]`)
- ❌ **Server-Side Rendering** (`force-dynamic` pages)
- ❌ **Database Connections** (Azure SQL via mssql package)
- ❌ **Real-time Data** (SWR polling and refresh)

### What Static Web Apps Support:
- ✅ Static HTML/CSS/JavaScript
- ✅ Client-side React (no server components)
- ✅ Azure Functions (separate from Next.js)
- ✅ Pre-rendered pages only

## Solution: Migrate to Azure App Service

Azure App Service provides a full Node.js server environment that supports all Next.js features.

---

## Option 1: Deploy to Azure App Service (Recommended)

### Step 1: Create Azure App Service

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → "Web App"
3. Configure:
   - **Name**: `fuhrent-inventory` (or your preferred name)
   - **Runtime**: Node 20 LTS
   - **Region**: Same as your database
   - **Pricing**: B1 or higher (Standard recommended for production)

### Step 2: Configure Environment Variables

In Azure Portal → Your App Service → Configuration → Application Settings:

```bash
# Database Connection
DB_SERVER=your-server.database.windows.net
DB_DATABASE=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_ACCOUNT_NAME=flattstorage
AZURE_STORAGE_ACCOUNT_KEY=your-key

# App Configuration
NODE_ENV=production
WEBSITE_NODE_DEFAULT_VERSION=20-lts
```

### Step 3: Get Publish Profile

1. In Azure Portal → Your App Service
2. Click "Download publish profile"
3. Save the downloaded `.publishsettings` file

### Step 4: Add GitHub Secret

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
4. Value: Paste the entire contents of the `.publishsettings` file
5. Click "Add secret"

### Step 5: Update Workflow File

1. Open `.github/workflows/azure-app-service-deploy.yml`
2. Update the `AZURE_WEBAPP_NAME` to your app name
3. Commit and push to trigger deployment

### Step 6: Verify Deployment

After deployment completes:
- Visit: `https://your-app-name.azurewebsites.net`
- Check: All features work (dashboard, inventory, edit, etc.)

---

## Option 2: Stay with Static Web Apps (Major Restructure Required)

⚠️ **Not Recommended** - Requires significant architecture changes

### Required Changes:

1. **Remove API Routes**
   - Delete entire `/src/app/api` folder
   - Create Azure Functions separately

2. **Remove Dynamic Routes**
   - Delete `/inventory/edit/[id]`
   - Use query parameters instead: `/inventory/edit?id=123`

3. **Remove Server Components**
   - Convert all pages to client components
   - Remove database connections from pages

4. **Create Azure Functions**
   - Create separate Functions app for backend
   - Migrate all API logic to Functions
   - Update client to call Functions instead

5. **Update Build Configuration**
   - Use static export permanently
   - Remove `force-dynamic` exports
   - Pre-generate all pages

### Estimated Effort: 20-40 hours of development

---

## Recommended Action Plan

### Immediate (Do This Now):

1. ✅ Create Azure App Service (5 minutes)
2. ✅ Configure environment variables (5 minutes)
3. ✅ Download publish profile (1 minute)
4. ✅ Add GitHub secret (2 minutes)
5. ✅ Update workflow file (2 minutes)
6. ✅ Push to GitHub and deploy (5 minutes)

**Total Time: ~20 minutes**

### Update Workflow File:

```yaml
# Edit .github/workflows/azure-app-service-deploy.yml
env:
  AZURE_WEBAPP_NAME: fuhrent-inventory  # Change to your app name
```

### Disable Static Web Apps Workflow:

Rename the old workflow to disable it:
```bash
mv .github/workflows/azure-static-web-apps-victorious-dune-06aef9810.yml 
   .github/workflows/azure-static-web-apps-victorious-dune-06aef9810.yml.disabled
```

---

## Cost Comparison

### Azure Static Web Apps
- **Free Tier**: $0/month (but can't run your app)
- **Standard**: $9/month (still can't run API routes)

### Azure App Service
- **B1 Basic**: ~$13/month (supports everything)
- **S1 Standard**: ~$70/month (recommended for production)
- **P1 Premium**: ~$150/month (high performance)

---

## Next Steps

**Immediate Action Required:**

Would you like me to:
1. ✅ Set up the Azure App Service deployment workflow (already done)
2. ⏳ Disable the Static Web Apps workflow
3. ⏳ Create deployment documentation
4. ⏳ Help configure your Azure App Service

Just let me know your Azure App Service name and I'll update the workflow file!

---

## Technical Details

### Why Static Web Apps Don't Work:

```typescript
// This requires a Node.js server (not available in Static Web Apps)
export const dynamic = 'force-dynamic'; // ❌ Server-side rendering
export const revalidate = 0;            // ❌ Server-side caching

// API routes require a server
export async function GET(request: Request) { // ❌ Server endpoint
  const pool = await sql.connect(config);    // ❌ Database connection
  return Response.json(data);
}

// Dynamic routes require a server
export default function EditPage({ params }: { params: { id: string } }) {
  // ❌ Server-side parameter handling
}
```

### What Works in App Service:

```typescript
// ✅ Everything works!
- Server Components
- API Routes
- Dynamic Routes
- Database Connections
- Server-Side Rendering
- Incremental Static Regeneration
- Image Optimization
- Middleware
- Environment Variables
```

---

## Troubleshooting

### If Deployment Fails:

1. Check Azure Portal → App Service → Deployment Center → Logs
2. Check Azure Portal → App Service → Log stream
3. Verify environment variables are set
4. Check Node.js version (should be 20.x)

### Common Issues:

- **500 Error**: Missing environment variables
- **Database Connection Failed**: Wrong connection string
- **Module Not Found**: Run `npm ci` before build
- **Port Error**: App Service sets PORT automatically (don't hardcode)

---

## Questions?

Let me know if you need help with:
- Creating the Azure App Service
- Configuring environment variables
- Updating the workflow
- Testing the deployment

