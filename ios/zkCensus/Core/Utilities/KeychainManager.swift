import Foundation
import KeychainAccess

/// Manages secure storage of sensitive data in iOS Keychain
class KeychainManager {
    static let shared = KeychainManager()

    private let keychain: Keychain

    private init() {
        self.keychain = Keychain(service: "com.zkcensus.app")
            .synchronizable(false)
            .accessibility(.whenUnlockedThisDeviceOnly)
    }

    // MARK: - Basic Operations

    func set(key: String, value: String) {
        do {
            try keychain.set(value, key: key)
        } catch {
            print("Keychain set error for key \(key): \(error)")
        }
    }

    func get(key: String) -> String? {
        do {
            return try keychain.get(key)
        } catch {
            print("Keychain get error for key \(key): \(error)")
            return nil
        }
    }

    func delete(key: String) {
        do {
            try keychain.remove(key)
        } catch {
            print("Keychain delete error for key \(key): \(error)")
        }
    }

    func deleteAll() {
        do {
            try keychain.removeAll()
        } catch {
            print("Keychain deleteAll error: \(error)")
        }
    }

    // MARK: - Specific Keys

    // Wallet
    func saveWalletAddress(_ address: String) {
        set(key: "wallet_address", value: address)
    }

    func getWalletAddress() -> String? {
        return get(key: "wallet_address")
    }

    func deleteWalletAddress() {
        delete(key: "wallet_address")
    }

    // Nullifier Secret (CRITICAL - never share)
    func saveNullifierSecret(_ secret: String) {
        set(key: "nullifier_secret", value: secret)
    }

    func getNullifierSecret() -> String? {
        return get(key: "nullifier_secret")
    }

    func generateAndSaveNullifierSecret() -> String {
        if let existing = getNullifierSecret() {
            return existing
        }

        let secret = UUID().uuidString + UUID().uuidString
        saveNullifierSecret(secret)
        return secret
    }

    // User Profile
    func saveUserId(_ userId: String) {
        set(key: "user_id", value: userId)
    }

    func getUserId() -> String? {
        return get(key: "user_id")
    }

    // Biometrics
    func setBiometricsEnabled(_ enabled: Bool) {
        set(key: "biometrics_enabled", value: enabled ? "true" : "false")
    }

    func isBiometricsEnabled() -> Bool {
        return get(key: "biometrics_enabled") == "true"
    }

    // Clear all user data (logout)
    func clearUserData() {
        deleteWalletAddress()
        delete(key: "user_id")
        delete(key: "auth_token")
        // Note: We intentionally keep nullifier_secret for privacy continuity
    }

    // Complete wipe (uninstall scenario)
    func completeWipe() {
        deleteAll()
    }
}
