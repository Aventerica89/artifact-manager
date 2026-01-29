//
//  ContentView.swift
//  Artifact Manager
//
//  Created by John Brown on 1/23/26.
//

import SwiftUI
import SwiftData
import UniformTypeIdentifiers

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Item.modifiedAt, order: .reverse) private var items: [Item]
    @State private var selectedItem: Item?
    @State private var showingAddSheet = false
    @State private var showingCleanupUtility = false
    @State private var showingImporter = false
    @State private var importResult: (imported: Int, skipped: Int)?
    @State private var importError: String?

    var body: some View {
        NavigationSplitView {
            List(selection: $selectedItem) {
                ForEach(items) { item in
                    NavigationLink(value: item) {
                        ItemRowView(item: item)
                    }
                    .listRowBackground(Color.appBackground)
                    .listRowSeparator(.hidden)
                    .listRowInsets(EdgeInsets(top: 4, leading: 8, bottom: 4, trailing: 8))
                }
                .onDelete(perform: deleteItems)
            }
            .scrollContentBackground(.hidden)
            .background(Color.appBackground)
            .navigationSplitViewColumnWidth(min: 280, ideal: 320)
            .toolbar {
                ToolbarItem {
                    Button(action: { showingAddSheet = true }) {
                        Label("Add Artifact", systemImage: "plus")
                    }
                    .buttonStyle(GradientButtonStyle())
                }
                ToolbarItem {
                    Menu {
                        Button(action: { showingImporter = true }) {
                            Label("Import from Web App", systemImage: "square.and.arrow.down")
                        }
                        Button(action: { showingCleanupUtility = true }) {
                            Label("Cleanup Placeholder Names", systemImage: "wand.and.stars")
                        }
                    } label: {
                        Label("More", systemImage: "ellipsis.circle")
                    }
                }
            }
        } detail: {
            if let item = selectedItem {
                ItemDetailView(item: item)
                    .background(Color.appBackground)
            } else {
                ContentUnavailableView(
                    "No Artifact Selected",
                    systemImage: "archivebox",
                    description: Text("Select an artifact from the sidebar to view its details.")
                )
                .foregroundStyle(.white)
                .background(Color.appBackground)
            }
        }
        .preferredColorScheme(.dark)
        .sheet(isPresented: $showingAddSheet) {
            AddItemView(modelContext: modelContext)
        }
        .sheet(isPresented: $showingCleanupUtility) {
            CleanupUtilityView()
        }
        .fileImporter(
            isPresented: $showingImporter,
            allowedContentTypes: [.json],
            allowsMultipleSelection: false
        ) { result in
            handleImport(result: result)
        }
        .alert("Import Complete", isPresented: .constant(importResult != nil), actions: {
            Button("OK") {
                importResult = nil
            }
        }, message: {
            if let result = importResult {
                Text("Imported \(result.imported) artifacts.\nSkipped \(result.skipped) duplicates.")
            }
        })
        .alert("Import Error", isPresented: .constant(importError != nil), actions: {
            Button("OK") {
                importError = nil
            }
        }, message: {
            if let error = importError {
                Text(error)
            }
        })
    }

    private func deleteItems(offsets: IndexSet) {
        withAnimation {
            for index in offsets.sorted().reversed() {
                guard index < items.count else { continue }
                let item = items[index]
                if selectedItem == item {
                    selectedItem = nil
                }
                modelContext.delete(item)
            }
        }
    }

    private func handleImport(result: Result<[URL], Error>) {
        do {
            guard let url = try result.get().first else { return }

            // Start accessing security-scoped resource
            guard url.startAccessingSecurityScopedResource() else {
                importError = "Unable to access file"
                return
            }
            defer { url.stopAccessingSecurityScopedResource() }

            let result = try ImportExportService.importFromJSON(url: url, modelContext: modelContext)
            importResult = result
        } catch {
            importError = "Import failed: \(error.localizedDescription)"
        }
    }
}

struct ItemRowView: View {
    let item: Item

