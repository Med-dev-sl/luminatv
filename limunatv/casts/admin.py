from django.contrib import admin
from .models import Cast


@admin.register(Cast)
class CastAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
