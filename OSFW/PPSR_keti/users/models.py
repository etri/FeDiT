from enum import Enum

from constance import config
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.contrib.auth.models import Group
from django.db import models
from django.db.transaction import atomic


class AuthGroup(Enum):
    G_READ = "G_READ"  # 조회 권한
    G_WRITE = "G_WRITE"  # 변경 권한

    @staticmethod
    def create_groups_if_not_exists():
        for g in AuthGroup:
            _ = Group.objects.get_or_create(name=g.value)


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, username, password=None):
        user = User(username=username)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password):
        user = self.create_user(username=username, password=password)
        user.is_admin = True
        user.is_superuser = True
        user.is_staff = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    class Meta:
        verbose_name = '사용자'
        verbose_name_plural = '사용자'
        # app_label = 'auth'

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []
    EMAIL_FIELD = 'email'

    username = models.CharField('사용자 ID', max_length=255, unique=True)
    email = models.CharField(unique=True, null=True, blank=True, max_length=128, verbose_name='이메일')
    department = models.CharField('부서명', max_length=255, db_index=True, null=True, blank=True)
    full_name = models.CharField('이름', max_length=16, null=True, blank=True)
    waiting_for_approval = models.BooleanField(default=False, verbose_name='승인 대기')
    employ_number = models.CharField(db_index=True, null=True, blank=True, max_length=32, verbose_name='사번')

    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    prefs = models.JSONField(default=None, null=True, blank=True)

    @property
    def display_text(self) -> str:
        if self.full_name:
            if self.department:
                return f"{self.full_name} / {self.department}"

            else:
                return self.full_name

        else:
            return self.username

    def has_auth_group(self, group: AuthGroup) -> bool:
        return self.groups.filter(name=group.value).exists()

    def reset_auth_groups(self):
        with atomic():
            self.groups.clear()

            for name in config.USER_INITIAL_GROUPS.split(','):
                name = name.strip()

                try:
                    g = Group.objects.get(name=name)
                    self.groups.add(g)
                except Group.DoesNotExist:
                    pass

    def make_admin(self, flag: bool):
        self.is_admin = flag
        self.is_staff = flag
        self.is_superuser = flag
        self.save()


__all__ = [
    'User',
    'UserManager',
    'AuthGroup'
]
