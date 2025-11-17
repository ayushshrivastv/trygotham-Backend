import Foundation

// MARK: - Age Range
enum AgeRange: Int, Codable, CaseIterable {
    case range_0_17 = 0
    case range_18_24 = 1
    case range_25_34 = 2
    case range_35_44 = 3
    case range_45_54 = 4
    case range_55_64 = 5
    case range_65_plus = 6

    var displayName: String {
        switch self {
        case .range_0_17: return "0-17"
        case .range_18_24: return "18-24"
        case .range_25_34: return "25-34"
        case .range_35_44: return "35-44"
        case .range_45_54: return "45-54"
        case .range_55_64: return "55-64"
        case .range_65_plus: return "65+"
        }
    }

    static func from(dateOfBirth: Date, currentDate: Date = Date()) -> AgeRange {
        let calendar = Calendar.current
        let ageComponents = calendar.dateComponents([.year], from: dateOfBirth, to: currentDate)
        let age = ageComponents.year ?? 0

        switch age {
        case 0..<18: return .range_0_17
        case 18..<25: return .range_18_24
        case 25..<35: return .range_25_34
        case 35..<45: return .range_35_44
        case 45..<55: return .range_45_54
        case 55..<65: return .range_55_64
        default: return .range_65_plus
        }
    }
}

// MARK: - Continent
enum Continent: Int, Codable, CaseIterable {
    case africa = 0
    case asia = 1
    case europe = 2
    case northAmerica = 3
    case southAmerica = 4
    case oceania = 5
    case antarctica = 6

    var displayName: String {
        switch self {
        case .africa: return "Africa"
        case .asia: return "Asia"
        case .europe: return "Europe"
        case .northAmerica: return "North America"
        case .southAmerica: return "South America"
        case .oceania: return "Oceania"
        case .antarctica: return "Antarctica"
        }
    }

    static func from(countryCode: String) -> Continent {
        // Simplified mapping - in production, use a comprehensive ISO 3166-1 to continent mapping
        let africaCodes = ["ZA", "NG", "EG", "KE", "GH", "TZ", "UG", "AO", "SD", "MA"]
        let asiaCodes = ["CN", "IN", "JP", "KR", "ID", "PK", "BD", "VN", "TH", "MY", "SG"]
        let europeCodes = ["GB", "DE", "FR", "IT", "ES", "PL", "RO", "NL", "BE", "SE", "NO", "FI"]
        let northAmericaCodes = ["US", "CA", "MX", "GT", "CU", "HT", "DO", "HN", "NI", "SV"]
        let southAmericaCodes = ["BR", "AR", "CO", "PE", "VE", "CL", "EC", "BO", "PY", "UY"]
        let oceaniaCodes = ["AU", "NZ", "PG", "FJ", "NC", "PF", "WS", "GU", "KI", "TO"]

        if africaCodes.contains(countryCode) { return .africa }
        if asiaCodes.contains(countryCode) { return .asia }
        if europeCodes.contains(countryCode) { return .europe }
        if northAmericaCodes.contains(countryCode) { return .northAmerica }
        if southAmericaCodes.contains(countryCode) { return .southAmerica }
        if oceaniaCodes.contains(countryCode) { return .oceania }

        return .antarctica // Default fallback
    }
}

// MARK: - Registration Status
enum RegistrationStatus: String, Codable {
    case pending = "pending"
    case verified = "verified"
    case rejected = "rejected"

    var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - ZK Proof
struct ZKProof: Codable {
    let pi_a: [String]
    let pi_b: [[String]]
    let pi_c: [String]
    let protocol: String
    let curve: String

    init(pi_a: [String], pi_b: [[String]], pi_c: [String]) {
        self.pi_a = pi_a
        self.pi_b = pi_b
        self.pi_c = pi_c
        self.protocol = "groth16"
        self.curve = "bn128"
    }
}

// MARK: - Proof Public Signals
struct ProofPublicSignals: Codable {
    let nullifierHash: String
    let ageRange: Int
    let continent: Int
    let censusId: String
    let timestamp: Int64

    var ageRangeEnum: AgeRange? {
        AgeRange(rawValue: ageRange)
    }

    var continentEnum: Continent? {
        Continent(rawValue: continent)
    }
}

// MARK: - Census Proof (combines proof + signals)
struct CensusProof: Codable {
    let proof: ZKProof
    let publicSignals: ProofPublicSignals
}

// MARK: - Submit Proof Request
struct SubmitProofRequest: Codable {
    let censusId: String
    let proof: CensusProof
    let signature: String
    let publicKey: String
}

// MARK: - Submit Proof Response
struct SubmitProofResponse: Codable {
    let success: Bool
    let message: String
    let transactionSignature: String?
    let nullifierHash: String?
    let registration: Registration?
}

// MARK: - Registration
struct Registration: Codable, Identifiable {
    let id: String
    let censusId: String
    let nullifierHash: String
    let ageRange: Int
    let continent: Int
    let timestamp: Int64
    let transactionSignature: String?
    let status: RegistrationStatus
    let createdAt: Date

    var ageRangeEnum: AgeRange? {
        AgeRange(rawValue: ageRange)
    }

    var continentEnum: Continent? {
        Continent(rawValue: continent)
    }
}

// MARK: - Circuit Input (for proof generation)
struct CircuitInput {
    let passportNumber: String
    let dateOfBirth: Date
    let nationalityCode: String
    let documentExpiry: Date
    let nullifierSecret: String
    let currentTimestamp: Date
    let censusId: String

    func toJSON() -> [String: Any] {
        return [
            "passportNumber": hashPassportNumber(passportNumber),
            "dateOfBirth": Int(dateOfBirth.timeIntervalSince1970),
            "nationalityCode": mapNationalityToNumber(nationalityCode),
            "documentExpiry": Int(documentExpiry.timeIntervalSince1970),
            "nullifierSecret": nullifierSecret,
            "currentTimestamp": Int(currentTimestamp.timeIntervalSince1970),
            "censusId": censusId
        ]
    }

    private func hashPassportNumber(_ number: String) -> String {
        // Convert passport number to bigint representation
        // In production, use proper hashing
        return number.data(using: .utf8)?.base64EncodedString() ?? ""
    }

    private func mapNationalityToNumber(_ code: String) -> Int {
        // Simple mapping - in production, use ISO 3166-1 numeric codes
        return code.unicodeScalars.reduce(0) { $0 + Int($1.value) }
    }
}

// MARK: - ZK Sharing
struct ZKShare: Codable, Identifiable {
    let id: String
    let userId: String
    let companyId: String
    let censusId: String
    let nullifierHash: String
    let sharedAt: Date
    let expiresAt: Date?
    let status: ShareStatus

    enum ShareStatus: String, Codable {
        case active = "active"
        case revoked = "revoked"
        case expired = "expired"
    }
}
