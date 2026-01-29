//
//  Item.swift
//  Artifact Manager
//
//  Created by John Brown on 1/23/26.
//

import Foundation
import SwiftData

enum SourceType: String, Codable, CaseIterable {
    case published = "published"
    case downloaded = "downloaded"
}

@Model
final class Item {
    var name: String
    var itemDescription: String
    var artifactType: ArtifactType
    var sourceType: SourceType

    // For published artifacts (claude.site URLs)
    var publishedUrl: String?
    var artifactId: String?

    // For downloaded artifacts
    var fileName: String?
    var filePath: String?
    var fileSize: Int64?
    var fileContent: String?

    // Metadata
    var language: String?
    var framework: String?
    var claudeModel: String?
    var conversationUrl: String?
    var notes: String?

    // Organization
    var collectionId: String?
    var isFavorite: Bool

    // Timestamps
    var createdAt: Date
    var modifiedAt: Date
    var artifactCreatedAt: Date?
    var tags: [String]

    // Keep timestamp for backwards compatibility during migration
    var timestamp: Date

    init(
        name: String,
        itemDescription: String = "",
        artifactType: ArtifactType = .file,
        sourceType: SourceType = .downloaded,
        publishedUrl: String? = nil,
        artifactId: String? = nil,
        fileName: String? = nil,
        filePath: String? = nil,
        fileSize: Int64? = nil,
        fileContent: String? = nil,
        language: String? = nil,
        framework: String? = nil,
        claudeModel: String? = nil,
        conversationUrl: String? = nil,
        notes: String? = nil,
        collectionId: String? = nil,
        isFavorite: Bool = false,
        artifactCreatedAt: Date? = nil,
        tags: [String] = []
    ) {
        // Sanitize name to prevent placeholder names
        self.name = NameValidator.sanitize(name)
        self.itemDescription = itemDescription
        self.artifactType = artifactType
        self.sourceType = sourceType
        self.publishedUrl = publishedUrl
        self.artifactId = artifactId
        self.fileName = fileName
        self.filePath = filePath
        self.fileSize = fileSize
        self.fileContent = fileContent
        self.language = language
        self.framework = framework
        self.claudeModel = claudeModel
        self.conversationUrl = conversationUrl
        self.notes = notes
        self.collectionId = collectionId
        self.isFavorite = isFavorite
        self.artifactCreatedAt = artifactCreatedAt
        self.tags = tags

        let now = Date()
        self.createdAt = now
        self.modifiedAt = now
        self.timestamp = now
    }

    var formattedFileSize: String? {
        guard let size = fileSize else { return nil }
        return FileSizeFormatter.format(size)
    }
}
