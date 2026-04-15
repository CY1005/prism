#!/bin/bash
# 验证所有 Skill 文件的结构完整性（Hermes 阶段②）

SKILLS_DIR="docs/skills"
ERRORS=0

for file in $(find "$SKILLS_DIR" -name "*.md" ! -name "INDEX.md"); do
  echo "检查: $file"

  # 1. YAML frontmatter 必填字段
  for field in name description trigger last_updated; do
    if ! grep -q "^${field}:" "$file"; then
      echo "  ❌ 缺少必填字段: $field"
      ERRORS=$((ERRORS + 1))
    fi
  done

  # 2. 必须段落
  for section in "## 验证" "## 执行检查点" "## 改进触发器"; do
    if ! grep -q "$section" "$file"; then
      echo "  ❌ 缺少段落: $section"
      ERRORS=$((ERRORS + 1))
    fi
  done

  # 3. 验证段必须有 checkbox
  if ! grep -A20 "## 验证" "$file" | grep -q "\- \[ \]"; then
    echo "  ⚠️  验证段没有可勾选的检查项"
    ERRORS=$((ERRORS + 1))
  fi

  echo "  ✅ 通过"
done

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ 所有 Skill 文件验证通过"
else
  echo "❌ 发现 $ERRORS 个问题"
fi
exit $ERRORS
