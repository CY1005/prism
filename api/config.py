import os

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://prism:prism_dev_2026@127.0.0.1:5432/prism",
)
