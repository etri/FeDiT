from django.contrib import admin
from django.contrib import messages
from django.db.models import *
from django.http.request import HttpRequest
from django.utils import timezone as tz
from import_export.admin import ExportActionModelAdmin
from rangefilter.filters import DateRangeFilter

from fanta.admin import site
from .models import *


@admin.register(SimData, site=site)
class SimDataAdmin(ExportActionModelAdmin):
    list_display_links = None

    ordering = [
        '-pk'
    ]

    list_display = [
        'src',
        'dest',
        'get_creation_time',
    ]

    search_fields = [
        'src',
        'dest',
    ]

    list_filter = [
        ('creation_time', DateRangeFilter),
    ]

    @admin.display(ordering='creation_time', description='생성 시각')
    def get_creation_time(self, obj: SimData) -> str:
        return obj.creation_time.astimezone(tz.get_current_timezone()).strftime('%Y-%m-%d %H:%M:%S')

    @admin.action(description='- 데이터 변환')
    def convert_data(self, req: HttpRequest, q: QuerySet[SimData]) -> None:
        cnt = 0
        for data in q:
            if data.convert_if_not():
                cnt += 1
        messages.add_message(req, messages.INFO, f'총 {cnt}건 의 데이터가 변환 되었습니다.')

    @admin.action(description='- 변환 데이터 삭제')
    def remove_converted_data(self, req: HttpRequest, q: QuerySet[SimData]) -> None:
        cnt = 0
        for arc in q:
            if arc.remove_converted_data():
                cnt += 1

        messages.add_message(req, messages.INFO, f'총 {cnt}건 의 변환 데이터가 삭제 되었습니다.')

    actions = [
        convert_data,
        remove_converted_data
    ]
