# Deployment Options

## Option 1: Azure App Service (Recommended)
For full functionality including database connections and server-side features.

### Setup:
1. Create an Azure App Service in the Azure Portal
2. Download the publish profile from the App Service
3. Add the publish profile content as `AZURE_WEBAPP_PUBLISH_PROFILE` secret in GitHub
4. Update the app name in `.github/workflows/azure-app-service.yml`
5. Push to main branch to trigger deployment

### Features Available:
✅ Database connections
✅ API routes
✅ Server-side rendering
✅ Full Next.js functionality

## Option 2: Azure Static Web Apps (Limited)
For static-only deployment without server-side functionality.

### Setup:
1. The existing workflow will automatically deploy to Static Web Apps
2. Uses the `next.config.static.ts` configuration
3. Generates static files in the `out` folder

### Features Available:
❌ No database connections
❌ No API routes
❌ No server-side rendering
✅ Static pages only
✅ Client-side functionality

## Current Configuration:
- **Development**: Use `npm run dev` (full functionality)
- **Production Build**: Use `npm run build` (for App Service)
- **Static Build**: Use `npm run build:static` (for Static Web Apps)

## Recommendation:
Use Azure App Service for production deployment to maintain all application features.