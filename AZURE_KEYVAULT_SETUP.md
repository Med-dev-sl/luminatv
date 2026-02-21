# Azure Key Vault Setup Guide

This guide walks you through storing your Django project's secrets in Azure Key Vault instead of `.env` files for production deployments.

## Why Use Azure Key Vault?

- **Centralized secrets management**: Store all secrets in one secure, auditable location
- **No .env files in production**: Eliminates risk of accidentally committing secrets to git
- **Automatic rotation support**: Integrate with CI/CD to rotate secrets without redeployment
- **Access control**: Fine-grained RBAC permissions on who can access each secret
- **Audit logging**: Track who accessed which secrets and when

## Prerequisites

- Azure subscription
- Azure CLI (`az login` ready)
- Your Django app deployed to Azure App Service, Container Apps, or similar

## Step 1: Create an Azure Key Vault

```bash
# Set variables
$VAULT_NAME = "luminatv-vault"  # Must be globally unique (3-24 chars, alphanumeric, hyphens)
$RESOURCE_GROUP = "luminatv-rg"
$LOCATION = "eastus"

# Create the vault
az keyvault create --resource-group $RESOURCE_GROUP `
                   --name $VAULT_NAME `
                   --location $LOCATION `
                   --enable-rbac-authorization
```

## Step 2: Add Secrets to Key Vault

Store your Django secrets with Key Vault-friendly names (hyphens instead of underscores):

```bash
# Add Django secret key (generate a new one if needed)
$DJANGO_SECRET_KEY = "your-50-character-secret-key-here"
az keyvault secret set --vault-name "$VAULT_NAME" `
                       --name "DJANGO-SECRET-KEY" `
                       --value "$DJANGO_SECRET_KEY"

# Add Sentry DSN
az keyvault secret set --vault-name "$VAULT_NAME" `
                       --name "SENTRY-DSN" `
                       --value "https://your-key@ingest.sentry.io/your-project-id"

# Add CSRF trusted origins (Render URL, custom domain)
az keyvault secret set --vault-name "$VAULT_NAME" `
                       --name "DJANGO-CSRF-TRUSTED-ORIGINS" `
                       --value "https://luminatv-backend.onrender.com"
```

**Azure Key Vault naming rules:**
- Secret names can contain letters, digits, and hyphens
- Environment variable names in code use underscores; the `utils_keyvault.py` script handles conversion

## Step 3: Configure Azure Authentication

### Option A: Managed Identity (Recommended for App Service/Container Apps)

If your Django app runs on Azure App Service or Container Apps:

```bash
# 1. Enable system-assigned managed identity
az app service identity assign --resource-group $RESOURCE_GROUP `
                               --name "luminatv-backend"

# Get the principal ID
$PRINCIPAL_ID = az app service identity show --resource-group $RESOURCE_GROUP `
                                              --name "luminatv-backend" `
                                              --query principalId -o tsv

# 2. Grant the identity permission to read secrets
az keyvault role assignment create --vault-name $VAULT_NAME `
                                   --role "Key Vault Secrets Officer" `
                                   --assignee-object-id $PRINCIPAL_ID `
                                   --assignee-principal-type ServicePrincipal
```

Then set this environment variable in your App Service:

```
AZURE_KEYVAULT_NAME=luminatv-vault
```

Django will automatically use Managed Identity (no credentials needed).

### Option B: Service Principal (For CI/CD or External Services)

Create a service principal and grant it access:

```bash
# Create service principal
$SP = az ad sp create-for-rbac --name "luminatv-ci-cd" `
                               --query "{id:appId, password:password, tenant:tenant}"

# Grant secrets access
az keyvault role assignment create --vault-name $VAULT_NAME `
                                   --role "Key Vault Secrets Officer" `
                                   --assignee-object-id $SP.id `
                                   --assignee-principal-type ServicePrincipal

# Save credentials for deployment
$SP | ConvertTo-Json | Out-File sp-credentials.json
```

Then set these environment variables in your deployment (GitHub Secrets, Azure Pipelines, etc.):

```
AZURE_KEYVAULT_NAME=luminatv-vault
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### Option C: Azure CLI Authentication (Local Development)

For local development or testing:

```bash
# Log in to Azure
az login

# Set the environment variable
$env:AZURE_KEYVAULT_NAME = "luminatv-vault"

# Run Django
python manage.py check --deploy
```

## Step 4: Update Your Django App

The integration is already done! Your `settings.py` now uses:

```python
from utils_keyvault import get_secret_or_env

# Secrets are loaded from Key Vault if available, fallback to env vars
SECRET_KEY = get_secret_or_env('DJANGO-SECRET-KEY', os.environ.get('DJANGO_SECRET_KEY', get_random_secret_key()))
SENTRY_DSN = get_secret_or_env('SENTRY-DSN', os.environ.get('SENTRY_DSN'))
```

### Fallback Behavior

The `get_secret_or_env()` function tries sources in this order:

