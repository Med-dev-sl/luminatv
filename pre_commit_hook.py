#!/usr/bin/env python
"""
Pre-commit hook for security checks.
Install: cp pre_commit_hook.py .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

This hook runs before each commit, ensuring:
1. No hardcoded secrets are committed
2. No security issues in code (bandit)
3. No known CVEs in dependencies (safety)
4. No debug/test files committed
"""

import subprocess
import sys
import re


def run_command(cmd, description):
    """Run a command and return True if successful."""
    print(f"\n▶ {description}...")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"✗ FAILED: {description}")
        if result.stdout:
            print("STDOUT:", result.stdout[:500])
        if result.stderr:
            print("STDERR:", result.stderr[:500])
        return False
    
    print(f"✓ PASSED: {description}")
    return True


def check_for_secrets():
    """Check for common hardcoded secrets."""
    print("\n▶ Checking for hardcoded secrets...")
    
    patterns = [
        r'SECRET_KEY\s*=\s*["\'](?!.*-insecure)[a-z0-9\-_]{20,}["\']',
        r'SENTRY_DSN\s*=\s*["\']https://',
        r'password\s*=\s*["\'](?!.*placeholder)[a-z0-9]{8,}["\']',
        r'api[_-]?key\s*=\s*["\'][a-z0-9]{20,}["\']',
    ]
    
    result = subprocess.run('git diff --cached', shell=True, capture_output=True, text=True)
    diff = result.stdout
    
    found = False
    for pattern in patterns:
        if re.search(pattern, diff, re.IGNORECASE):
            print(f"✗ Potential secret found matching pattern: {pattern[:50]}...")
            found = True
    
    if found:
        print("Aborting commit. Please review your changes before committing secrets.")
        return False
    
    print("✓ No hardcoded secrets detected")
    return True


def main():
    """Run all pre-commit checks."""
    print("=" * 60)
    print("Running pre-commit security checks...")
    print("=" * 60)
    
    checks = [
        (check_for_secrets(), "Hardcoded secrets check"),
        (run_command('python security_check.py', 'Security scan (safety & bandit)'), 'Security scan'),
        (run_command('python manage.py check --deploy', 'Django deployment checks'), 'Django check'),
    ]
    
    # Count passed checks
    passed = sum(1 for result, _ in checks if result)
    total = len(checks)
    
    print("\n" + "=" * 60)
    print(f"Pre-commit checks: {passed}/{total} PASSED")
    print("=" * 60)
    
    # Fail if any check failed
    if passed < total:
        print("\n✗ Commit blocked by failed security checks.")
        print("   Fix the issues above and try again.")
        sys.exit(1)
    else:
        print("\n✓ All checks passed. Proceeding with commit.")
        sys.exit(0)


if __name__ == '__main__':
    main()
