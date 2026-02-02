//
//  CleanupUtility.swift
//  Artifact Manager
//
//  Created by Claude on 1/28/26.
//

import SwiftUI
import SwiftData

struct CleanupUtility {
    static func findPlaceholderArtifacts(in context: ModelContext) throws -> [Item] {
        let descriptor = FetchDescriptor<Item>()
        let allItems = try context.fetch(descriptor)

        return allItems.filter { item in
            NameValidator.isPlaceholder(item.name)
        }
    }

    static func cleanupPlaceholderArtifacts(in context: ModelContext) throws -> Int {
        let placeholderItems = try findPlaceholderArtifacts(in: context)
        let allItems = try context.fetch(FetchDescriptor<Item>())
        let existingNames = allItems.map { $0.name }

        var cleanedCount = 0

        for item in placeholderItems {
            // Generate a unique name based on the artifact type
            let baseName = item.artifactType.rawValue
            let uniqueName = NameValidator.generateUniqueName(
                baseName: baseName,
                existingNames: existingNames + [baseName]
            )

            item.name = uniqueName
            item.modifiedAt = Date()
            cleanedCount += 1
        }

        try context.save()
        return cleanedCount
    }
}

struct CleanupUtilityView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var placeholderItems: [Item] = []
    @State private var isLoading = true
    @State private var cleanupResult: Result<Int, Error>?
    @State private var showingConfirmation = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView("Scanning for placeholder names...")
                } else if placeholderItems.isEmpty {
                    ContentUnavailableView(
                        "No Issues Found",
                        systemImage: "checkmark.circle.fill",
                        description: Text("All artifacts have valid names.")
                    )
                } else {
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(.orange)
                                .font(.title2)

                            VStack(alignment: .leading) {
                                Text("Found \(placeholderItems.count) placeholder name\(placeholderItems.count == 1 ? "" : "s")")
                                    .font(.headline)
                                Text("These artifacts have temporary or invalid names")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding()
                        .background(.orange.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))

                        List(placeholderItems) { item in
                            HStack {
                                Image(systemName: item.artifactType.systemImage)
                                    .foregroundStyle(.secondary)

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(item.name.isEmpty ? "(empty)" : item.name)
                                        .font(.body)
                                        .foregroundStyle(item.name.isEmpty ? .tertiary : .primary)

                                    Text(item.artifactType.rawValue)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }

                                Spacer()

                                Image(systemName: "arrow.right")
                                    .foregroundStyle(.tertiary)

                                Text(item.artifactType.rawValue)
                                    .font(.caption)
                                    .foregroundStyle(.green)
                            }
                        }
                        .frame(maxHeight: 300)

                        Button(action: { showingConfirmation = true }) {
                            Label("Fix All Names", systemImage: "wand.and.stars")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)
                    }
                    .padding()
                }

                if let result = cleanupResult {
                    switch result {
                    case .success(let count):
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.green)
                            Text("Successfully fixed \(count) artifact\(count == 1 ? "" : "s")")
                        }
                        .padding()
                        .background(.green.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))

                    case .failure(let error):
                        HStack {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundStyle(.red)
                            Text("Error: \(error.localizedDescription)")
                        }
                        .padding()
                        .background(.red.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
            .navigationTitle("Cleanup Utility")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
            .confirmationDialog(
                "Fix Placeholder Names?",
                isPresented: $showingConfirmation,
                titleVisibility: .visible
            ) {
                Button("Fix All", role: .destructive) {
                    performCleanup()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This will rename \(placeholderItems.count) artifact\(placeholderItems.count == 1 ? "" : "s") with unique names based on their type.")
            }
        }
        .frame(minWidth: 500, minHeight: 400)
        .task {
            await scanForPlaceholders()
        }
    }

    private func scanForPlaceholders() async {
        do {
            placeholderItems = try CleanupUtility.findPlaceholderArtifacts(in: modelContext)
        } catch {
            cleanupResult = .failure(error)
        }
        isLoading = false
    }

    private func performCleanup() {
        do {
            let count = try CleanupUtility.cleanupPlaceholderArtifacts(in: modelContext)
            cleanupResult = .success(count)
            placeholderItems = []
        } catch {
            cleanupResult = .failure(error)
        }
    }
}

#Preview {
    CleanupUtilityView()
        .modelContainer(for: Item.self, inMemory: true)
}
