from django.db import models


class Cast(models.Model):
    name = models.CharField(max_length=255)
    photo = models.ImageField(upload_to='casts/photos/', blank=True, null=True)

    def __str__(self):
        return self.name
