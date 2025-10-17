# Deployment Guide

## Database Configuration

### Local Development

For local development, the application uses the `.env.local` file with the following connection string:

```
AZURE_SQL_CONNECTION_STRING=Server=tcp:flatt-db-server.database.windows.net,1433;Initial Catalog=flatt-inv-sql;Persist Security Info=False;User ID=admin_panel;Password=Jumping11!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

### Production Deployment

For production deployments to Azure, the application expects the connection string to be provided via Azure secrets management.

#### Azure App Service Configuration

1. Navigate to your Azure App Service in the Azure Portal
2. Go to **Configuration** > **Application settings**
3. Add a new application setting:
   - **Name**: `AZURE_ADMIN_SQL_CONN_STRING`
   - **Value**: Your production database connection string
   - Mark as **Slot setting** if using deployment slots

#### Azure Key Vault (Recommended for Production)

For enhanced security, store the connection string in Azure Key Vault:

1. Create a Key Vault secret named `AZURE-ADMIN-SQL-CONN-STRING`
2. Configure your App Service to reference the Key Vault secret:
   ```
   @Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/AZURE-ADMIN-SQL-CONN-STRING/)
   ```

#### GitHub Secrets (for CI/CD)

If using GitHub Actions for deployment:

1. Go to your repository **Settings** > **Secrets and variables** > **Actions**
2. Add a new repository secret:
   - **Name**: `AZURE_ADMIN_SQL_CONN_STRING`
   - **Value**: Your production database connection string

### Connection String Priority

The application checks for database configuration in the following order:

1. **AZURE_ADMIN_SQL_CONN_STRING** (Production secret)
2. **AZURE_SQL_CONNECTION_STRING** (Local development)
3. Individual environment variables (DB_HOST, DB_USER, etc.) - Fallback

### Database Connection Details

- **Server**: flatt-db-server.database.windows.net
- **Database**: flatt-inv-sql
- **Port**: 1433
- **User**: admin_panel
- **Encryption**: Required (Azure SQL Database)
- **Connection Timeout**: 30 seconds

## Build Commands

### Static Build (for Azure Static Web Apps)
```bash
npm run build:static
```
- Outputs to `out` directory
- Excludes API routes and dynamic pages
- Suitable for static hosting

### Standard Build (for Azure App Service)
```bash
npm run build
```
- Full Next.js build with server-side features
- Includes all API routes and dynamic pages
- Requires Node.js runtime

## Environment Variables Checklist

Before deploying, ensure these environment variables are configured:

- [ ] `AZURE_ADMIN_SQL_CONN_STRING` (Production)
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_NAME` (Optional)

## Security Notes

⚠️ **Never commit `.env.local` to version control**

- The `.env.local` file contains sensitive credentials
- It's already listed in `.gitignore`
- Use Azure Key Vault or App Configuration for production secrets
- Rotate credentials regularly
- Use Managed Identity when possible for Azure resources

## Testing Database Connection

To test the database connection locally:

```bash
npm run dev
```

Navigate to any API endpoint that uses the database, and check the console for connection logs:
- ✅ Connected to Azure SQL Database successfully
- ❌ Connection failed (with error details)

## Troubleshooting

### Connection Timeout
- Check firewall rules in Azure SQL Database
- Verify the server name and port are correct
- Ensure your IP address is whitelisted (for local dev)

### Authentication Failed
- Verify username and password are correct
- Check if the user has proper permissions
- Ensure the connection string format is correct

### SSL/TLS Issues
- `Encrypt=True` is required for Azure SQL Database
- `TrustServerCertificate=False` ensures secure connections
- Update your SQL Server certificate if needed
