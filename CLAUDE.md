# Artifact Manager

Multi-platform app to track and organize Claude.ai artifacts. Syncs across browser extensions, macOS app, web app, and mobile.

## Commands

### macOS App
```bash
cd macos
swift build          # Build
swift test           # Run tests (42 expected)
open "Artifact Manager.xcodeproj"  # Open in Xcode
# Cmd+R to run
```

### Web App (Cloudflare Worker)
```bash
# wrangler.toml is at repo root - run wrangler from repo root, not web/
npm install
wrangler dev         # Local dev at http://localhost:8787
CLOUDFLARE_ACCOUNT_ID=e2613c1c17024c32ab14618614e2b309 wrangler deploy
```

### Chrome Extension
```bash
cd chrome-extension
# Load unpacked at chrome://extensions (enable Developer Mode)
# Test at claude.ai - console shows "Artifact Manager: Ready"
```

### Safari Extension
```bash
cd safari-extension
# Open in Xcode, build and run
# Enable in Safari > Preferences > Extensions
```

### Mobile App
```bash
cd mobile
npm install
npx expo start
```

## Architecture

```
artifact-manager/
├── macos/              # SwiftUI + SwiftData
├── web/                # Cloudflare Worker + D1 database
├── chrome-extension/   # Content script for claude.ai
├── safari-extension/   # Native Safari extension
└── mobile/             # React Native/Expo (in progress)
```

### Data Flow
```
Claude.ai ──[browser extension]──> Web App (D1) <──[import]── macOS App
```

## Sync Rules (CRITICAL)

All platforms share core functionality. When changing these, **update ALL platforms**:

| Feature | macOS | Web | Extension |
|---------|-------|-----|-----------|
| Name validation | `NameValidator.swift` | `worker.js` (sanitizeName) | `content.js` (isPlaceholder) |
| Placeholder patterns | Same patterns everywhere | | |
| Artifact model | Same required fields | | |

### Placeholder Patterns (must match across all platforms)
- "Saving...", "Loading...", "Downloading...", "Untitled", empty strings

### Artifact Model Required Fields
name, description, artifactType, sourceType, publishedUrl, artifactId, fileName, fileContent, language, framework, claudeModel, conversationUrl, notes, collectionId, isFavorite, tags, timestamps

## Key Files

| Platform | Entry Point | Data Layer |
|----------|-------------|------------|
| macOS | `Artifact Manager.xcodeproj` | SwiftData |
| Web | `web/worker.js` | D1 (SQLite) |
| Chrome | `chrome-extension/manifest.json` | localStorage + API |
| Safari | `safari-extension/` | Shared with macOS |

## Gotchas

- Extension button placement depends on Claude.ai DOM structure - may break if they update
- D1 database has 10MB limit per database on free tier
- SwiftData and D1 schemas must stay compatible for import/export
- Safari extension shares code with macOS app via shared framework
- Content script injection timing matters - wait for claude.ai to fully load
- `artifactId` comes from Claude's URL hash, not generated locally

## Claude Code Automation

- Run `/sync-check` to verify name validation and artifact model fields are consistent across all platforms
- JS files are auto-formatted with prettier on every edit (PostToolUse hook in `.claude/settings.json`)
- `package.json` at root exists only for prettier — not a web app entrypoint

## Testing

```bash
# macOS - run full test suite
cd macos && swift test

# Web - manual testing
cd web && wrangler dev
# Then test endpoints at http://localhost:8787

# Extension - load in browser, visit claude.ai
# Check console for "Artifact Manager: Ready"
```

