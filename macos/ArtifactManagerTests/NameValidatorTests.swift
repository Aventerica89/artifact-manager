//
//  NameValidatorTests.swift
//  Artifact Manager
//
//  Created by Claude on 1/28/26.
//

import Testing
@testable import ArtifactManagerCore

struct NameValidatorTests {

    @Test("Detect 'Saving...' as placeholder")
    func detectSavingAsPlaceholder() {
        #expect(NameValidator.isPlaceholder("Saving..."))
    }

    @Test("Detect 'Loading...' as placeholder")
    func detectLoadingAsPlaceholder() {
        #expect(NameValidator.isPlaceholder("Loading..."))
    }

    @Test("Detect 'Downloading...' as placeholder")
    func detectDownloadingAsPlaceholder() {
        #expect(NameValidator.isPlaceholder("Downloading..."))
    }

    @Test("Detect 'Untitled' as placeholder")
    func detectUntitledAsPlaceholder() {
        #expect(NameValidator.isPlaceholder("Untitled"))
        #expect(NameValidator.isPlaceholder("Untitled 1"))
        #expect(NameValidator.isPlaceholder("Untitled 42"))
    }

    @Test("Detect empty string as placeholder")
    func detectEmptyAsPlaceholder() {
        #expect(NameValidator.isPlaceholder(""))
        #expect(NameValidator.isPlaceholder("   "))
        #expect(NameValidator.isPlaceholder("\t\n"))
    }

    @Test("Valid names are not placeholders")
    func validNamesNotPlaceholders() {
        #expect(!NameValidator.isPlaceholder("My Document"))
        #expect(!NameValidator.isPlaceholder("Project Notes"))
        #expect(!NameValidator.isPlaceholder("code.swift"))
        #expect(!NameValidator.isPlaceholder("README.md"))
    }

    @Test("Sanitize placeholder names to fallback")
    func sanitizePlaceholderNames() {
        #expect(NameValidator.sanitize("Saving...") == "Artifact")
        #expect(NameValidator.sanitize("Loading...") == "Artifact")
        #expect(NameValidator.sanitize("") == "Artifact")
    }

    @Test("Sanitize with custom fallback")
    func sanitizeWithCustomFallback() {
        #expect(NameValidator.sanitize("Saving...", fallback: "Document") == "Document")
        #expect(NameValidator.sanitize("", fallback: "File") == "File")
    }

    @Test("Sanitize valid names returns unchanged")
    func sanitizeValidNames() {
        #expect(NameValidator.sanitize("Valid Name") == "Valid Name")
        #expect(NameValidator.sanitize("  Trimmed  ") == "Trimmed")
    }

    @Test("Generate unique name with no conflicts")
    func generateUniqueNameNoConflicts() {
        let name = NameValidator.generateUniqueName(baseName: "Document", existingNames: [])
        #expect(name == "Document")
    }

    @Test("Generate unique name with single conflict")
    func generateUniqueNameSingleConflict() {
        let name = NameValidator.generateUniqueName(
            baseName: "Document",
            existingNames: ["Document"]
        )
        #expect(name == "Document 2")
    }

    @Test("Generate unique name with multiple conflicts")
    func generateUniqueNameMultipleConflicts() {
        let name = NameValidator.generateUniqueName(
            baseName: "Document",
            existingNames: ["Document", "Document 2", "Document 3"]
        )
        #expect(name == "Document 4")
    }

    @Test("Generate unique name handles non-sequential conflicts")
    func generateUniqueNameNonSequential() {
        let name = NameValidator.generateUniqueName(
            baseName: "File",
            existingNames: ["File", "File 2", "File 5", "File 10"]
        )
        #expect(name == "File 3")
    }

    @Test("Case sensitivity in placeholder detection")
    func caseSensitivity() {
        // These should all be detected as placeholders
        #expect(NameValidator.isPlaceholder("Saving..."))

        // These are valid names (different case/format)
        #expect(!NameValidator.isPlaceholder("SAVING..."))
        #expect(!NameValidator.isPlaceholder("saving..."))
    }

    @Test("Whitespace handling")
    func whitespaceHandling() {
        #expect(NameValidator.isPlaceholder("  Saving...  "))
        #expect(NameValidator.isPlaceholder("  Untitled  "))
        #expect(NameValidator.sanitize("  Valid Name  ") == "Valid Name")
    }
}
