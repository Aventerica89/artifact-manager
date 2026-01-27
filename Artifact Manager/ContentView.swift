//
//  ContentView.swift
//  Artifact Manager
//
//  Created by John Brown on 1/23/26.
//

import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Item.modifiedAt, order: .reverse) private var items: [Item]
    @State private var selectedItem: Item?
    @State private var showingAddSheet = false

    var body: some View {
        NavigationSplitView {
            List(selection: $selectedItem) {
                ForEach(items) { item in
                    NavigationLink(value: item) {
                        ItemRowView(item: item)
                    }
                }
                .onDelete(perform: deleteItems)
            }
            .navigationSplitViewColumnWidth(min: 200, ideal: 250)
            .toolbar {
                ToolbarItem {
                    Button(action: { showingAddSheet = true }) {
                        Label("Add Artifact", systemImage: "plus")
                    }
                }
            }
        } detail: {
            if let item = selectedItem {
                ItemDetailView(item: item)
            } else {
                ContentUnavailableView(
                    "No Artifact Selected",
                    systemImage: "archivebox",
                    description: Text("Select an artifact from the sidebar to view its details.")
                )
            }
        }
        .sheet(isPresented: $showingAddSheet) {
            AddItemView(modelContext: modelContext)
        }
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
}

struct ItemRowView: View {
    let item: Item

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: item.artifactType.systemImage)
                .font(.title2)
                .foregroundStyle(.secondary)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(item.name)
                    .font(.headline)
                    .lineLimit(1)

                HStack(spacing: 8) {
                    Text(item.artifactType.rawValue)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if let size = item.formattedFileSize {
                        Text(size)
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct ItemDetailView: View {
    @Bindable var item: Item

    var body: some View {
        Form {
            Section("Details") {
                LabeledContent("Name") {
                    TextField("Name", text: $item.name)
                        .textFieldStyle(.plain)
                        .multilineTextAlignment(.trailing)
                }

                Picker("Type", selection: $item.artifactType) {
                    ForEach(ArtifactType.allCases, id: \.self) { type in
                        Label(type.rawValue, systemImage: type.systemImage)
                            .tag(type)
                    }
                }

                if let path = item.filePath, !path.isEmpty {
                    LabeledContent("Path", value: path)
                }

                if let size = item.formattedFileSize {
                    LabeledContent("Size", value: size)
                }
            }

            Section("Description") {
                TextEditor(text: $item.itemDescription)
                    .frame(minHeight: 100)
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

            Section("Timestamps") {
                LabeledContent("Created", value: item.createdAt.formatted(date: .abbreviated, time: .shortened))
                LabeledContent("Modified", value: item.modifiedAt.formatted(date: .abbreviated, time: .shortened))
            }
        }
        .formStyle(.grouped)
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

    @State private var name = ""
    @State private var description = ""
    @State private var artifactType: ArtifactType = .file
    @State private var tagsText = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Basic Info") {
                    TextField("Name", text: $name)

                    Picker("Type", selection: $artifactType) {
                        ForEach(ArtifactType.allCases, id: \.self) { type in
                            Label(type.rawValue, systemImage: type.systemImage)
                                .tag(type)
                        }
                    }
                }

                Section("Description") {
                    TextEditor(text: $description)
                        .frame(minHeight: 80)
                }

                Section("Tags") {
                    TextField("Tags (comma separated)", text: $tagsText)
                }
            }
            .formStyle(.grouped)
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
        .frame(minWidth: 400, minHeight: 350)
    }

    private func addItem() {
        let tags = tagsText
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }

        let newItem = Item(
            name: name.trimmingCharacters(in: .whitespaces),
            itemDescription: description,
            artifactType: artifactType,
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
