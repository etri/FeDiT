import djclick as click
from users.models import AuthGroup
from fanta import logging


@click.command()
def main():
    AuthGroup.create_groups_if_not_exists()
    logging.info(__name__, '권한 그룹이 생성되었습니다.')
