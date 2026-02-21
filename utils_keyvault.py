"""
Azure Key Vault integration for Django settings.
Loads secrets from Azure Key Vault instead of .env (optional, for production).

Installation:
    pip install azure-identity azure-keyvault-secrets

Usage in settings.py:
    from utils_keyvault import get_secret_or_env
    DJANGO_SECRET_KEY = get_secret_or_env('DJANGO-SECRET-KEY')
    SENTRY_DSN = get_secret_or_env('SENTRY-DSN')

Environment setup (PowerShell):
    $env:AZURE_KEYVAULT_NAME = 'your-vault-name'
    $env:AZURE_TENANT_ID = 'your-tenant-id'
    $env:AZURE_CLIENT_ID = 'your-client-id'
    $env:AZURE_CLIENT_SECRET = 'your-client-secret'

Or use Managed Identity (recommended for App Service):
    - No credentials needed; Azure authenticates automatically based on App Service identity.
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from azure.identity import ClientSecretCredential, ManagedIdentityCredential
    from azure.keyvault.secrets import SecretClient
    AZURE_AVAILABLE = True
except ImportError:
    AZURE_AVAILABLE = False
    logger.warning("Azure SDK not installed. Key Vault support disabled. Install: pip install azure-identity azure-keyvault-secrets")


def get_keyvault_client() -> Optional[SecretClient]:
    """Initialize and return Azure Key Vault secretClient, or None if not available."""
    if not AZURE_AVAILABLE:
        return None
    
    vault_name = os.environ.get('AZURE_KEYVAULT_NAME')
    if not vault_name:
        return None
    
    vault_url = f"https://{vault_name}.vault.azure.net"
    
    # Try Managed Identity first (App Service, Container Apps, etc.)
    try:
        credential = ManagedIdentityCredential()
        return SecretClient(vault_url=vault_url, credential=credential)
    except Exception as e:
        logger.debug(f"Managed Identity not available: {e}")
    
    # Fall back to explicit credentials
    tenant_id = os.environ.get('AZURE_TENANT_ID')
    client_id = os.environ.get('AZURE_CLIENT_ID')
    client_secret = os.environ.get('AZURE_CLIENT_SECRET')
    
    if tenant_id and client_id and client_secret:
        try:
            credential = ClientSecretCredential(tenant_id, client_id, client_secret)
            return SecretClient(vault_url=vault_url, credential=credential)
        except Exception as e:
            logger.warning(f"Failed to authenticate to Key Vault: {e}")
    
    return None


def get_secret_or_env(secret_name: str, default: str = None) -> str:
    """
    Retrieve a secret from Key Vault or environment variable.
    Falls back to environment variable if Key Vault is unavailable.
    
    Args:
        secret_name: Name of secret in Key Vault (e.g., 'DJANGO-SECRET-KEY')
        default: Default value if secret not found anywhere
    
    Returns:
        Secret value or default
    """
    # Try environment variable first (for local dev)
    env_key = secret_name.replace('-', '_')
    if env_key in os.environ:
        return os.environ[env_key]
    
    # Try Key Vault
    client = get_keyvault_client()
    if client:
        try:
            secret = client.get_secret(secret_name)
            logger.info(f"Loaded secret '{secret_name}' from Key Vault")
            return secret.value
        except Exception as e:
            logger.warning(f"Failed to load '{secret_name}' from Key Vault: {e}")
    
    # Return default or raise error
    if default is not None:
        return default
    
    raise ValueError(f"Secret '{secret_name}' not found in Key Vault or environment")


# Example usage in Django settings.py:
if __name__ == '__main__':
    # Test without django
    print("Testing Key Vault integration...")
    print(f"Azure SDK available: {AZURE_AVAILABLE}")
    print(f"Key Vault client: {get_keyvault_client()}")
    print("Setup: export AZURE_KEYVAULT_NAME=your-vault and authenticate with Azure CLI or env vars")
