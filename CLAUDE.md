# Artifact Manager

A unified platform to track and organize Claude.ai artifacts across all devices.

## Repository Structure

```
artifact-manager/
├── macos/              # Native macOS app (SwiftUI + SwiftData)
├── web/                # Web app (Cloudflare Worker)
├── chrome-extension/   # Chrome/Firefox extension
├── safari-extension/   # Safari extension
└── mobile/             # Mobile app (React Native/Expo)
```

## Quick Links

| Platform | Directory | Deploy/Build |
|----------|-----------|--------------|
| macOS | `macos/` | Open in Xcode, Cmd+R |
| Web | `web/` | `cd web && wrangler deploy` |
| Chrome | `chrome-extension/` | Load unpacked in chrome://extensions |
| Safari | `safari-extension/` | Build in Xcode |
| Mobile | `mobile/` | `cd mobile && npx expo start` |

## Development

### macOS App
```bash
cd macos
swift build && swift test
open "Artifact Manager.xcodeproj"
```

### Web App
```bash
cd web
wrangler dev      # Local development
wrangler deploy   # Deploy to Cloudflare
```

### Chrome Extension
```bash
cd chrome-extension
# Load unpacked extension in chrome://extensions
# Enable Developer Mode first
```

### Mobile App
```bash
cd mobile
npm install
npx expo start
```

## Project Sync Rules (CRITICAL)

All platforms share core functionality. When making changes to these features, **update ALL platforms**:

### Core Features That Must Stay in Sync:

1. **Name Validation** (`NameValidator`)
   - macOS: `macos/Artifact Manager/NameValidator.swift`
   - Web: `web/worker.js` (sanitizeName function)
   - Extension: `chrome-extension/content.js` (isPlaceholder function)

2. **Placeholder Patterns**
   - Must detect: "Saving...", "Loading...", "Downloading...", "Untitled", empty strings
   - All platforms should reject the same patterns

3. **Artifact Model**
   - Required fields: name, description, artifactType, sourceType, publishedUrl, artifactId, fileName, fileContent, language, framework, claudeModel, conversationUrl, notes, collectionId, isFavorite, tags, timestamps

### Data Flow

```
Claude.ai ──[browser extension]──> Web App (Cloudflare Worker) <──[import]── macOS App
                                          │
                                          └── D1 Database
```

## Testing

### macOS
```bash
cd macos && swift test
# Expected: 42 tests passing
```

### Web
```bash
cd web && wrangler dev
# Test at http://localhost:8787
```

### Extension
```bash
# Load in Chrome, visit claude.ai
# Check console for "Artifact Manager: Ready"
```

## Version History

- **Extension v1.1.0** - Button placement fix, version display, shareable HTML rendering
- **Extension v1.0.0** - Initial release
- **macOS v1.0.0** - Initial release with full feature parity

## Related Documentation

- [jbdocs: Extension Changelog](https://docs.jbcloud.app/artifact-manager-extension/changelog)
- [jbdocs: macOS Architecture](https://docs.jbcloud.app/artifact-manager-mac/architecture)
