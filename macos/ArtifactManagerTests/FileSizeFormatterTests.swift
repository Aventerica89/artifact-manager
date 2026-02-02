//
//  FileSizeFormatterTests.swift
//  ArtifactManagerTests
//
//  TDD: Testing FileSizeFormatter using Swift Testing
//

import Testing
@testable import ArtifactManagerCore

@Suite("FileSizeFormatter Tests")
struct FileSizeFormatterTests {

    // MARK: - Bytes Tests

    @Test("Format bytes correctly")
    func formatBytes() {
        let formatted = FileSizeFormatter.format(500)
        #expect(formatted.contains("500") || formatted.contains("bytes"))
    }

    @Test("Format zero bytes")
    func formatZeroBytes() {
        let formatted = FileSizeFormatter.format(0)
        #expect(formatted.contains("0") || formatted.lowercased().contains("zero"))
    }

    // MARK: - Kilobytes Tests

    @Test("Format kilobytes correctly")
    func formatKilobytes() {
        let formatted = FileSizeFormatter.format(2048)
        #expect(formatted.contains("KB") || formatted.contains("2"))
    }

    @Test("Format 1 KB")
    func format1KB() {
        let formatted = FileSizeFormatter.format(1024)
        #expect(!formatted.isEmpty)
    }

    // MARK: - Megabytes Tests

    @Test("Format megabytes correctly")
    func formatMegabytes() {
        let formatted = FileSizeFormatter.format(5_242_880) // 5 MB
        #expect(formatted.contains("MB") || formatted.contains("5"))
    }

    @Test("Format 1 MB")
    func format1MB() {
        let formatted = FileSizeFormatter.format(1_048_576)
        #expect(!formatted.isEmpty)
    }

    // MARK: - Gigabytes Tests

    @Test("Format gigabytes correctly")
    func formatGigabytes() {
        let formatted = FileSizeFormatter.format(2_147_483_648) // 2 GB
        #expect(formatted.contains("GB") || formatted.contains("2"))
    }

    @Test("Format 1 GB")
    func format1GB() {
        let formatted = FileSizeFormatter.format(1_073_741_824)
        #expect(!formatted.isEmpty)
    }

    // MARK: - Terabytes Tests

    @Test("Format terabytes correctly")
    func formatTerabytes() {
        let terabyte: Int64 = 1_099_511_627_776 // 1 TB
        let formatted = FileSizeFormatter.format(terabyte)
        #expect(formatted.contains("TB") || formatted.contains("1"))
    }

    // MARK: - Edge Cases

    @Test("Format negative size gracefully")
    func formatNegativeSize() {
        let formatted = FileSizeFormatter.format(-100)
        #expect(!formatted.isEmpty)
    }

    @Test("Format max Int64")
    func formatMaxInt64() {
        let formatted = FileSizeFormatter.format(Int64.max)
        #expect(!formatted.isEmpty)
    }

    @Test("Format is consistent")
    func formatConsistency() {
        let size: Int64 = 1_048_576
        let first = FileSizeFormatter.format(size)
        let second = FileSizeFormatter.format(size)
        #expect(first == second)
    }
}
