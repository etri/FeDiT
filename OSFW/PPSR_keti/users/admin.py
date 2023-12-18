from django.contrib import admin

from fanta.admin import site
from .forms import *
from .models import User, AuthGroup


class BaseAuthGroupFilter(admin.SimpleListFilter):
    title: str = None  # override me
    group: AuthGroup = None  # override me

    parameter_name = "user"

    def lookups(self, request, model_admin):
        return [
            ("yes", "권한 있음"),
            ("no", "권한 없음"),
        ]

    def queryset(self, request, queryset):
        if self.value() == "yes":
            return queryset.filter(groups__name=self.group.value)

        if self.value():
            return queryset.exclude(groups__name=self.group.value)


class G_READ(BaseAuthGroupFilter):
    title: str = "조회 권한"
    group: AuthGroup = AuthGroup.G_READ


class G_WRITE(BaseAuthGroupFilter):
    title: str = "변경 권한"
    group: AuthGroup = AuthGroup.G_WRITE


@admin.register(User, site=site)
class UserAdmin(admin.ModelAdmin):
    form = UserForm

    list_display = (
        'username',
        'email',
        'full_name',
        'department',
        'employ_number',
        # 'waiting_for_approval',
        # 'prefs',
        'has_read',
        'has_write',
        'is_staff',
    )

    list_display_links = (
        'username',
    )

    search_fields = [
        'username',
        'email',
        'full_name',
        'department',
        'employ_number',
        # 'prefs',
    ]

    list_filter = [
        'department',
        # 'waiting_for_approval',
        G_READ,
        G_WRITE,
        'is_staff',
    ]

    # 조회 권한
    @admin.display(boolean=True)
    def has_read(self, obj: User):
        return obj.has_auth_group(AuthGroup.G_READ)

    has_read.admin_order_field = 'groups__name'
    has_read.short_description = G_READ.title

    # 51 베이 블록 변경 권한
    @admin.display(boolean=True)
    def has_write(self, obj: User):
        return obj.has_auth_group(AuthGroup.G_WRITE)

    has_write.admin_order_field = 'groups__name'
    has_write.short_description = G_WRITE.title

    def join_admin(self, request, queryset):
        for user in queryset:
            user.make_admin(True)

    join_admin.short_description = '어드민 권한 부여'

    def retire_admin(self, request, queryset):
        for user in queryset:
            user.make_admin(False)

    retire_admin.short_description = '어드민 권한 해제'

    actions = [
        'join_admin',
        'retire_admin',
    ]
