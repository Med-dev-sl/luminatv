"""
URL configuration for limunatv project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from .views_csp import csp_report
from .views_health import health_check, status

urlpatterns = [
    path('admin/', admin.site.urls),
    # CSP report receiver
    path('csp-report/', csp_report, name='csp-report'),
    # Health checks (for Render uptime monitoring)
    path('health/', health_check, name='health-check'),
    path('status/', status, name='status'),
]
