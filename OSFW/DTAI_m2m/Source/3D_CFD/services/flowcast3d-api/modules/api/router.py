from fastapi import APIRouter

from modules.api.management import analysis, cases, jobs, results
from modules.api.public import predict, visualize

router = APIRouter(prefix="/v1")
for module in (predict, visualize, cases, jobs, results, analysis):
    router.include_router(module.router)
