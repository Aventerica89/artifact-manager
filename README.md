<p align="center">
  <img src="assets/logo.svg" alt="Artifact Manager" width="128" height="128">
</p>

<h1 align="center">Artifact Manager</h1>

<p align="center">
  <strong>Track and organize your Claude.ai artifacts across all devices</strong>
</p>

<p align="center">
  <a href="https://github.com/Aventerica89/artifact-manager/stargazers"><img src="https://img.shields.io/github/stars/Aventerica89/artifact-manager?style=flat&color=6366f1" alt="Stars"></a>
  <a href="https://github.com/Aventerica89/artifact-manager/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <img src="https://img.shields.io/badge/macOS-13%2B-000000?logo=apple" alt="macOS">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white" alt="Chrome">
  <img src="https://img.shields.io/badge/Safari-Extension-006CFF?logo=safari&logoColor=white" alt="Safari">
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare">
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

<p align="center">
  <img src="https://img.shields.io/badge/Extension-v1.1.0-6366f1" alt="Extension v1.1.0">
  <img src="https://img.shields.io/badge/macOS-v1.0.0-6366f1" alt="macOS v1.0.0">
  <img src="https://img.shields.io/badge/42-tests%20passing-10b981" alt="Tests">
</p>

## Platforms

| Platform | Status | Description |
|----------|--------|-------------|
| [Chrome Extension](chrome-extension/) | ![Ready](https://img.shields.io/badge/-Ready-10b981) | Capture artifacts directly from claude.ai |
| [Safari Extension](safari-extension/) | ![Ready](https://img.shields.io/badge/-Ready-10b981) | Native Safari support for macOS/iOS |
| [macOS App](macos/) | ![Ready](https://img.shields.io/badge/-Ready-10b981) | Native SwiftUI app with SwiftData |
| [Web App](web/) | ![Ready](https://img.shields.io/badge/-Ready-10b981) | Cloudflare Worker with D1 database |
| [Mobile](mobile/) | ![In Progress](https://img.shields.io/badge/-In%20Progress-f59e0b) | React Native/Expo app |

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
