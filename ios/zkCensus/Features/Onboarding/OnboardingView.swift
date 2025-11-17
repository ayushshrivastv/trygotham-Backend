import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var selectedUserType: UserType?
    @State private var isLoading = false
    @State private var showError = false
    @State private var errorMessage = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Header
                headerView

                Spacer()

                // User Type Selection
                VStack(spacing: 24) {
                    Text("Choose your account type")
                        .font(.title2)
                        .fontWeight(.semibold)

                    VStack(spacing: 16) {
                        // Company Option
                        UserTypeCard(
                            userType: .company,
                            isSelected: selectedUserType == .company
                        ) {
                            selectedUserType = .company
                        }

                        // Individual Option
                        UserTypeCard(
                            userType: .individual,
                            isSelected: selectedUserType == .individual
                        ) {
                            selectedUserType = .individual
                        }
                    }
                    .padding(.horizontal)
                }

                Spacer()

                // Continue Button
                if let userType = selectedUserType {
                    NavigationLink(destination: destinationView(for: userType)) {
                        HStack {
                            Text("Continue as \(userType.displayName)")
                            Image(systemName: "arrow.right")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(12)
                        .padding(.horizontal)
                    }
                    .disabled(isLoading)
                }

                // Privacy Notice
                privacyNotice
            }
            .navigationTitle("Welcome to zk-Census")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
        }
    }

    private var headerView: some View {
        VStack(spacing: 16) {
            Image(systemName: "shield.checkmark.fill")
                .font(.system(size: 80))
                .foregroundColor(.blue)
                .padding(.top, 60)

            Text("Zero-Knowledge\nIdentity Verification")
                .font(.title)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)

            Text("Prove your identity without revealing personal information")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
    }

    private var privacyNotice: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: "lock.shield.fill")
                    .foregroundColor(.green)
                Text("Your passport data is never stored or transmitted")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            HStack {
                Image(systemName: "checkmark.shield.fill")
                    .foregroundColor(.green)
                Text("All verification happens on your device")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color.green.opacity(0.1))
        .cornerRadius(12)
        .padding()
    }

    @ViewBuilder
    private func destinationView(for userType: UserType) -> some View {
        if userType == .company {
            CompanyOnboardingView()
        } else {
            UserOnboardingView()
        }
    }
}

// MARK: - User Type Card

struct UserTypeCard: View {
    let userType: UserType
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: userType.icon)
                    .font(.system(size: 40))
                    .foregroundColor(isSelected ? .blue : .secondary)
                    .frame(width: 60, height: 60)
                    .background(isSelected ? Color.blue.opacity(0.1) : Color.gray.opacity(0.1))
                    .cornerRadius(12)

                VStack(alignment: .leading, spacing: 4) {
                    Text(userType.displayName)
                        .font(.headline)
                        .foregroundColor(.primary)

                    Text(userType == .company ?
                         "Create census and verify members" :
                         "Join census and share proofs")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.leading)
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.blue)
                        .font(.title2)
                }
            }
            .padding()
            .background(isSelected ? Color.blue.opacity(0.05) : Color.gray.opacity(0.05))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
            )
        }
    }
}

#Preview {
    OnboardingView()
        .environmentObject(AuthenticationManager.shared)
}
