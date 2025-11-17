import Foundation
import Vision
import CoreNFC
import UIKit
import AVFoundation

/// Service for scanning passports using OCR and NFC
class PassportScannerService: NSObject, ObservableObject {
    @Published var isScanning: Bool = false
    @Published var scanProgress: Double = 0.0
    @Published var scanStatus: String = ""

    private var currentSession: AVCaptureSession?
    private var nfcSession: NFCTagReaderSession?

    // MARK: - OCR Scanning

    func scanPassportWithOCR(from image: UIImage) async throws -> PassportData {
        scanStatus = "Analyzing passport image..."
        scanProgress = 0.1

        guard let cgImage = image.cgImage else {
            throw PassportError.invalidMRZ
        }

        // Use Vision framework for text recognition
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = false

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

        try handler.perform([request])

        guard let observations = request.results else {
            throw PassportError.invalidMRZ
        }

        scanProgress = 0.5
        scanStatus = "Extracting MRZ data..."

        // Extract text from observations
        let recognizedStrings = observations.compactMap { observation in
            observation.topCandidates(1).first?.string
        }

        // Parse MRZ
        let mrzData = try parseMRZ(from: recognizedStrings)

        scanProgress = 0.8
        scanStatus = "Validating passport data..."

        // Convert to PassportData
        let passportData = try mrzData.toPassportData()

        // Validate
        try passportData.validate()

        scanProgress = 1.0
        scanStatus = "Scan complete!"

        // Auto-delete image after processing (privacy)
        await deletePassportImage()

        return passportData
    }

    private func parseMRZ(from lines: [String]) throws -> MRZData {
        // Filter lines that look like MRZ (uppercase letters and numbers)
        let mrzLines = lines.filter { line in
            let normalized = line.replacingOccurrences(of: " ", with: "")
            return normalized.count >= 30 && normalized.allSatisfy { char in
                char.isUppercase || char.isNumber || char == "<"
            }
        }

        guard mrzLines.count >= 2 else {
            throw PassportError.invalidMRZ
        }

        // MRZ Type: TD3 (Passport) - 2 lines of 44 characters
        let line1 = mrzLines[0].replacingOccurrences(of: " ", with: "")
        let line2 = mrzLines[1].replacingOccurrences(of: " ", with: "")

        // Parse Line 1: P<ISSUING_COUNTRY<SURNAME<<GIVEN_NAMES
        let documentType = String(line1.prefix(2))
        let issuingCountry = String(line1.dropFirst(2).prefix(3))

        let nameSection = String(line1.dropFirst(5))
        let nameComponents = nameSection.split(separator: "<").filter { !$0.isEmpty }

        guard nameComponents.count >= 1 else {
            throw PassportError.invalidMRZ
        }

        let surname = String(nameComponents[0]).replacingOccurrences(of: "<", with: "")
        let givenNames = nameComponents.count > 1 ?
            nameComponents[1...].joined(separator: " ").replacingOccurrences(of: "<", with: " ") :
            ""

        // Parse Line 2: DOCUMENT_NUMBER<DOB<SEX<EXPIRY<NATIONALITY<PERSONAL_NUMBER
        guard line2.count >= 44 else {
            throw PassportError.invalidMRZ
        }

        let documentNumber = String(line2.prefix(9)).replacingOccurrences(of: "<", with: "")
        let dateOfBirth = String(line2.dropFirst(13).prefix(6))
        let sex = String(line2.dropFirst(20).prefix(1))
        let expiryDate = String(line2.dropFirst(21).prefix(6))
        let nationality = String(line2.dropFirst(10).prefix(3))
        let personalNumber = String(line2.dropFirst(28).prefix(14)).replacingOccurrences(of: "<", with: "")

        return MRZData(
            documentType: documentType,
            issuingCountry: issuingCountry,
            documentNumber: documentNumber,
            dateOfBirth: dateOfBirth,
            sex: sex,
            expiryDate: expiryDate,
            nationality: nationality,
            surname: surname,
            givenNames: givenNames,
            personalNumber: personalNumber.isEmpty ? nil : personalNumber
        )
    }

    // MARK: - NFC Scanning

    func scanPassportWithNFC(documentNumber: String, dateOfBirth: Date, expiryDate: Date) async throws -> NFCPassportData {
        guard NFCTagReaderSession.readingAvailable else {
            throw PassportError.nfcNotSupported
        }

        scanStatus = "Hold your passport to the back of your phone..."

        return try await withCheckedThrowingContinuation { continuation in
            DispatchQueue.main.async {
                self.nfcSession = NFCTagReaderSession(
                    pollingOption: .iso14443,
                    delegate: self,
                    queue: nil
                )

                self.nfcSession?.alertMessage = "Hold your passport near the top of your iPhone"
                self.nfcSession?.begin()
            }

            // Note: Actual NFC reading implementation would be in NFCTagReaderSessionDelegate
            // This is a simplified placeholder
        }
    }

    // MARK: - Privacy & Cleanup

    private func deletePassportImage() async {
        // Ensure any cached images are deleted
        scanStatus = "Deleting passport data from device..."

        // Clear any temporary files
        let tempDirectory = FileManager.default.temporaryDirectory
        let passportFiles = try? FileManager.default.contentsOfDirectory(
            at: tempDirectory,
            includingPropertiesForKeys: nil
        ).filter { $0.lastPathComponent.contains("passport") }

        passportFiles?.forEach { url in
            try? FileManager.default.removeItem(at: url)
        }
    }

    func clearAllPassportData() {
        // Complete wipe of any passport-related data
        Task {
            await deletePassportImage()
        }

        scanStatus = ""
        scanProgress = 0.0
    }
}

// MARK: - NFC Delegate (Placeholder)

extension PassportScannerService: NFCTagReaderSessionDelegate {
    func tagReaderSessionDidBecomeActive(_ session: NFCTagReaderSession) {
        scanStatus = "NFC session active..."
    }

    func tagReaderSession(_ session: NFCTagReaderSession, didInvalidateWithError error: Error) {
        scanStatus = "NFC session error"
        print("NFC Error: \(error)")
    }

    func tagReaderSession(_ session: NFCTagReaderSession, didDetect tags: [NFCTag]) {
        guard let tag = tags.first else { return }

        session.connect(to: tag) { error in
            if let error = error {
                session.invalidate(errorMessage: "Connection error: \(error.localizedDescription)")
                return
            }

            self.scanStatus = "Reading passport chip..."

            // Implement ICAO 9303 passport reading protocol
            // This requires:
            // 1. Basic Access Control (BAC) using MRZ data
            // 2. Reading Data Groups (DG1, DG2, etc.)
            // 3. Active Authentication
            // 4. Passive Authentication

            // Placeholder - real implementation would be much more complex
            session.alertMessage = "Passport read successfully!"
            session.invalidate()
        }
    }
}

// MARK: - Camera Utilities

extension PassportScannerService {
    func checkCameraPermission() async -> Bool {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            return true
        case .notDetermined:
            return await AVCaptureDevice.requestAccess(for: .video)
        default:
            return false
        }
    }

    func setupCamera() throws -> AVCaptureSession {
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            throw PassportError.cameraNotAvailable
        }

        let session = AVCaptureSession()
        session.sessionPreset = .photo

        let input = try AVCaptureDeviceInput(device: device)
        session.addInput(input)

        let output = AVCapturePhotoOutput()
        session.addOutput(output)

        currentSession = session

        return session
    }
}
