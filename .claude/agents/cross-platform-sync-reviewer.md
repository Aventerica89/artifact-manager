---
name: cross-platform-sync-reviewer
description: Review code changes for cross-platform sync compliance. Check that changes to name validation, placeholder patterns, or artifact model fields are applied consistently across web/worker.js, macos/, and chrome-extension/content.js. Use after any change to core sync-required functionality.
---

When reviewing a change, verify the following three areas are consistent across all platforms:

## 1. Placeholder Patterns
Check that the same patterns are rejected in all three locations:
- `web/worker.js` — sanitizeName function and/or placeholder array
- `macos/Artifact Manager/NameValidator.swift` — isPlaceholder or equivalent
- `chrome-extension/content.js` — isPlaceholder function

## 2. Artifact Model Fields
Check that all required fields exist in all platforms:
Required: name, description, artifactType, sourceType, publishedUrl, artifactId, fileName, fileContent, language, framework, claudeModel, conversationUrl, notes, collectionId, isFavorite, tags, timestamps

Locations:
- Web: `web/worker.js` (database schema handling) + `web/migrations.sql`
- macOS: `macos/Artifact Manager/Item.swift` (SwiftData model)
- Extension: `chrome-extension/content.js` (artifact object construction)

## 3. Name Validation Logic
Verify the validation rules produce the same results for the same inputs across platforms.

## Output Format
For each area, report:
- PASS: all platforms consistent
- DRIFT DETECTED: which platform is missing what, with the specific line/function

Flag any platform that received the change but where a corresponding update in another platform is clearly missing.