1. **Environment variable** (e.g., `$env:DJANGO_SECRET_KEY`)
2. **Azure Key Vault** (if `AZURE_KEYVAULT_NAME` set and authenticated)
3. **Default value** (if provided)
4. **Raise error** (if secret not found anywhere)

This means:
- Local `.env` files still work during development
- Production with Key Vault requires no `.env` file
- Graceful fallback if Key Vault is unavailable

## Step 5: Test the Integration

### Locally with Azure CLI

```bash
# Login to Azure
az login

# Set the vault name
$env:AZURE_KEYVAULT_NAME = "luminatv-vault"

# Run Django check
python manage.py check --deploy

# You should see: "System check identified no issues (0 silenced)"
```

### In Production (App Service)

Check the logs:

```bash
az webapp log show --resource-group $RESOURCE_GROUP --name luminatv-backend
```

Look for messages like:
```
Loaded secret 'DJANGO-SECRET-KEY' from Key Vault
```

## Step 6: Update Render Deployment (Optional)

If you want to add Key Vault support to your Render deployment (requires Render Pro+):

```yaml
# render.yaml
env:
  - key: AZURE_KEYVAULT_NAME
    value: luminatv-vault
  - key: AZURE_TENANT_ID
    value: ${AZURE_TENANT_ID}
  - key: AZURE_CLIENT_ID
    value: ${AZURE_CLIENT_ID}
  - key: AZURE_CLIENT_SECRET
    value: ${AZURE_CLIENT_SECRET}
```

**Note:** Render's free tier doesn't support custom secrets well; use environment variables instead.

## Step 7: Rotate Secrets

Every 90 days (or per your security policy), rotate your secrets:

```bash
# 1. Generate a new secret
$NEW_SECRET = [System.Web.Security.Membership]::GeneratePassword(50, 0)

# 2. Create the new version in Key Vault
az keyvault secret set --vault-name $VAULT_NAME `
                       --name "DJANGO-SECRET-KEY" `
                       --value $NEW_SECRET

# 3. Update Django's SECRET_KEY in your app (redeploy or set env var)
# The app will automatically pick up the new secret

# 4. If you have multiple instances, trigger a redeployment
az deployment group create --resource-group $RESOURCE_GROUP `
                           --template-file your-bicep-template.bicep
```

See [SECURITY_OPERATIONS.md](./SECURITY_OPERATIONS.md) for more details.

## Troubleshooting

### Error: "NoCredentialsError" or "Credentials could not be configured"

**Cause:** Azure authentication not set up.

**Fix:**
- Locally: Run `az login`
- App Service: Enable Managed Identity (see Step 3, Option A)
- CI/CD: Set `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` environment variables

### Error: "Vault not found"

**Cause:** Vault name is incorrect or not set.

**Fix:**
- Verify vault name: `az keyvault list --query "[].name"`
- Set env var: `$env:AZURE_KEYVAULT_NAME = "your-vault-name"`

### Error: "Principal does not have access to the secret"

**Cause:** App's identity doesn't have permission to read secrets.

**Fix:**
- Assign role to Managed Identity: `az keyvault role assignment create --vault-name $VAULT_NAME --role "Key Vault Secrets Officer" --assignee-object-id $PRINCIPAL_ID --assignee-principal-type ServicePrincipal`

### Secrets loading from .env instead of Key Vault

This is expected behavior (fallback). Key Vault takes precedence *only if* authentication succeeds. To force Key Vault:

1. Remove the environment variable: `Remove-Item env:AZURE_CLIENT_SECRET`
2. Ensure `AZURE_KEYVAULT_NAME` is set
3. Ensure authentication is working: `az keyvault secret show --vault-name $VAULT_NAME --name "DJANGO-SECRET-KEY"`

## Cost Estimation

- **Azure Key Vault**: $0.6/month (standard tier, includes 10K operations/month free)
- **Extra operations**: $0.03 per 10K operations
- **Managed Identity**: Free (built into App Service/Container Apps)

For a typical Django app, cost is negligible.

## Next Steps

1. Follow Step 1-3 to set up your vault and secrets
2. Deploy your app to Azure with this configuration
3. Verify secrets are loading via app logs (`Step 5`)
4. Set up 90-day rotation schedule (see `SECURITY_OPERATIONS.md`)
5. (Optional) Monitor secret access via Azure audit logs: `az monitor diagnostic-settings create --resource /subscriptions/.../resourceGroups/luminatv-rg/providers/Microsoft.KeyVault/vaults/luminatv-vault --name "audit-logging" --logs '[{"category": "AuditEvent", "enabled": true}]' --workspace /subscriptions/.../resourceGroups/luminatv-rg/providers/microsoft.operationalinsights/workspaces/luminatv-logs`

---

**Security Best Practice:** Never commit `.env` files to git. Use `.env.example` as a template. Your app is now ready for production with secrets safely stored in Azure Key Vault! 🔐

