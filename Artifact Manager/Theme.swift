//
//  Theme.swift
//  Artifact Manager
//
//  Created by Claude Code on 1/28/26.
//

import SwiftUI

extension Color {
    // Primary colors matching web app
    static let appBackground = Color(hex: "09090b")
    static let cardBackground = Color(hex: "18181b")
    static let cardForeground = Color(hex: "fafafa")
    static let secondary = Color(hex: "27272a")
    static let mutedForeground = Color(hex: "a1a1aa")
    static let border = Color(hex: "27272a")

    // Accent colors
    static let indigo = Color(hex: "6366f1")
    static let violet = Color(hex: "8b5cf6")
    static let emerald = Color(hex: "10b981")
    static let amber = Color(hex: "f59e0b")
    static let rose = Color(hex: "f43f5e")

    // Convenience hex initializer
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// Gradient styles
struct AppGradients {
    static let indigoViolet = LinearGradient(
        colors: [.indigo, .violet],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let emeraldCyan = LinearGradient(
        colors: [.emerald, Color(hex: "06b6d4")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let subtleGlow = LinearGradient(
        colors: [.indigo.opacity(0.1), .violet.opacity(0.05)],
        startPoint: .top,
        endPoint: .bottom
    )
}

// View modifiers for consistent styling
struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(Color.cardBackground)
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.2), radius: 8, x: 0, y: 2)
    }
}

struct GlowingCardStyle: ViewModifier {
    @State private var isHovered = false

    func body(content: Content) -> some View {
        content
            .background(Color.cardBackground)
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.2), radius: 8, x: 0, y: 2)
            .shadow(color: .indigo.opacity(isHovered ? 0.3 : 0), radius: 16, x: 0, y: 4)
            .scaleEffect(isHovered ? 1.02 : 1.0)
            .animation(.spring(response: 0.3), value: isHovered)
            .onHover { hovering in
                isHovered = hovering
            }
    }
}

struct GradientButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(AppGradients.indigoViolet)
            .foregroundColor(.white)
            .cornerRadius(8)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.spring(response: 0.3), value: configuration.isPressed)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }

    func glowingCardStyle() -> some View {
        modifier(GlowingCardStyle())
    }
}
