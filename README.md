# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

---

**Django Security (backend)**: If you're running the Django backend included in `limunatv/`, configure environment variables before starting it.

- **Setup**: copy `.env.example` to `.env` and set secure values.
- **Run locally (PowerShell)**:

```powershell
$env:DJANGO_SECRET_KEY = 'your-secret'
$env:DJANGO_DEBUG = 'True'
$env:DJANGO_ALLOWED_HOSTS = 'localhost,127.0.0.1'
python .\limunatv\manage.py runserver
```

- **Run in production**: set `DJANGO_DEBUG=False`, provide `DJANGO_SECRET_KEY`, and set `DJANGO_ALLOWED_HOSTS` to your domain(s). Ensure SSL termination and the `X-Forwarded-Proto` header are set by your proxy.

These environment variables enable the hardened defaults in `limunatv/limunatv/settings.py` (secure cookies, HSTS, SSL redirect, and headers).

**Content Security Policy (CSP)**: a CSP helps mitigate XSS. This project includes `django-csp` in `requirements.txt` and a conservative `report-only` policy in `limunatv/limunatv/settings.py`.

- To enable report collection, set `DJANGO_CSP_REPORT_URI` to your collector endpoint (must be https).
- Once reports look good, set `CSP_REPORT_ONLY = False` in production and tighten directives.

**Sentry Integration**: CSP violations and errors are automatically captured and forwarded to Sentry if configured.

- **Setup**: Sign up at https://sentry.io and create a project for your Django app.
- **Configure**: Set `SENTRY_DSN` in your environment (get it from Sentry project settings).
- **Performance Tracing**: Adjust `SENTRY_TRACES_SAMPLE_RATE` (0.1 = 10%, lower for prod) and adjust attachment of stack traces via Django integration.
- CSP violations captured as warnings; errors/exceptions as errors.
- All monitored in the Sentry dashboard in real-time.
**Security Scanning**: Automated scanning for vulnerable dependencies and code issues.

- **Install dev tools**: `pip install -r requirements-dev.txt`
- **Run security checks**: `python security_check.py`
  - **Safety**: scans `requirements.txt` for known CVEs in dependencies.
  - **Bandit**: scans Python code for common security issues (hardcoded secrets, weak crypto, etc.).
- **JSON output for CI**: `python security_check.py --json` (useful in GitHub Actions / Azure Pipelines).
- **Schedule in CI**: Run before each merge to catch vulnerabilities early.

---

## 🔒 Complete Security & Operations Guide

### Essential Docs:
- **[SECURITY_OPERATIONS.md](SECURITY_OPERATIONS.md)**: Key rotation, backup strategies, disaster recovery, incident response checklist, and monthly audit checklist.
- **[backup_database.py](backup_database.py)**: Automated database backup script with restore and cleanup.
- **[utils_keyvault.py](utils_keyvault.py)**: Azure Key Vault integration (optional, for production).
- **[pre_commit_hook.py](pre_commit_hook.py)**: Git pre-commit hook to prevent secrets from being committed.

### CI/CD Pipelines:
- **[.github/workflows/security-and-test.yml](.github/workflows/security-and-test.yml)**: GitHub Actions workflow for security scans, tests, and deployment.
- **[azure-pipelines.yml](azure-pipelines.yml)**: Azure Pipelines template for security scans and deploy to Azure App Service.

### Quick Production Setup:

1. **Pre-commit hook** (local security checks):
   ```powershell
   Copy-Item pre_commit_hook.py .git/hooks/pre-commit
   ```

2. **Automated database backups** (daily):
   ```powershell
   # Windows Task Scheduler (run as admin):
   schtasks /create /tn "django_backup" /tr "python C:\path\to\backup_database.py" /sc daily /st 02:00
   ```

3. **Azure Key Vault** (production secrets):
   ```powershell
   pip install azure-identity azure-keyvault-secrets
   $env:AZURE_KEYVAULT_NAME = "your-vault"
   # Use get_secret_or_env() in settings.py instead of os.environ.get()
   ```

4. **Deploy with CI/CD**:
   - GitHub Actions: `.github/workflows/security-and-test.yml` runs on push/PR
   - Azure Pipelines: `azure-pipelines.yml` integrates with Azure DevOps

### Monthly Checklist:
- [ ] Rotate `DJANGO_SECRET_KEY` every 90 days (see SECURITY_OPERATIONS.md)
- [ ] Run `python security_check.py` and review results
- [ ] Test database restore from backup
- [ ] Review Sentry dashboard for errors & CSP violations
- [ ] Update dependencies (`pip list --outdated`)
- [ ] Run `python manage.py check --deploy`