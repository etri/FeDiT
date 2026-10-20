"""논리 식별자의 공통 규칙"""

import re

NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
