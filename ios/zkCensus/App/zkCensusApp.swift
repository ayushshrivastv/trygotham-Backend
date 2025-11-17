import SwiftUI

@main
struct zkCensusApp: App {
    @StateObject private var authManager = AuthenticationManager.shared
    @StateObject private var solanaService = SolanaService.shared

    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(solanaService)
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
