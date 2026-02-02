//
//  Artifact_ManagerApp.swift
//  Artifact Manager
//
//  Created by John Brown on 1/23/26.
//

import SwiftUI
import SwiftData
import OSLog

private let logger = Logger(subsystem: "jbcloud.Artifact-Manager", category: "DataStore")

@main
struct Artifact_ManagerApp: App {
    @State private var showingError = false
    @State private var errorMessage = ""

    let sharedModelContainer: ModelContainer

    init() {
        let schema = Schema([
            Item.self,
            Collection.self,
        ])
        let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)

        do {
            sharedModelContainer = try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            logger.error("Failed to create persistent ModelContainer: \(error.localizedDescription)")

            // Fallback to in-memory storage so app remains functional
            do {
                let fallbackConfig = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
                sharedModelContainer = try ModelContainer(for: schema, configurations: [fallbackConfig])
                logger.warning("Using in-memory storage as fallback")
            } catch {
                // Last resort: create minimal container
                logger.critical("All storage options failed: \(error.localizedDescription)")
                sharedModelContainer = try! ModelContainer(for: Item.self, Collection.self)
            }
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .alert("Storage Error", isPresented: $showingError) {
                    Button("OK", role: .cancel) { }
                } message: {
                    Text(errorMessage)
                }
        }
        .modelContainer(sharedModelContainer)
    }
}
