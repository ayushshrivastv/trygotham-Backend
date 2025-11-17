import Foundation

/// Defines the two types of users in the zk-Census system
enum UserType: String, Codable {
    case company = "company"
    case individual = "individual"

    var displayName: String {
        switch self {
        case .company:
            return "Company"
        case .individual:
            return "Individual"
        }
    }

    var icon: String {
        switch self {
        case .company:
            return "building.2.fill"
        case .individual:
            return "person.fill"
        }
    }
}

/// User profile model
struct UserProfile: Codable, Identifiable {
    let id: String
    let userType: UserType
    let walletAddress: String
    let createdAt: Date

    // Company-specific fields
    var companyName: String?
    var companyDescription: String?
    var companyLogoUrl: String?
    var companyWebsite: String?
    var verificationStatus: VerificationStatus?

    // Individual-specific fields
    var hasCompletedKYC: Bool?
    var zkProofCount: Int?
    var connectedCompanies: [String]?

    // Shared fields
    var displayName: String {
        if userType == .company {
            return companyName ?? "Company"
        }
        return "User"
    }

    var profileImageUrl: String? {
        return companyLogoUrl
    }
}

/// Verification status for companies
enum VerificationStatus: String, Codable {
    case pending = "pending"
    case verified = "verified"
    case rejected = "rejected"

    var displayName: String {
        switch self {
        case .pending:
            return "Pending Verification"
        case .verified:
            return "Verified"
        case .rejected:
            return "Rejected"
        }
    }

    var color: String {
        switch self {
        case .pending:
            return "orange"
        case .verified:
            return "green"
        case .rejected:
            return "red"
        }
    }
}
