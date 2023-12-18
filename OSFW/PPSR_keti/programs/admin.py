from django.contrib import admin
from django.db.models import JSONField
from django_json_widget.widgets import JSONEditorWidget
from rangefilter.filters import DateRangeFilter

from fanta.admin import site
from .forms import *
from .models import *


@admin.register(Program, site=site)
class ProgramAdmin(admin.ModelAdmin):
    form = ProgramForm

    list_display = (
        'title',
        'filename',
        'is_visible',
        'wait_time_on_exit',
    )

    search_fields = (
        'title',
        'filename',
        'content'
    )

    list_filter = [
        'is_visible'
    ]


@admin.register(Execution)
class ExecutionAdmin(admin.ModelAdmin):
    formfield_overrides = {
        JSONField: {'widget': JSONEditorWidget},
    }

    list_display = (
        'request_id',
        'get_program_title',
        'function',
        'status',
        'creation_time',
        'start_time',
        'finish_time',
        'return_value',
    )

    list_filter = (
        'program',
        'status',
        ('creation_time', DateRangeFilter),
        ('start_time', DateRangeFilter),
        ('finish_time', DateRangeFilter),
    )

    search_fields = (
        'request_id',
        'program__title',
        'program__content'
    )

    ordering = (
        '-creation_time',
    )

    def get_program_title(self, obj: Execution) -> str:
        return obj.program.title

    get_program_title.short_description = '프로그램'
    get_program_title.admin_order_field = 'program__title'
