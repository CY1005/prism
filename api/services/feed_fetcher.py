"""F14 Feed fetcher — RSS parsing and AI search (mock)."""

import logging
import uuid
from datetime import datetime

import feedparser
from sqlalchemy.orm import Session

from api.models.tables import FeedItem, FeedSource, Node

logger = logging.getLogger(__name__)


def fetch_rss(source_url: str) -> list[dict]:
    """Parse RSS/Atom feed and return structured items."""
    feed = feedparser.parse(source_url)
    items = []
    for entry in feed.entries:
        published = None
        if hasattr(entry, "published_parsed") and entry.published_parsed:
            published = datetime(*entry.published_parsed[:6])
        elif hasattr(entry, "updated_parsed") and entry.updated_parsed:
            published = datetime(*entry.updated_parsed[:6])
        else:
            published = datetime.utcnow()

        items.append({
            "title": getattr(entry, "title", "Untitled"),
            "link": getattr(entry, "link", ""),
            "published": published,
            "summary": getattr(entry, "summary", "")[:500],
        })
    return items


def ai_search_feed(project_id: str, db: Session) -> list[dict]:
    """Generate search queries based on project context and return results.

    Real search API integration is v1.x. For now, returns empty list.
    """
    logger.info("ai_search_feed called for project %s — placeholder, returning empty", project_id)
    return []


def process_feed_items(
    project_id: str,
    raw_items: list[dict],
    source_id: str,
    db: Session,
) -> int:
    """Store fetched items in feed_items table. Returns count of new items."""
    # Find first leaf node in project for mock AI suggestion
    first_leaf = (
        db.query(Node)
        .filter(Node.project_id == project_id, Node.type == "file")
        .first()
    )
    suggested_node_id = str(first_leaf.id) if first_leaf else None

    # Get source name for display
    source = db.query(FeedSource).filter(FeedSource.id == source_id).first()
    source_display = source.name if source else "Unknown"

    count = 0
    for item in raw_items:
        # Check for duplicate by title + project
        existing = (
            db.query(FeedItem)
            .filter(
                FeedItem.project_id == project_id,
                FeedItem.title == item["title"],
            )
            .first()
        )
        if existing:
            continue

        feed_item = FeedItem(
            id=uuid.uuid4(),
            project_id=project_id,
            source_id=source_id,
            title=item["title"],
            source=source_display,
            published_date=item["published"],
            summary=item.get("summary", ""),
            tags=[],
            suggested_node_id=suggested_node_id,
            confidence=0.5 if suggested_node_id else 0,
            status="pending",
        )
        db.add(feed_item)
        count += 1

    db.commit()
    return count
