"""Import handler: extract zip, parse files, build file tree."""

import csv
import io
import logging
import os
import tempfile
import zipfile

logger = logging.getLogger(__name__)


def extract_and_parse_zip(zip_bytes: bytes) -> dict:
    """Extract a zip file and return a parsed file tree with content.

    Returns:
        {
            "files": [
                {
                    "path": "relative/path/to/file.md",
                    "name": "file.md",
                    "format": "markdown" | "csv" | "text",
                    "content": "parsed content string",
                    "size": 1234,
                }
            ],
            "tree": {
                "name": "root",
                "type": "folder",
                "children": [...]
            }
        }
    """
    with tempfile.TemporaryDirectory() as tmp_dir:
        zip_path = os.path.join(tmp_dir, "upload.zip")
        with open(zip_path, "wb") as f:
            f.write(zip_bytes)

        try:
            with zipfile.ZipFile(zip_path, "r") as zf:
                # Security: check for path traversal
                for info in zf.infolist():
                    extracted_path = os.path.normpath(os.path.join(tmp_dir, info.filename))
                    if not extracted_path.startswith(os.path.normpath(tmp_dir) + os.sep) and extracted_path != os.path.normpath(tmp_dir):
                        raise ValueError(f"Unsafe path in zip: {info.filename}")

                zf.extractall(tmp_dir)
        except zipfile.BadZipFile:
            raise ValueError("无效的 zip 文件")

        # Walk extracted files and parse
        extract_root = tmp_dir
        files = []
        tree = {"name": "root", "type": "folder", "children": []}

        # Find the actual root: if zip contains a single top-level folder, use it
        entries = [
            e for e in os.listdir(extract_root)
            if e != "upload.zip" and not e.startswith(".")
        ]

        for entry in sorted(entries):
            entry_path = os.path.join(extract_root, entry)
            if os.path.isdir(entry_path):
                child = _walk_dir(entry_path, entry, files)
                tree["children"].append(child)
            elif os.path.isfile(entry_path):
                parsed = _parse_file(entry_path, entry)
                if parsed:
                    files.append(parsed)
                    tree["children"].append({
                        "name": entry,
                        "type": "file",
                        "format": parsed["format"],
                    })

    return {"files": files, "tree": tree}


def _walk_dir(dir_path: str, rel_prefix: str, files: list) -> dict:
    """Recursively walk a directory and build tree + file list."""
    node = {"name": os.path.basename(dir_path), "type": "folder", "children": []}

    for entry in sorted(os.listdir(dir_path)):
        if entry.startswith("."):
            continue
        full_path = os.path.join(dir_path, entry)
        rel_path = f"{rel_prefix}/{entry}"

        if os.path.isdir(full_path):
            child = _walk_dir(full_path, rel_path, files)
            node["children"].append(child)
        elif os.path.isfile(full_path):
            parsed = _parse_file(full_path, rel_path)
            if parsed:
                files.append(parsed)
                node["children"].append({
                    "name": entry,
                    "type": "file",
                    "format": parsed["format"],
                })

    return node


def _parse_file(file_path: str, rel_path: str) -> dict | None:
    """Parse a single file based on extension. Returns None for unsupported types."""
    ext = os.path.splitext(file_path)[1].lower()
    name = os.path.basename(file_path)
    size = os.path.getsize(file_path)

    # Skip files > 1MB
    if size > 1_048_576:
        logger.warning("Skipping large file: %s (%d bytes)", rel_path, size)
        return None

    if ext == ".md":
        return _read_text_file(file_path, rel_path, name, size, "markdown")
    elif ext == ".csv":
        return _read_csv_file(file_path, rel_path, name, size)
    elif ext in (".txt", ".text"):
        return _read_text_file(file_path, rel_path, name, size, "text")
    else:
        # Unsupported format, skip
        return None


def _read_text_file(
    file_path: str, rel_path: str, name: str, size: int, fmt: str,
) -> dict:
    """Read a text/markdown file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="gbk", errors="replace") as f:
            content = f.read()

    return {
        "path": rel_path,
        "name": name,
        "format": fmt,
        "content": content,
        "size": size,
    }


def _read_csv_file(file_path: str, rel_path: str, name: str, size: int) -> dict:
    """Read a CSV file and return content as formatted text."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            raw = f.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="gbk", errors="replace") as f:
            raw = f.read()

    # Also parse as structured data for preview
    reader = csv.reader(io.StringIO(raw))
    rows = list(reader)

    return {
        "path": rel_path,
        "name": name,
        "format": "csv",
        "content": raw,
        "size": size,
        "rows": len(rows),
        "columns": len(rows[0]) if rows else 0,
    }
