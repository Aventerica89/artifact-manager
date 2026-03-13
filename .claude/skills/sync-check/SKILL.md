---
name: sync-check
description: Verify cross-platform sync between web worker.js, macOS NameValidator.swift, and Chrome extension content.js for name validation patterns and artifact model fields
disable-model-invocation: true
---

Compare these three files for drift in:
1. Placeholder patterns (must match): "Saving...", "Loading...", "Downloading...", "Untitled", empty strings
   - web/worker.js: look for sanitizeName and placeholder array
   - macos/Artifact Manager/NameValidator.swift: look for isPlaceholder or placeholder patterns
   - chrome-extension/content.js: look for isPlaceholder function

2. Artifact model required fields (must be consistent across all platforms):
   name, description, artifactType, sourceType, publishedUrl, artifactId, fileName, fileContent, language, framework, claudeModel, conversationUrl, notes, collectionId, isFavorite, tags, timestamps

Report:
- Any placeholder pattern present in one platform but missing in another
- Any artifact field present in one platform but missing in another
- A pass/fail summary per platform
