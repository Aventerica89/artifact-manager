// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "ArtifactManagerTests",
    platforms: [.macOS(.v14)],
    products: [],
    dependencies: [
        .package(url: "https://github.com/apple/swift-testing.git", branch: "main"),
    ],
    targets: [
        .target(
            name: "ArtifactManagerCore",
            path: "Artifact Manager",
            sources: ["ArtifactType.swift"]
        ),
        .testTarget(
            name: "ArtifactManagerTests",
            dependencies: [
                "ArtifactManagerCore",
                .product(name: "Testing", package: "swift-testing"),
            ],
            path: "ArtifactManagerTests"
        ),
    ]
)
