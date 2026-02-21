#!/usr/bin/env python
"""
Security scanning script for the Django backend.
Run locally before commits or in CI/CD pipelines.

Usage:
    python security_check.py
    python security_check.py --json  # Output JSON for CI systems
"""

import subprocess
import sys
import json
import argparse
from pathlib import Path

REPO_ROOT = Path(__file__).parent
LIMUNATV_ROOT = REPO_ROOT / 'limunatv'


def run_safety_check():
    """Scan dependencies for known CVEs using safety."""
    print("\n=== Running Safety (CVE dependency scan) ===")
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'safety', 'check', '--file', 'requirements.txt', '--json'],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            print("✓ Safety: No known CVEs found in dependencies")
            return True, None
        else:
            print("✗ Safety: CVE vulnerabilities detected!")
            print(result.stdout)
            return False, result.stdout
    except FileNotFoundError:
        print("⚠ Safety not installed. Run: pip install -r requirements-dev.txt")
        return None, 'safety_not_installed'


def run_bandit_check():
    """Scan Python code for security issues using bandit."""
    print("\n=== Running Bandit (code security scan) ===")
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'bandit', '-r', str(LIMUNATV_ROOT), '-f', 'json'],
            capture_output=True,
            text=True,
        )
        data = json.loads(result.stdout or '{}')
        issues = data.get('results', [])

        if not issues:
            print("✓ Bandit: No security issues found in code")
            return True, None
        else:
            print(f"✗ Bandit: {len(issues)} security issue(s) detected!")
            for issue in issues:
                print(f"  - {issue.get('test_name', 'unknown')} in {issue.get('filename')}:{issue.get('line_number')}")
            return False, data
    except FileNotFoundError:
        print("⚠ Bandit not installed. Run: pip install -r requirements-dev.txt")
        return None, 'bandit_not_installed'


def main():
    parser = argparse.ArgumentParser(description='Run security checks on Django backend')
    parser.add_argument('--json', action='store_true', help='Output results as JSON')
    args = parser.parse_args()

    safety_ok, safety_data = run_safety_check()
    bandit_ok, bandit_data = run_bandit_check()

    if args.json:
        results = {
            'safety': {'status': 'ok' if safety_ok else 'failed', 'data': safety_data},
            'bandit': {'status': 'ok' if bandit_ok else 'failed', 'data': bandit_data},
        }
        print(json.dumps(results, indent=2))
    else:
        print("\n=== Security Scan Summary ===")
        print(f"Safety:  {'✓ PASS' if safety_ok else '✗ FAIL' if safety_ok is False else '⚠ SKIP'}")
        print(f"Bandit:  {'✓ PASS' if bandit_ok else '✗ FAIL' if bandit_ok is False else '⚠ SKIP'}")

    # Exit non-zero if any check failed
    if safety_ok is False or bandit_ok is False:
        sys.exit(1)


if __name__ == '__main__':
    main()
