# OAuth 2.0 Setup Guide

This guide explains how to set up OAuth 2.0 authentication with Microsoft Azure AD and Google for the Fuhr Enterprise Dealer Inventory Portal.

## Prerequisites

- Azure AD tenant (for Microsoft OAuth)
- Google Cloud Console access (for Google OAuth)
- Node.js development environment

## 1. Microsoft Azure AD Setup

### Step 1: Register Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the application details:
   - **Name**: Fuhr Enterprise Dealer Portal
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Web - `http://localhost:3000/auth/callback/microsoft`

### Step 2: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Add the following Microsoft Graph permissions:
   - `User.Read` (Delegated)
   - `openid` (Delegated)
   - `profile` (Delegated)
   - `email` (Delegated)
   - `offline_access` (Delegated)

### Step 3: Generate Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add description and set expiration
4. **Copy the secret value immediately** (you won't see it again)

### Step 4: Configure Environment Variables

```bash
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_application_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_MICROSOFT_TENANT_ID=your_tenant_id_here
```

## 2. Google OAuth Setup

### Step 1: Create Project in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the **Google+ API** or **Google Identity API**

### Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **Internal** (for organization use) or **External**
3. Fill in application information:
   - **App name**: Fuhr Enterprise Dealer Portal
   - **User support email**: your-email@company.com
   - **Application homepage**: http://localhost:3000
   - **Authorized domains**: your-domain.com (for production)

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Configure:
   - **Name**: Fuhr Enterprise Portal
   - **Authorized redirect URIs**: `http://localhost:3000/auth/callback/google`

### Step 4: Configure Environment Variables

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 3. Application Configuration

### Step 1: Copy Environment File

```bash
cp .env.example .env.local
```

### Step 2: Update Environment Variables

Edit `.env.local` with your actual OAuth credentials:

```bash
# Microsoft Azure AD
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789abc
MICROSOFT_CLIENT_SECRET=your_secret_here
NEXT_PUBLIC_MICROSOFT_TENANT_ID=your_tenant_id_or_common

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_secret_here

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_minimum_32_characters
JWT_EXPIRES_IN=24h
```

### Step 3: Install Dependencies (if needed)

```bash
npm install jsonwebtoken
npm install @types/jsonwebtoken --save-dev
```

## 4. Production Configuration

### For Azure AD (Production)

1. Update redirect URI to production domain:
   - `https://yourdomain.com/auth/callback/microsoft`
2. Configure production environment variables
3. Ensure HTTPS is enabled
4. Consider using Azure Key Vault for secrets

### For Google OAuth (Production)

1. Update authorized redirect URIs:
   - `https://yourdomain.com/auth/callback/google`
2. Add your production domain to authorized domains
3. Configure production environment variables
4. Enable additional security features if needed

## 5. Security Considerations

### Environment Variables
- Never commit `.env.local` to version control
- Use secure secret generation for JWT secrets
- Rotate client secrets regularly

### HTTPS Requirements
- OAuth 2.0 requires HTTPS in production
- Use proper SSL certificates
- Configure secure cookie settings

### Session Management
- Implement proper token refresh logic
- Use secure HTTP-only cookies
- Implement session timeout handling

## 6. Testing the Setup

### Development Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/signin`

3. Test both Microsoft and Google sign-in flows

4. Verify successful redirects and user data retrieval

### Production Testing

1. Deploy to staging environment
2. Test with production OAuth configurations
3. Verify HTTPS requirements
4. Test user permissions and role assignments

## 7. Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**
   - Ensure redirect URIs match exactly in OAuth provider settings
   - Check for http vs https differences

2. **Invalid Client ID/Secret**
   - Verify environment variables are set correctly
   - Check for typos in client credentials

3. **Scope Permissions**
   - Ensure required scopes are granted
   - Admin consent may be required for some Microsoft permissions

4. **Cors Errors**
   - Verify authorized domains in OAuth settings
   - Check referrer policies

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

Check browser console and server logs for detailed error messages.

## 8. Next Steps

After successful OAuth setup:

1. Implement user role management
2. Add database user storage
3. Configure refresh token handling
4. Implement proper logout flows
5. Add audit logging for security

## Support

For technical issues:
- Check Azure AD documentation: https://docs.microsoft.com/en-us/azure/active-directory/
- Check Google OAuth documentation: https://developers.google.com/identity/protocols/oauth2
- Contact IT support for enterprise configuration questions