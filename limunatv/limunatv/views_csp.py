import json
import logging

from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import sentry_sdk

logger = logging.getLogger('csp')


@csrf_exempt
def csp_report(request):
    """Receive CSP violation reports from browsers and log them.

    Browsers send a JSON body under the `report` key. We log the payload
    at INFO level and forward to Sentry if configured.
    """
    try:
        if request.method != 'POST':
            return HttpResponse(status=405)

        # Django doesn't automatically parse application/csp-report
        body = request.body.decode('utf-8') or '{}'
        data = json.loads(body)
    except Exception as exc:
        logger.exception('CSP report parse error')
        return HttpResponse(status=400)

    # Normalize report content
    report = data.get('csp-report') or data.get('report') or data
    logger.info('CSP violation reported: %s', json.dumps(report))

    # Forward to Sentry if available
    if sentry_sdk.get_client().is_active():
        sentry_sdk.capture_message(
            f"CSP Violation: {report.get('violated-directive', 'unknown')}",
            level='warning',
            extra=report,
        )

    # Keep response small; browsers expect 204/200
    return JsonResponse({'status': 'received'}, status=204)
