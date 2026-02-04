<p align="center">
  <img src="chrome-extension/icons/icon128.png" alt="Artifact Manager" width="128" height="128">
</p>

<h1 align="center">Artifact Manager</h1>

<p align="center">
  <strong>Track and organize your Claude.ai artifacts across all devices</strong>
</p>

<p align="center">
  <a href="#platforms">Platforms</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#development">Development</a>
</p>

---

## Overview

Artifact Manager provides a unified way to save, organize, and sync Claude.ai artifacts (code, documents, diagrams) across your devices. Never lose track of that useful code snippet or document again.

## Platforms

| Platform | Status | Description |
|----------|--------|-------------|
| [Chrome Extension](chrome-extension/) | Ready | Capture artifacts directly from claude.ai |
| [Safari Extension](safari-extension/) | Ready | Native Safari support for macOS/iOS |
| [macOS App](macos/) | Ready | Native SwiftUI app with SwiftData |
| [Web App](web/) | Ready | Cloudflare Worker with D1 database |
| [Mobile](mobile/) | In Progress | React Native/Expo app |

## Features

- **One-Click Save** - Capture artifacts directly from Claude.ai conversations
- **Cross-Platform Sync** - Access your artifacts from any device
- **Smart Organization** - Collections, tags, and favorites
- **Metadata Tracking** - Claude model, conversation URL, framework, language
- **Search** - Find artifacts by name, type, or content
- **Export** - Download artifacts in their original format

## Installation

### Browser Extension (Recommended)

**Chrome/Edge/Brave:**
1. Download the latest release from [Releases](../../releases)
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `chrome-extension` folder

**Safari:**
1. Open `safari-extension/Artifact Manager.xcodeproj` in Xcode
2. Build and run
3. Enable the extension in Safari Preferences > Extensions

### macOS App

```bash
cd macos
open "Artifact Manager.xcodeproj"
# Press Cmd+R to build and run
```

### Web App

```bash
cd web
npm install
wrangler dev      # Local development
wrangler deploy   # Deploy to Cloudflare
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│ Browser         │     │ Web App          │     │ macOS App   │
│ Extension       │────▶│ (Cloudflare D1)  │◀────│ (SwiftData) │
└─────────────────┘     └──────────────────┘     └─────────────┘
        │                        │
        └────────────────────────┘
              Artifact Sync
```

## Development

### Prerequisites

- Node.js 18+
- Xcode 15+ (for macOS/Safari)
- Wrangler CLI (`npm install -g wrangler`)

### Quick Start

```bash
# Clone the repo
git clone https://github.com/Aventerica89/artifact-manager.git
cd artifact-manager

# Run tests (macOS)
cd macos && swift test

# Start web app locally
cd web && wrangler dev

# Load extension in Chrome
# Go to chrome://extensions > Load unpacked > select chrome-extension/
```

## Documentation

- [Extension Changelog](https://docs.jbcloud.app/artifact-manager-extension/changelog)
- [macOS Architecture](https://docs.jbcloud.app/artifact-manager-mac/architecture)

## License

MIT
