//
//  Item.swift
//  Artifact Manager
//
//  Created by John Brown on 1/23/26.
//

import Foundation
import SwiftData

@Model
final class Item {
    var name: String
    var itemDescription: String
    var artifactType: ArtifactType
    var filePath: String?
    var fileSize: Int64?
    var createdAt: Date
    var modifiedAt: Date
    var tags: [String]

    // Keep timestamp for backwards compatibility during migration
    var timestamp: Date

    init(
        name: String,
        itemDescription: String = "",
        artifactType: ArtifactType = .file,
        filePath: String? = nil,
        fileSize: Int64? = nil,
        tags: [String] = []
    ) {
        // Sanitize name to prevent placeholder names
        self.name = NameValidator.sanitize(name)
        self.itemDescription = itemDescription
        self.artifactType = artifactType
        self.filePath = filePath
        self.fileSize = fileSize
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
