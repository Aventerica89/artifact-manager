//
//  NameValidator.swift
//  Artifact Manager
//
//  Created by Claude on 1/28/26.
//

import Foundation

struct NameValidator {
    // Common placeholder patterns to detect
    private static let placeholderPatterns = [
        "Saving...",
        "Loading...",
        "Untitled",
        "New Artifact",
        "Downloading...",
        ""
    ]

    static func isPlaceholder(_ name: String) -> Bool {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)

        // Check exact matches
        if placeholderPatterns.contains(trimmed) {
            return true
        }

        // Check for pattern matches (e.g., "Untitled 1", "Untitled 2")
        if trimmed.starts(with: "Untitled") {
            return true
        }

        // Check if name is only whitespace or empty
        if trimmed.isEmpty {
            return true
        }

        return false
    }

    static func sanitize(_ name: String, fallback: String = "Artifact") -> String {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)

        if isPlaceholder(trimmed) {
            return fallback
        }

        return trimmed
    }

    static func generateUniqueName(baseName: String = "Artifact", existingNames: [String]) -> String {
        var name = baseName
        var counter = 1

        while existingNames.contains(name) {
            counter += 1
            name = "\(baseName) \(counter)"
        }

        return name
    }
}
