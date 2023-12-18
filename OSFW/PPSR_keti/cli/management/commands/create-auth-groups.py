import djclick as click

from fanta import logger
from users.models import AuthGroup


@click.command()
def main():
    AuthGroup.create_groups_if_not_exists()
    logger.info('권한 그룹이 생성되었습니다.')
