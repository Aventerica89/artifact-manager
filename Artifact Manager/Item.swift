//
//  Item.swift
//  Artifact Manager
//
//  Created by John Brown on 1/23/26.
//

import Foundation
import SwiftData

enum ArtifactType: String, Codable, CaseIterable {
    case file = "File"
    case image = "Image"
    case document = "Document"
    case code = "Code"
    case archive = "Archive"
    case other = "Other"

    var systemImage: String {
        switch self {
        case .file: return "doc"
        case .image: return "photo"
        case .document: return "doc.text"
        case .code: return "chevron.left.forwardslash.chevron.right"
        case .archive: return "archivebox"
        case .other: return "questionmark.folder"
        }
    }
}

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
        self.name = name
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
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useAll]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: size)
    }
}
