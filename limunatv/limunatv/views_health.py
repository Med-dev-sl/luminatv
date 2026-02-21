"""
Health check and status views for Render.com deployment monitoring.
"""

import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods


@require_http_methods(["GET"])
def health_check(request):
    """
    Simple health check endpoint for Render uptime monitoring.
    Returns 200 if service is running, checks DB connectivity.
    
    Usage in Render dashboard: set Health Check endpoint to /health/
    """
    try:
        from django.db import connection
        
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            'status': 'healthy',
            'version': '1.0',
        }, status=200)
    
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e),
        }, status=503)


@require_http_methods(["GET"])
def status(request):
    """
    Detailed status endpoint with version and component info.
    """
    import django
    from django.conf import settings
    
    return JsonResponse({
        'service': 'luminatv-backend',
        'status': 'ok',
        'django_version': django.get_version(),
        'debug': settings.DEBUG,
        'allowed_hosts': settings.ALLOWED_HOSTS,
    }, status=200)
