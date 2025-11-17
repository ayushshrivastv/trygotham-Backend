import Foundation

// MARK: - Passport Data
struct PassportData {
    let documentNumber: String
    let documentType: String
    let issuingCountry: String
    let surname: String
    let givenNames: String
    let nationality: String
    let dateOfBirth: Date
    let sex: String
    let expiryDate: Date
    let personalNumber: String?

    // Optional NFC chip data
    var nfcData: NFCPassportData?

    var fullName: String {
        "\(givenNames) \(surname)"
    }

    var isExpired: Bool {
        expiryDate < Date()
    }

    var daysUntilExpiry: Int {
        Calendar.current.dateComponents([.day], from: Date(), to: expiryDate).day ?? 0
    }

    var ageRange: AgeRange {
        AgeRange.from(dateOfBirth: dateOfBirth)
    }

    var continent: Continent {
        Continent.from(countryCode: nationality)
    }
}

// MARK: - MRZ (Machine Readable Zone)
struct MRZData {
    let documentType: String
    let issuingCountry: String
    let documentNumber: String
    let dateOfBirth: String
    let sex: String
    let expiryDate: String
    let nationality: String
    let surname: String
    let givenNames: String
    let personalNumber: String?

    func toPassportData() throws -> PassportData {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyMMdd"

        guard let dob = dateFormatter.date(from: dateOfBirth),
              let expiry = dateFormatter.date(from: expiryDate) else {
            throw PassportError.invalidDateFormat
        }

        return PassportData(
            documentNumber: documentNumber,
            documentType: documentType,
            issuingCountry: issuingCountry,
            surname: surname,
            givenNames: givenNames,
            nationality: nationality,
            dateOfBirth: dob,
            sex: sex,
            expiryDate: expiry,
            personalNumber: personalNumber
        )
    }
}

// MARK: - NFC Passport Data
struct NFCPassportData {
    let documentNumber: String
    let dateOfBirth: Date
    let expiryDate: Date
    let faceImage: Data?
    let signature: Data?
    let publicKey: Data?
    let activeAuthentication: Bool
    let chipAuthentication: Bool

    var isAuthenticated: Bool {
        activeAuthentication || chipAuthentication
    }
}

// MARK: - Passport Scan Result
struct PassportScanResult {
    let passportData: PassportData
    let scanMethod: ScanMethod
    let scanDate: Date
    let confidence: Double // 0.0 to 1.0

    enum ScanMethod {
        case ocr
        case nfc
        case manual
    }

    var isHighConfidence: Bool {
        confidence >= 0.85
    }
}

// MARK: - Passport Error
enum PassportError: LocalizedError {
    case invalidMRZ
    case invalidDateFormat
    case expiredPassport
    case nfcNotSupported
    case nfcReadFailed
    case invalidChipData
    case authenticationFailed
    case scanTimeout
    case cameraNotAvailable
    case permissionDenied

    var errorDescription: String? {
        switch self {
        case .invalidMRZ:
            return "Could not read passport MRZ. Please try again with better lighting."
        case .invalidDateFormat:
            return "Invalid date format in passport data."
        case .expiredPassport:
            return "This passport has expired. Please use a valid passport."
        case .nfcNotSupported:
            return "Your device does not support NFC scanning."
        case .nfcReadFailed:
            return "Failed to read NFC chip. Please hold your passport steady."
        case .invalidChipData:
            return "The passport chip data is invalid or corrupted."
        case .authenticationFailed:
            return "Failed to authenticate passport chip data."
        case .scanTimeout:
            return "Scan timed out. Please try again."
        case .cameraNotAvailable:
            return "Camera is not available on this device."
        case .permissionDenied:
            return "Camera permission is required to scan passports."
        }
    }
}

// MARK: - Passport Validation
extension PassportData {
    func validate() throws {
        // Check expiry
        guard !isExpired else {
            throw PassportError.expiredPassport
        }

        // Validate document number
        guard !documentNumber.isEmpty else {
            throw PassportError.invalidMRZ
        }

        // Validate nationality code (should be 3 letters)
        guard nationality.count == 3 || nationality.count == 2 else {
            throw PassportError.invalidMRZ
        }

        // Additional validations can be added here
    }

    func toCircuitInput(censusId: String, nullifierSecret: String? = nil) -> CircuitInput {
        let secret = nullifierSecret ?? UUID().uuidString

        return CircuitInput(
            passportNumber: documentNumber,
            dateOfBirth: dateOfBirth,
            nationalityCode: nationality,
            documentExpiry: expiryDate,
            nullifierSecret: secret,
            currentTimestamp: Date(),
            censusId: censusId
        )
    }
}
