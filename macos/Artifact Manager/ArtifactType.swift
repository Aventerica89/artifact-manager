//
//  ArtifactType.swift
//  Artifact Manager
//
//  Separated for testability
//

import Foundation

public enum ArtifactType: String, Codable, CaseIterable, Sendable {
    case file = "File"
    case image = "Image"
    case document = "Document"
    case code = "Code"
    case archive = "Archive"
    case other = "Other"

    public var systemImage: String {
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

// MARK: - File Size Formatting

public struct FileSizeFormatter {
    public static func format(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useAll]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }
}
