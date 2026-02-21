# Security Procedures & Operations Guide

## Key Rotation

### When to rotate keys:
- **Periodic**: Every 90 days (quarterly minimum)
- **On compromise**: Immediately if SECRET_KEY or SENTRY_DSN is exposed
- **Post-incident**: After security breach or unauthorized access
- **On personnel change**: When developers with key access leave

### How to rotate `DJANGO_SECRET_KEY`:

1. **Generate a new key** (locally, never in logs):
   ```powershell
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

2. **Update `.env` and deployment secrets**:
   ```
   DJANGO_SECRET_KEY=<new-key>
   ```

3. **Important**: Do NOT immediately remove old key. Django sessions/tokens may still use it.
   - Keep old key in `SECRET_KEY_FALLBACK` for 24-48 hours to allow session migration.
   - Update `settings.py` to check both during transition period.

4. **Invalidate active sessions** (optional, more aggressive):
   ```bash
   python manage.py shell
   >>> from django.contrib.sessions.models import Session
   >>> Session.objects.all().delete()
   ```
   This forces all users to re-login, ensuring new key is used.

5. **Monitor in Sentry** for any `SECRET_KEY_INVALID` errors during transition.

### How to rotate `SENTRY_DSN`:

1. In Sentry dashboard, generate a new DSN (Project Settings → Client Keys).
2. Update `SENTRY_DSN` in your environment.
3. Restart services; new events go to fresh DSN.
4. Archive old DSN key after 7 days to prevent accidental reuse.

### Automation:

Consider using a secrets manager that rotates keys automatically:
- **Azure Key Vault**: `KeyRotationPolicy` for auto-rotation
- **AWS Secrets Manager**: Built-in rotation Lambda
- **HashiCorp Vault**: Policy-driven rotation

---

## Backup & Disaster Recovery

### What to backup:

1. **Database (`db.sqlite3`)**
   - Contains user data, sessions, audit logs
   - Backup frequency: **Daily minimum** (hourly in production)
   - Retention: **30 days** (comply with data retention policies)

2. **Environment & Configuration** (encrypted)
   - `.env` with secret values, Sentry DSN
   - Backup to: Azure Key Vault, AWS Secrets Manager, or encrypted vault
   - **Never commit to git**

3. **Application Code**
   - Backed up via git (push to GitHub/GitLab/Azure Repos)
   - Tag releases in git for easy rollback

### Backup Strategy:

#### **Option A: Manual Backups (Development)**
```powershell
# Backup database
Copy-Item "limunatv/db.sqlite3" "backups/db-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').sqlite3"

# Backup .env (encrypted recommended)
Copy-Item ".env" "backups/.env-backup-$(Get-Date -Format 'yyyy-MM-dd')"
```

#### **Option B: Automated Backups (Production - Recommended)**

Use **Azure Backup** (if on Azure App Service):
- Automatic daily snapshots to Azure Blob Storage
- Geo-redundant backup (LRS → GRS)
- Restore points retained for 30 days
- [Setup docs](https://docs.microsoft.com/en-us/azure/app-service/manage-backup)

Or use **Render.yaml** (if deployed on Render):
- Database auto-backups included
- Incremental backups daily
- 7-day retention
- One-click restore in dashboard

Or **Custom cronjob**:
```bash
# /etc/cron.d/django-backup
0 2 * * * /usr/bin/python /path/to/backup_script.py
```

### Restore Procedures:

#### **Database Restore:**
```bash
# Stop the app first
systemctl stop gunicorn  # Or equivalent

# Restore from backup
cp backups/db-2026-02-21-020000.sqlite3 limunatv/db.sqlite3

# Restart
systemctl start gunicorn
```

#### **Configuration Restore:**
```bash
# If secrets are in Azure Key Vault
az keyvault secret download --vault-name <vault> --name DJANGO_SECRET_KEY --file .env
```

### Testing Backups:

**Critical: Test restores regularly** (monthly minimum)
1. Restore to a **staging environment** (not production)
2. Verify data integrity: check user counts, recent posts, admin access
3. Run `python manage.py migrate` if schema changed
4. Smoke test: login, browse, check Sentry logs
5. Document restore time & any issues found

---

## Incident Response Checklist

If `DJANGO_SECRET_KEY` is compromised:

- [ ] 1. **Notify**: Alert team immediately (Slack, PagerDuty)
- [ ] 2. **Rotate**: Generate and deploy new `DJANGO_SECRET_KEY` within 15 minutes
- [ ] 3. **Invalidate**: Force all sessions to re-login
- [ ] 4. **Audit**: Check Sentry for unauthorized access/token forgery
- [ ] 5. **Lock**: Revoke access for exposed user accounts
- [ ] 6. **Monitor**: Watch for suspicious activity for 48 hours
- [ ] 7. **Review**: Post-incident review of how key was exposed

If `SENTRY_DSN` is leaked (lower priority, but do it):
- [ ] 1. Rotate SENTRY_DSN immediately
- [ ] 2. Review Sentry events for fraudulent activity
- [ ] 3. Archive old key

---

## Monitoring & Alerts

### Setup alerts in Sentry:

1. **High Error Rate**: Alert if error rate > 10% in 5 min
2. **CSP Violations**: Alert if > 50 CSP violations in 1 hour
3. **Auth Failures**: Alert if > 20 failed logins in 5 min (brute force attempt)
4. **Database Errors**: Alert on all `DatabaseError` events

### Setup alerts in Azure Monitor (if using Azure):

1. Create `LogAnalyticsWorkspace`
2. Query failed backups, high response times, failed deployments
3. Email/SMS alerts to on-call engineer

---

## Security Audit Checklist (Run Monthly)

- [ ] Run `python security_check.py --json` and review results
- [ ] Check Sentry dashboard for new error patterns
- [ ] Review Django admin access logs (if available)
- [ ] Verify all environment variables are set correctly
- [ ] Run `python manage.py check --deploy` and address warnings
- [ ] Check that CSP report only violations (no enforced blocks affecting users)
- [ ] Review backup restore test results
- [ ] Verify HTTPS/SSL certificate validity
- [ ] Check for any new dependency vulnerabilities via `pip list --outdated`

---

## References

- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- [Django deployment checklist](https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/)
- [Sentry Best Practices](https://develop.sentry.dev/self-hosted/)
- [Azure Key Vault documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
