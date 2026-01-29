//
//  ImportExport.swift
//  Artifact Manager
//
//  Created by Claude Code on 1/28/26.
//

import Foundation
import SwiftData

struct ExportData: Codable {
    let version: Int
    let exported_at: String
    let collections: [ExportCollection]
    let artifacts: [ExportArtifact]
}

struct ExportCollection: Codable {
    let name: String
    let slug: String
    let description: String?
    let color: String
    let icon: String
}

struct ExportArtifact: Codable {
    let name: String
    let description: String?
    let artifact_type: String
    let source_type: String
    let published_url: String?
    let artifact_id: String?
    let file_name: String?
    let file_size: Int64?
    let file_content: String?
    let language: String?
    let framework: String?
    let claude_model: String?
    let conversation_url: String?
    let notes: String?
    let collection_slug: String?
    let is_favorite: Bool?
    let artifact_created_at: String?
    let created_at: String
    let tags: [String]
}

class ImportExportService {

    /// Import artifacts from JSON file exported from web app
    static func importFromJSON(url: URL, modelContext: ModelContext) throws -> (imported: Int, skipped: Int) {
        let data = try Data(contentsOf: url)
        let exportData = try JSONDecoder().decode(ExportData.self, from: data)

        var imported = 0
        var skipped = 0
        var collectionMap: [String: String] = [:]

        // Import collections first
        for exportCol in exportData.collections {
            // Check if collection already exists
            let descriptor = FetchDescriptor<Collection>(
                predicate: #Predicate { $0.slug == exportCol.slug }
            )
            let existing = try? modelContext.fetch(descriptor)

            if existing?.isEmpty ?? true {
                let collection = Collection(
                    name: exportCol.name,
                    slug: exportCol.slug,
                    collectionDescription: exportCol.description,
                    color: exportCol.color,
                    icon: exportCol.icon
                )
                modelContext.insert(collection)
                collectionMap[exportCol.slug] = collection.id
            } else if let existing = existing?.first {
                collectionMap[exportCol.slug] = existing.id
            }
        }

        // Save collections first
        try modelContext.save()

        // Import artifacts
        for exportArtifact in exportData.artifacts {
            // Check if artifact already exists (by name)
            let descriptor = FetchDescriptor<Item>(
                predicate: #Predicate { $0.name == exportArtifact.name }
            )
            let existing = try? modelContext.fetch(descriptor)

            if !(existing?.isEmpty ?? true) {
                skipped += 1
                continue
            }

            // Map collection
            let collectionId: String? = if let slug = exportArtifact.collection_slug {
                collectionMap[slug]
            } else {
                nil
            }

            // Parse artifact type
            let artifactType = ArtifactType(rawValue: exportArtifact.artifact_type) ?? .file

            // Parse source type
            let sourceType = SourceType(rawValue: exportArtifact.source_type) ?? .downloaded

            // Parse artifact_created_at date
            let artifactCreatedAt: Date? = if let dateStr = exportArtifact.artifact_created_at {
                ISO8601DateFormatter().date(from: dateStr)
            } else {
                nil
            }

            let item = Item(
                name: exportArtifact.name,
                itemDescription: exportArtifact.description ?? "",
                artifactType: artifactType,
                sourceType: sourceType,
                publishedUrl: exportArtifact.published_url,
                artifactId: exportArtifact.artifact_id,
                fileName: exportArtifact.file_name,
                fileSize: exportArtifact.file_size,
                fileContent: exportArtifact.file_content,
                language: exportArtifact.language,
                conversationUrl: exportArtifact.conversation_url,
                notes: exportArtifact.notes,
                collectionId: collectionId,
                isFavorite: exportArtifact.is_favorite ?? false,
                artifactCreatedAt: artifactCreatedAt,
                tags: exportArtifact.tags
            )

            modelContext.insert(item)
            imported += 1
        }

        try modelContext.save()

        return (imported: imported, skipped: skipped)
    }
}
