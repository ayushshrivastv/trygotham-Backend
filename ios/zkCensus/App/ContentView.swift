import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthenticationManager

    var body: some View {
        Group {
            if authManager.isAuthenticated {
                // Show appropriate dashboard based on user type
                if authManager.userType == .company {
                    CompanyDashboardView()
                } else {
                    UserDashboardView()
                }
            } else {
                // Show onboarding
                OnboardingView()
            }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthenticationManager.shared)
        .environmentObject(SolanaService.shared)
}
