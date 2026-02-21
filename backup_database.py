#!/usr/bin/env python
"""
Database backup script for SQLite.
Run manually or via cron for scheduled backups.

Usage:
    python backup_database.py                    # Backup to default location
    python backup_database.py --restore <file>  # Restore from backup file
    python backup_database.py --cleanup 30      # Delete backups older than N days
"""

import shutil
import argparse
import sys
from pathlib import Path
from datetime import datetime, timedelta
import gzip

REPO_ROOT = Path(__file__).parent
DB_PATH = REPO_ROOT / 'limunatv' / 'db.sqlite3'
BACKUP_DIR = REPO_ROOT / 'backups'


def setup_backup_dir():
    """Ensure backup directory exists."""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✓ Backup directory: {BACKUP_DIR}")


def backup_database(compress=True):
    """Create a timestamped backup of the database."""
    if not DB_PATH.exists():
        print(f"✗ Database not found at {DB_PATH}")
        return False
    
    timestamp = datetime.now().strftime('%Y-%m-%d_%H%M%S')
    if compress:
        backup_file = BACKUP_DIR / f'db_{timestamp}.sqlite3.gz'
        try:
            with open(DB_PATH, 'rb') as f_in:
                with gzip.open(backup_file, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            size_mb = backup_file.stat().st_size / (1024 * 1024)
            print(f"✓ Database backed up (compressed): {backup_file} ({size_mb:.2f} MB)")
        except Exception as e:
            print(f"✗ Backup failed: {e}")
            return False
    else:
        backup_file = BACKUP_DIR / f'db_{timestamp}.sqlite3'
        try:
            shutil.copy2(DB_PATH, backup_file)
            size_mb = backup_file.stat().st_size / (1024 * 1024)
            print(f"✓ Database backed up: {backup_file} ({size_mb:.2f} MB)")
        except Exception as e:
            print(f"✗ Backup failed: {e}")
            return False
    
    return True


def restore_database(backup_file):
    """Restore database from a backup file."""
    backup_path = Path(backup_file)
    
    if not backup_path.exists():
        print(f"✗ Backup file not found: {backup_path}")
        return False
    
    if backup_path.suffix == '.gz':
        try:
            # Extract and restore
            with gzip.open(backup_path, 'rb') as f_in:
                with open(DB_PATH, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            print(f"✓ Database restored from compressed backup: {backup_path}")
        except Exception as e:
            print(f"✗ Restore failed: {e}")
            return False
    else:
        try:
            shutil.copy2(backup_path, DB_PATH)
            print(f"✓ Database restored from backup: {backup_path}")
        except Exception as e:
            print(f"✗ Restore failed: {e}")
            return False
    
    return True


def cleanup_old_backups(days=30):
    """Delete backups older than N days."""
    if not BACKUP_DIR.exists():
        print("ℹ Backup directory doesn't exist yet")
        return
    
    cutoff = datetime.now() - timedelta(days=days)
    deleted_count = 0
    
    for backup_file in BACKUP_DIR.glob('db_*.sqlite3*'):
        mtime = datetime.fromtimestamp(backup_file.stat().st_mtime)
        if mtime < cutoff:
            try:
                backup_file.unlink()
                deleted_count += 1
                print(f"  Deleted: {backup_file.name}")
            except Exception as e:
                print(f"  Failed to delete {backup_file.name}: {e}")
    
    print(f"✓ Cleanup complete: {deleted_count} old backup(s) deleted")


def list_backups():
    """List all available backups."""
    if not BACKUP_DIR.exists():
        print("ℹ No backups yet")
        return
    
    backups = sorted(BACKUP_DIR.glob('db_*.sqlite3*'), reverse=True)
    if not backups:
        print("ℹ No backups found")
        return
    
    print(f"Available backups ({len(backups)} total):")
    for backup in backups:
        size_mb = backup.stat().st_size / (1024 * 1024)
        mtime = datetime.fromtimestamp(backup.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
        print(f"  {backup.name:<40} {size_mb:>8.2f} MB  {mtime}")


def main():
    parser = argparse.ArgumentParser(description='Manage database backups')
    parser.add_argument('--restore', help='Restore from backup file')
    parser.add_argument('--cleanup', type=int, default=0, help='Delete backups older than N days')
    parser.add_argument('--list', action='store_true', help='List all backups')
    parser.add_argument('--no-compress', action='store_true', help='Do not compress backups')
    args = parser.parse_args()
    
    setup_backup_dir()
    
    if args.list:
        list_backups()
    elif args.restore:
        if restore_database(args.restore):
            sys.exit(0)
        else:
            sys.exit(1)
    elif args.cleanup > 0:
        cleanup_old_backups(args.cleanup)
    else:
        if backup_database(compress=not args.no_compress):
            sys.exit(0)
        else:
            sys.exit(1)


if __name__ == '__main__':
    main()
