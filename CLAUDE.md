# Artifact Manager - macOS Version

A native macOS app to track and organize Claude.ai artifacts using SwiftUI and SwiftData.

## Project Sync Rule (CRITICAL)

**This project has a companion web app** at `/Users/jb/cf-url-shortener/artifacts-app/`

When making changes to core functionality, **ALWAYS apply the same changes to both projects**:

### Core Features That Must Stay in Sync:

1. **Name Validation** (`NameValidator`)
   - macOS: Swift in `Artifact Manager/NameValidator.swift`
   - Web: JavaScript in `worker.js` (line ~2370) + Server function (line ~607)

2. **Placeholder Patterns**
   - Must detect: "Saving...", "Loading...", "Downloading...", "Untitled", empty strings
   - Both projects should reject the same patterns

3. **Cleanup Utility**
   - macOS: `CleanupUtility.swift` with SwiftUI
   - Web: Cleanup modal + API endpoints (`/api/cleanup/scan`, `/api/cleanup/fix`)

4. **Artifact Model**
   - macOS: SwiftData models in `Item.swift` and `Collection.swift`
   - Web: Database schema in `migrations.sql`
   - Required fields: name, description, artifactType, sourceType, publishedUrl, artifactId, fileName, fileContent, language, framework, claudeModel, conversationUrl, notes, collectionId, isFavorite, tags, timestamps

### When Adding Features:

1. Implement in the web version first (faster to test and deploy)
2. Translate to macOS Swift version
3. Test both versions
4. Deploy web version: `wrangler deploy`
5. Build and test macOS version: `swift build && swift test`

### Key Differences (These DON'T need to sync):

- **Storage**: macOS uses SwiftData, Web uses D1 (SQLite)
- **Auth**: macOS is local-only, Web uses Cloudflare Access
- **UI Framework**: macOS uses SwiftUI, Web uses vanilla HTML/JS
- **Deployment**: macOS via Xcode, Web via Wrangler

## Development

### Build
```bash
cd /Users/jb/artifact-manager-mac
swift build
```

### Test
```bash
swift test  # 42 tests should pass
```

### Run in Xcode
```bash
open "Artifact Manager.xcodeproj"
# Press Cmd+R to build and run
```

## Project Structure

```
Artifact Manager/
├── Artifact_ManagerApp.swift    # App entry point
├── ContentView.swift             # Main UI + Add/Edit views
├── Item.swift                    # SwiftData artifact model
├── Collection.swift              # SwiftData collection model
├── ArtifactType.swift            # Type enum
├── NameValidator.swift           # Placeholder name validation
└── CleanupUtility.swift          # Cleanup UI and logic

ArtifactManagerTests/
├── ArtifactTypeTests.swift       # Type enum tests
├── FileSizeFormatterTests.swift  # Size formatting tests
└── NameValidatorTests.swift      # Validation tests
```

## Testing

All tests must pass before committing:
```bash
swift test
# Expected: ✔ Test run with 42 tests in 3 suites passed
```

## Recent Changes

### 2026-01-28: Full Feature Parity with Web Version
- Added NameValidator to prevent "Saving...", "Loading...", "Downloading..." names
- Added CleanupUtility with SwiftUI for scanning and fixing existing placeholders
- Validation in Item initializer and AddItemView
- Comprehensive test suite (42 tests total)
- **Full model expansion**:
  - Added SourceType enum (published/downloaded)
  - Added publishedUrl, artifactId for published artifacts
  - Added fileName, fileContent for downloaded artifacts
  - Added language, framework, claudeModel, conversationUrl, notes
  - Added collectionId, isFavorite
  - Added artifactCreatedAt timestamp
- Created Collection model with SwiftData
- Updated AddItemView and ItemDetailView with all fields
- ✅ Full feature parity with web version
