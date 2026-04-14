"""F18 Embedding Service — generates vector embeddings for hybrid search.

Provider hierarchy:
1. OpenAI text-embedding-3-small (if OPENAI_API_KEY is set)
2. MockEmbeddingProvider (deterministic random vectors for dev/test)

The embeddings table schema (managed by raw SQL, not Drizzle ORM):
  CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL,   -- 'node' | 'dimension_record' | 'issue'
    target_id UUID NOT NULL,
    embedding vector(1536),
    model TEXT NOT NULL DEFAULT 'mock',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (target_type, target_id)
  );
  CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
"""

import hashlib
import json
import logging
import os
from typing import Literal

logger = logging.getLogger(__name__)

VECTOR_DIM = 1536  # matches text-embedding-3-small output dimension
TargetType = Literal["node", "dimension_record", "issue"]


# ─── Provider base ─────────────────────────────────────────────────────────

class EmbeddingProvider:
    """Abstract base for embedding providers."""

    async def embed(self, text: str) -> list[float]:
        raise NotImplementedError

    @property
    def model_name(self) -> str:
        raise NotImplementedError


# ─── Mock Provider ──────────────────────────────────────────────────────────

class MockEmbeddingProvider(EmbeddingProvider):
    """Deterministic mock provider for development/testing.

    Uses a hash of the input text to seed a pseudo-random vector so that
    identical content always yields the same embedding (idempotent).
    """

    @property
    def model_name(self) -> str:
        return "mock"

    async def embed(self, text: str) -> list[float]:
        import math
        import random as _random
        seed = int(hashlib.sha256(text.encode()).hexdigest(), 16) % (2**32)
        # Use seeded Gaussian RNG — produces near-orthogonal vectors in high dimensions
        # (different texts have cosine similarity ≈ 0, same text always gives same vector)
        rng = _random.Random(seed)
        vector = [rng.gauss(0, 1) for _ in range(VECTOR_DIM)]
        # L2-normalize so cosine similarity is well-behaved
        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0:
            vector = [v / norm for v in vector]
        return vector


# ─── OpenAI Provider ────────────────────────────────────────────────────────

class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI text-embedding-3-small provider."""

    def __init__(self, api_key: str):
        self._api_key = api_key
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                import openai
                self._client = openai.AsyncOpenAI(api_key=self._api_key)
            except ImportError:
                raise RuntimeError(
                    "openai package not installed. Run: pip install openai"
                )
        return self._client

    @property
    def model_name(self) -> str:
        return "text-embedding-3-small"

    async def embed(self, text: str) -> list[float]:
        client = self._get_client()
        # Truncate to 8192 tokens (model limit) — rough char approximation
        text = text[:32000]
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        return response.data[0].embedding


# ─── Factory ────────────────────────────────────────────────────────────────

def get_provider() -> EmbeddingProvider:
    """Return the best available embedding provider."""
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if api_key:
        logger.info("Using OpenAI embedding provider (text-embedding-3-small)")
        return OpenAIEmbeddingProvider(api_key)
    logger.info("No OPENAI_API_KEY — using MockEmbeddingProvider for development")
    return MockEmbeddingProvider()


# ─── Text extraction ────────────────────────────────────────────────────────

def extract_text_for_target(target_type: TargetType, record) -> str:
    """Extract plain text from a DB record for embedding.

    Args:
        target_type: 'node' | 'dimension_record' | 'issue'
        record: SQLAlchemy model instance

    Returns:
        Text string to embed (empty string if no meaningful content)
    """
    if target_type == "node":
        return record.name or ""

    if target_type == "dimension_record":
        content = record.content
        if isinstance(content, dict):
            parts = []
            for k, v in content.items():
                if isinstance(v, str) and v.strip():
                    parts.append(f"{k}: {v}")
                elif isinstance(v, list):
                    parts.append(f"{k}: {' '.join(str(i) for i in v)}")
            return "\n".join(parts)
        return json.dumps(content, ensure_ascii=False) if content else ""

    if target_type == "issue":
        parts = [record.description or ""]
        if record.tags:
            parts.append(" ".join(record.tags))
        return " ".join(parts)

    return ""


# ─── DB operations ──────────────────────────────────────────────────────────

INIT_SQL = """
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    embedding vector(1536),
    model TEXT NOT NULL DEFAULT 'mock',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT embeddings_target_unique UNIQUE (target_type, target_id)
);

CREATE INDEX IF NOT EXISTS embeddings_ivfflat_idx
    ON embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
"""


def ensure_embeddings_table(db_engine) -> bool:
    """Create pgvector extension and embeddings table if not present.

    Returns True if pgvector is available, False if extension creation fails
    (e.g., postgres:16-alpine without pgvector installed).
    """
    from sqlalchemy import text

    with db_engine.connect() as conn:
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
        except Exception as e:
            logger.warning("pgvector extension not available: %s — vector search disabled", e)
            conn.rollback()
            return False

        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS embeddings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    target_type TEXT NOT NULL,
                    target_id UUID NOT NULL,
                    embedding vector(1536),
                    model TEXT NOT NULL DEFAULT 'mock',
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    CONSTRAINT embeddings_target_unique UNIQUE (target_type, target_id)
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS embeddings_ivfflat_idx
                    ON embeddings USING ivfflat (embedding vector_cosine_ops)
                    WITH (lists = 100);
            """))
            conn.commit()
            logger.info("embeddings table and index ready")
            return True
        except Exception as e:
            logger.error("Failed to create embeddings table: %s", e)
            conn.rollback()
            return False


async def upsert_embedding(
    db_engine,
    target_type: TargetType,
    target_id: str,
    embedding: list[float],
    model: str,
) -> None:
    """Insert or update an embedding row."""
    from sqlalchemy import text

    vec_str = "[" + ",".join(f"{v:.8f}" for v in embedding) + "]"
    with db_engine.connect() as conn:
        conn.exec_driver_sql(
            """
            INSERT INTO embeddings (target_type, target_id, embedding, model, updated_at)
            VALUES (%s, %s, %s::vector, %s, NOW())
            ON CONFLICT (target_type, target_id)
            DO UPDATE SET
                embedding = EXCLUDED.embedding,
                model = EXCLUDED.model,
                updated_at = NOW()
            """,
            (target_type, target_id, vec_str, model),
        )
        conn.commit()


async def embed_and_store(
    db_engine,
    provider: EmbeddingProvider,
    target_type: TargetType,
    target_id: str,
    text_content: str,
) -> bool:
    """Generate embedding for text and store in DB.

    Returns True on success, False on failure.
    """
    if not text_content.strip():
        return False
    try:
        vector = await provider.embed(text_content)
        await upsert_embedding(db_engine, target_type, target_id, vector, provider.model_name)
        return True
    except Exception as e:
        logger.error("Failed to embed %s %s: %s", target_type, target_id, e)
        return False
