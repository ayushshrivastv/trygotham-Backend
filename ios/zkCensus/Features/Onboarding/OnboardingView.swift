import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var showLoginOptions = false
    @State private var selectedUserType: UserType?
    @State private var isLoading = false
    @State private var showError = false
    @State private var errorMessage = ""

    var body: some View {
        NavigationStack {
            ZStack {
                // Background Image
                Image("onboarding")
                    .resizable()
                    .scaledToFill()
                    .ignoresSafeArea()

                // Overlay gradient for better text readability
                LinearGradient(
                    gradient: Gradient(colors: [Color.black.opacity(0.6), Color.black.opacity(0.3)]),
                    startPoint: .bottom,
                    endPoint: .top
                )
                .ignoresSafeArea()

                VStack(spacing: 0) {
                    Spacer()

                    // Main Content
                    if !showLoginOptions {
                        // Initial Landing View
                        initialView
                    } else {
                        // Login Options View
                        loginOptionsView
                    }

                    Spacer()

                    // Bottom Signup Link
                    if showLoginOptions {
                        signupPrompt
                            .padding(.bottom, 40)
                    }
                }
            }
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
        }
    }

    // Initial landing view with Login button
    private var initialView: some View {
        VStack(spacing: 32) {
            // App Title/Logo
            VStack(spacing: 16) {
                Image(systemName: "shield.checkmark.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.white)

                Text("zk-Census")
                    .font(.system(size: 42, weight: .bold))
                    .foregroundColor(.white)

                Text("Zero-Knowledge Identity Verification")
                    .font(.headline)
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            .padding(.bottom, 40)

            // Login Button
            Button(action: {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    showLoginOptions = true
                }
            }) {
                Text("Login")
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 18)
                    .background(Color.blue)
                    .cornerRadius(14)
            }
            .padding(.horizontal, 40)
        }
    }

    // Login options view with user type selection
    private var loginOptionsView: some View {
        VStack(spacing: 24) {
            Text("Choose your account type")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)

            VStack(spacing: 16) {
                // Company Option
                NavigationLink(destination: CompanyOnboardingView()) {
                    HStack {
                        Image(systemName: "building.2.fill")
                            .font(.title2)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Sign Up as Company")
                                .font(.headline)
                                .fontWeight(.semibold)
                            Text("Create census and verify members")
                                .font(.caption)
                                .opacity(0.8)
                        }

                        Spacer()

                        Image(systemName: "arrow.right")
                            .font(.body)
                    }
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.white.opacity(0.15))
                    .cornerRadius(14)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.white.opacity(0.3), lineWidth: 1)
                    )
                }

                // Individual Option
                NavigationLink(destination: UserOnboardingView()) {
                    HStack {
                        Image(systemName: "person.fill")
                            .font(.title2)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Continue as Individual")
                                .font(.headline)
                                .fontWeight(.semibold)
                            Text("Join census and share proofs")
                                .font(.caption)
                                .opacity(0.8)
                        }

                        Spacer()

                        Image(systemName: "arrow.right")
                            .font(.body)
                    }
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.white.opacity(0.15))
                    .cornerRadius(14)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.white.opacity(0.3), lineWidth: 1)
                    )
                }
            }
            .padding(.horizontal, 40)
        }
    }

    // Signup prompt at bottom
    private var signupPrompt: some View {
        HStack(spacing: 4) {
            Text("Don't have an account?")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.8))

            Button(action: {
                // Action for creating new account - can be same as login for now
                // or navigate to a separate signup flow if needed
            }) {
                Text("Create One Here")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .underline()
            }
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
        .environmentObject(SolanaService.shared)
}
