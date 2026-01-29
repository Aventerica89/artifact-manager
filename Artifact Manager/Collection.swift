//
//  Collection.swift
//  Artifact Manager
//
//  Created by Claude on 1/28/26.
//

import Foundation
import SwiftData

@Model
final class Collection {
    var id: String
    var name: String
    var slug: String
    var collectionDescription: String?
    var color: String
    var icon: String
    var createdAt: Date

    init(
        id: String = UUID().uuidString,
        name: String,
        slug: String,
        collectionDescription: String? = nil,
        color: String = "#6366f1",
        icon: String = "folder"
    ) {
        self.id = id
        self.name = name
        self.slug = slug
        self.collectionDescription = collectionDescription
        self.color = color
        self.icon = icon
        self.createdAt = Date()
    }
}
