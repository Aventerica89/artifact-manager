//
//  ArtifactTypeTests.swift
//  ArtifactManagerTests
//
//  TDD: Testing ArtifactType enum using Swift Testing
//

import Foundation
import Testing
@testable import ArtifactManagerCore

@Suite("ArtifactType Tests")
struct ArtifactTypeTests {

    // MARK: - All Cases Tests

    @Test("All artifact type cases exist")
    func allCasesExist() {
        let allCases = ArtifactType.allCases
        #expect(allCases.count == 6)
        #expect(allCases.contains(.file))
        #expect(allCases.contains(.image))
        #expect(allCases.contains(.document))
        #expect(allCases.contains(.code))
        #expect(allCases.contains(.archive))
        #expect(allCases.contains(.other))
    }

    // MARK: - Raw Value Tests

    @Test("Raw values are correct")
    func rawValues() {
        #expect(ArtifactType.file.rawValue == "File")
        #expect(ArtifactType.image.rawValue == "Image")
        #expect(ArtifactType.document.rawValue == "Document")
        #expect(ArtifactType.code.rawValue == "Code")
        #expect(ArtifactType.archive.rawValue == "Archive")
        #expect(ArtifactType.other.rawValue == "Other")
    }

    @Test("Init from raw value works")
    func initFromRawValue() {
        #expect(ArtifactType(rawValue: "File") == .file)
        #expect(ArtifactType(rawValue: "Image") == .image)
        #expect(ArtifactType(rawValue: "Document") == .document)
        #expect(ArtifactType(rawValue: "Code") == .code)
        #expect(ArtifactType(rawValue: "Archive") == .archive)
        #expect(ArtifactType(rawValue: "Other") == .other)
        #expect(ArtifactType(rawValue: "Invalid") == nil)
    }

    // MARK: - System Image Tests

    @Test("System image for file type")
    func systemImageForFile() {
        #expect(ArtifactType.file.systemImage == "doc")
    }

    @Test("System image for image type")
    func systemImageForImage() {
        #expect(ArtifactType.image.systemImage == "photo")
    }

    @Test("System image for document type")
    func systemImageForDocument() {
        #expect(ArtifactType.document.systemImage == "doc.text")
    }

    @Test("System image for code type")
    func systemImageForCode() {
        #expect(ArtifactType.code.systemImage == "chevron.left.forwardslash.chevron.right")
    }

    @Test("System image for archive type")
    func systemImageForArchive() {
        #expect(ArtifactType.archive.systemImage == "archivebox")
    }

    @Test("System image for other type")
    func systemImageForOther() {
        #expect(ArtifactType.other.systemImage == "questionmark.folder")
    }

    @Test("All cases have non-empty system images")
    func allCasesHaveSystemImages() {
        for artifactType in ArtifactType.allCases {
            #expect(!artifactType.systemImage.isEmpty)
        }
    }

    // MARK: - Codable Tests

    @Test("Encode and decode preserves value")
    func encodeDecode() throws {
        let encoder = JSONEncoder()
        let decoder = JSONDecoder()

        for originalType in ArtifactType.allCases {
            let data = try encoder.encode(originalType)
            let decoded = try decoder.decode(ArtifactType.self, from: data)
            #expect(decoded == originalType)
        }
    }

    @Test("Decode from JSON string")
    func decodeFromJSON() throws {
        let decoder = JSONDecoder()

        let fileData = "\"File\"".data(using: .utf8)!
        let fileType = try decoder.decode(ArtifactType.self, from: fileData)
        #expect(fileType == .file)

        let codeData = "\"Code\"".data(using: .utf8)!
        let codeType = try decoder.decode(ArtifactType.self, from: codeData)
        #expect(codeType == .code)
    }

    @Test("Decode invalid JSON throws")
    func decodeInvalidJSON() {
        let decoder = JSONDecoder()
        let invalidData = "\"InvalidType\"".data(using: .utf8)!

        #expect(throws: DecodingError.self) {
            _ = try decoder.decode(ArtifactType.self, from: invalidData)
        }
    }

    // MARK: - Equality Tests

    @Test("Equality works correctly")
    func equality() {
        #expect(ArtifactType.file == ArtifactType.file)
        #expect(ArtifactType.file != ArtifactType.image)
    }

    @Test("Hashable allows use in Set")
    func hashable() {
        var set = Set<ArtifactType>()
        set.insert(.file)
        set.insert(.file) // Duplicate
        set.insert(.image)

        #expect(set.count == 2)
        #expect(set.contains(.file))
        #expect(set.contains(.image))
    }
}
