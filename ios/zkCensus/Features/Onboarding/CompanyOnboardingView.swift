import SwiftUI

struct CompanyOnboardingView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @Environment(\.dismiss) var dismiss

    @State private var companyName = ""
    @State private var description = ""
    @State private var website = ""
    @State private var industry = ""
    @State private var selectedSize: CompanyPage.CompanySize?

    @State private var isLoading = false
    @State private var showError = false
    @State private var errorMessage = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text("Create Company Profile")
                        .font(.title)
                        .fontWeight(.bold)

                    Text("Set up your company page to start creating census")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top)

                // Form Fields
                VStack(alignment: .leading, spacing: 20) {
                    // Company Name
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Company Name")
                            .font(.headline)
                        TextField("Enter company name", text: $companyName)
                            .textFieldStyle(.roundedBorder)
                    }

                    // Description
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Description")
                            .font(.headline)
                        TextEditor(text: $description)
                            .frame(height: 100)
                            .padding(8)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                    }

                    // Website
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Website (Optional)")
                            .font(.headline)
                        TextField("https://example.com", text: $website)
                            .textFieldStyle(.roundedBorder)
                            .textContentType(.URL)
                            .keyboardType(.URL)
                            .autocapitalization(.none)
                    }

                    // Industry
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Industry (Optional)")
                            .font(.headline)
                        TextField("e.g., Technology, Healthcare", text: $industry)
                            .textFieldStyle(.roundedBorder)
                    }

                    // Company Size
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Company Size (Optional)")
                            .font(.headline)

                        VStack(spacing: 8) {
                            ForEach([
                                CompanyPage.CompanySize.startup,
                                .small,
                                .medium,
                                .large,
                                .enterprise
                            ], id: \.self) { size in
                                Button {
                                    selectedSize = size
                                } label: {
                                    HStack {
                                        Text(size.displayName)
                                            .foregroundColor(.primary)
                                        Spacer()
                                        if selectedSize == size {
                                            Image(systemName: "checkmark.circle.fill")
                                                .foregroundColor(.blue)
                                        }
                                    }
                                    .padding()
                                    .background(selectedSize == size ? Color.blue.opacity(0.1) : Color.gray.opacity(0.05))
                                    .cornerRadius(8)
                                }
                            }
                        }
                    }
                }

                // Connect Wallet & Create Button
                Button(action: createCompanyProfile) {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        }
                        Text(isLoading ? "Creating Profile..." : "Connect Wallet & Create Profile")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isFormValid ? Color.blue : Color.gray)
                    .cornerRadius(12)
                }
                .disabled(!isFormValid || isLoading)

                // Info Box
                InfoBox(
                    icon: "info.circle.fill",
                    title: "Verification Process",
                    message: "Your company will be verified before you can create census. This usually takes 1-2 business days."
                )
            }
            .padding()
        }
        .navigationBarTitleDisplayMode(.inline)
        .alert("Error", isPresented: $showError) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(errorMessage)
        }
    }

    private var isFormValid: Bool {
        !companyName.isEmpty && description.count >= 10
    }

    private func createCompanyProfile() {
        isLoading = true

        Task {
            do {
                // First, sign in to connect wallet
                _ = try await authManager.signInAsCompany()

                // Complete onboarding
                try await authManager.completeCompanyOnboarding(
                    companyName: companyName,
                    description: description,
                    website: website.isEmpty ? nil : website,
                    industry: industry.isEmpty ? nil : industry,
                    size: selectedSize
                )

                await MainActor.run {
                    isLoading = false
                    // Navigation will happen automatically via authManager state change
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
}

// MARK: - Info Box Component

struct InfoBox: View {
    let icon: String
    let title: String
    let message: String
    var color: Color = .blue

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title3)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.primary)

                Text(message)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

#Preview {
    NavigationStack {
        CompanyOnboardingView()
            .environmentObject(AuthenticationManager.shared)
    }
}
