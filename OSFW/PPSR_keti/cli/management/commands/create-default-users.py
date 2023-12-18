import djclick as click

from fanta import logger
from users.models import User


@click.command()
def main():
    # bilge / bilge
    try:
        u = User.objects.get(username='keti')
        u.set_password('keti')
        u.save()
    except User.DoesNotExist:
        u = User.objects.create_user('keti', 'keti')

    u.email = 'keti@fanta.local'
    u.is_staff = True
    u.is_superuser = True
    u.save()

    logger.info('keti / keti 계정이 ADMIN 권한으로 생성되었습니다.')