    var body: some View {
        HStack(spacing: 12) {
            // Icon with gradient background
            ZStack {
                AppGradients.indigoViolet
                    .frame(width: 36, height: 36)
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                Image(systemName: item.artifactType.systemImage)
                    .font(.system(size: 16))
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(item.name)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.primary)
                        .lineLimit(1)

                    if item.isFavorite {
                        Image(systemName: "star.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(Color.amber)
                    }
                }

                HStack(spacing: 8) {
                    Label(item.artifactType.rawValue, systemImage: "")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.mutedForeground)
                        .labelStyle(.titleOnly)

                    if let size = item.formattedFileSize {
                        Text("•")
                            .foregroundStyle(Color.mutedForeground.opacity(0.5))
                            .font(.system(size: 11))
                        Text(size)
                            .font(.system(size: 11))
                            .foregroundStyle(Color.mutedForeground)
                    }
                }
            }

            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.cardBackground)
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.border, lineWidth: 1)
        )
    }
}

struct ItemDetailView: View {
    @Bindable var item: Item

    var body: some View {
        Form {
            Section("Basic Info") {
                LabeledContent("Name") {
                    TextField("Name", text: $item.name)
                        .textFieldStyle(.plain)
                        .multilineTextAlignment(.trailing)
                }

                Picker("Source", selection: $item.sourceType) {
                    Text("Published").tag(SourceType.published)
                    Text("Downloaded").tag(SourceType.downloaded)
                }

                Picker("Type", selection: $item.artifactType) {
                    ForEach(ArtifactType.allCases, id: \.self) { type in
                        Label(type.rawValue, systemImage: type.systemImage)
                            .tag(type)
                    }
                }
            }

            if item.sourceType == .published {
                Section("Published Artifact") {
                    if let url = item.publishedUrl, !url.isEmpty {
                        LabeledContent("URL") {
                            Link(url, destination: URL(string: url) ?? URL(string: "about:blank")!)
                                .font(.caption)
                        }
                    }
                    if let id = item.artifactId, !id.isEmpty {
                        LabeledContent("Artifact ID", value: id)
                    }
                }
            } else {
                Section("Downloaded Artifact") {
                    if let fileName = item.fileName, !fileName.isEmpty {
                        LabeledContent("File Name", value: fileName)
                    }
                    if let path = item.filePath, !path.isEmpty {
                        LabeledContent("Path", value: path)
                    }
                    if let size = item.formattedFileSize {
                        LabeledContent("Size", value: size)
                    }
                }
            }

            Section("Description") {
                TextEditor(text: $item.itemDescription)
                .frame(minHeight: 100)
            }

            Section("Metadata") {
                if let language = item.language, !language.isEmpty {
                    LabeledContent("Language", value: language)
                }
                if let framework = item.framework, !framework.isEmpty {
                    LabeledContent("Framework", value: framework)
                }
                if let model = item.claudeModel, !model.isEmpty {
                    LabeledContent("Claude Model", value: model)
                }
                if let convUrl = item.conversationUrl, !convUrl.isEmpty {
                    LabeledContent("Conversation") {
                        Link("View", destination: URL(string: convUrl) ?? URL(string: "about:blank")!)
                    }
                }
            }

            Section("Tags") {
                if item.tags.isEmpty {
                    Text("No tags")
                        .foregroundStyle(.secondary)
                } else {
                    FlowLayout(spacing: 8) {
                        ForEach(item.tags, id: \.self) { tag in
                            Text(tag)
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(.secondary.opacity(0.2))
                                .clipShape(Capsule())
                        }
                    }
                }
            }

            if let notes = item.notes, !notes.isEmpty {
                Section("Notes") {
                    TextEditor(text: Binding(
                        get: { item.notes ?? "" },
                        set: { item.notes = $0.isEmpty ? nil : $0 }
                    ))
                    .frame(minHeight: 60)
                }
            }

            Section("Timestamps") {
                LabeledContent("Created", value: item.createdAt.formatted(date: .abbreviated, time: .shortened))
                LabeledContent("Modified", value: item.modifiedAt.formatted(date: .abbreviated, time: .shortened))
                if let artifactDate = item.artifactCreatedAt {
                    LabeledContent("Artifact Created", value: artifactDate.formatted(date: .abbreviated, time: .shortened))
                }
            }
        }
        .formStyle(.grouped)
        .scrollContentBackground(.hidden)
        .background(Color.appBackground)
        .navigationTitle(item.name)
        .onChange(of: item.name) { _, _ in
            item.modifiedAt = Date()
        }
        .onChange(of: item.itemDescription) { _, _ in
            item.modifiedAt = Date()
        }
        .onChange(of: item.artifactType) { _, _ in
            item.modifiedAt = Date()
        }
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(in: proposal.width ?? 0, subviews: subviews, spacing: spacing)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(in: bounds.width, subviews: subviews, spacing: spacing)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.positions[index].x,
                                      y: bounds.minY + result.positions[index].y),
                         proposal: .unspecified)
        }
    }

    struct FlowResult {
        var size: CGSize = .zero
        var positions: [CGPoint] = []

        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var lineHeight: CGFloat = 0

            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)

                if currentX + size.width > maxWidth, currentX > 0 {
                    currentX = 0
                    currentY += lineHeight + spacing
                    lineHeight = 0
                }

                positions.append(CGPoint(x: currentX, y: currentY))
                lineHeight = max(lineHeight, size.height)
                currentX += size.width + spacing
                self.size.width = max(self.size.width, currentX)
            }

            self.size.height = currentY + lineHeight
        }
    }
}

struct AddItemView: View {
    let modelContext: ModelContext
    @Environment(\.dismiss) private var dismiss
    @Query private var collections: [Collection]

    @State private var name = ""
    @State private var description = ""
    @State private var artifactType: ArtifactType = .file
    @State private var sourceType: SourceType = .downloaded
    @State private var tagsText = ""
    @State private var selectedCollectionId: String?

    // Published artifact fields
    @State private var publishedUrl = ""
    @State private var artifactId = ""

    // Downloaded artifact fields
    @State private var fileName = ""
    @State private var fileContent = ""

    // Metadata fields
    @State private var language = ""
    @State private var framework = ""
    @State private var conversationUrl = ""
    @State private var notes = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Basic Info") {
                    TextField("Name", text: $name)

                    Picker("Source", selection: $sourceType) {
                        Text("Published").tag(SourceType.published)
                        Text("Downloaded").tag(SourceType.downloaded)
                    }

                    Picker("Type", selection: $artifactType) {
                        ForEach(ArtifactType.allCases, id: \.self) { type in
                            Label(type.rawValue, systemImage: type.systemImage)
                                .tag(type)
                        }
                    }
                }

                if sourceType == .published {
                    Section("Published Artifact") {
                        TextField("Published URL", text: $publishedUrl)
                            .textContentType(.URL)
                        TextField("Artifact ID (optional)", text: $artifactId)
                    }
                } else {
                    Section("Downloaded Artifact") {
                        TextField("File Name", text: $fileName)
                        TextEditor(text: $fileContent)
                            .frame(minHeight: 100)
                            .font(.system(.body, design: .monospaced))
                    }
                }

                Section("Description") {
                    TextEditor(text: $description)
                        .frame(minHeight: 80)
                }

                Section("Organization") {
                    Picker("Collection", selection: $selectedCollectionId) {
                        Text("None").tag(nil as String?)
                        ForEach(collections) { collection in
                            Text(collection.name).tag(collection.id as String?)
                        }
                    }
                }

                Section("Metadata") {
                    TextField("Language/Framework", text: $language)
                    TextField("Conversation URL", text: $conversationUrl)
                        .textContentType(.URL)
                }

                Section("Tags") {
                    TextField("Tags (comma separated)", text: $tagsText)
                }

                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 60)
                }
            }
            .formStyle(.grouped)
            .scrollContentBackground(.hidden)
            .background(Color.appBackground)
            .navigationTitle("New Artifact")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        addItem()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
        .frame(minWidth: 500, minHeight: 600)
    }

    private func addItem() {
        let tags = tagsText
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }

        // Validate and sanitize the name
        let sanitizedName = NameValidator.sanitize(name)

        // Get existing names to ensure uniqueness
        let existingNames = (try? modelContext.fetch(FetchDescriptor<Item>())) ?? []
        let uniqueName = NameValidator.generateUniqueName(
            baseName: sanitizedName,
            existingNames: existingNames.map { $0.name }
        )

        let newItem = Item(
            name: uniqueName,
            itemDescription: description,
            artifactType: artifactType,
            sourceType: sourceType,
            publishedUrl: publishedUrl.isEmpty ? nil : publishedUrl,
            artifactId: artifactId.isEmpty ? nil : artifactId,
            fileName: fileName.isEmpty ? nil : fileName,
            fileContent: fileContent.isEmpty ? nil : fileContent,
            language: language.isEmpty ? nil : language,
            conversationUrl: conversationUrl.isEmpty ? nil : conversationUrl,
            notes: notes.isEmpty ? nil : notes,
            collectionId: selectedCollectionId,
            tags: tags
        )

        withAnimation {
            modelContext.insert(newItem)
        }
        dismiss()
    }
}

#Preview {
    ContentView()
        .modelContainer(for: Item.self, inMemory: true)
}
