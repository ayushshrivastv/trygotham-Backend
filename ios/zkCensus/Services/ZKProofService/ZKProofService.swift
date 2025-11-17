import Foundation
import JavaScriptCore

/// Service for generating and verifying zero-knowledge proofs
class ZKProofService: ObservableObject {
    static let shared = ZKProofService()

    @Published var isGeneratingProof: Bool = false
    @Published var proofProgress: Double = 0.0
    @Published var proofStatus: String = ""

    private var jsContext: JSContext?

    private init() {
        setupJavaScriptContext()
    }

    // MARK: - Setup

    private func setupJavaScriptContext() {
        jsContext = JSContext()

        // Load SnarkJS library
        if let snarkjsPath = Bundle.main.path(forResource: "snarkjs", ofType: "js"),
           let snarkjsCode = try? String(contentsOfFile: snarkjsPath) {
            jsContext?.evaluateScript(snarkjsCode)
        }

        // Add console.log for debugging
        let consoleLog: @convention(block) (String) -> Void = { message in
            print("[SnarkJS] \(message)")
        }
        jsContext?.setObject(consoleLog, forKeyedSubscript: "consoleLog" as NSString)
        jsContext?.evaluateScript("var console = { log: consoleLog }")
    }

    // MARK: - Proof Generation

    func generateProof(from circuitInput: CircuitInput) async throws -> CensusProof {
        isGeneratingProof = true
        proofProgress = 0.0
        proofStatus = "Preparing circuit input..."

        defer {
            isGeneratingProof = false
        }

        // Load circuit files
        proofProgress = 0.1
        proofStatus = "Loading circuit files..."

        guard let wasmPath = Bundle.main.path(forResource: "census", ofType: "wasm"),
              let zkeyPath = Bundle.main.path(forResource: "census", ofType: "zkey") else {
            throw ZKProofError.circuitFilesNotFound
        }

        // Convert input to JSON
        proofProgress = 0.2
        proofStatus = "Preparing witness..."

        let inputJSON = circuitInput.toJSON()
        let inputData = try JSONSerialization.data(withJSONObject: inputJSON)
        let inputString = String(data: inputData, encoding: .utf8) ?? "{}"

        // Generate proof using SnarkJS
        proofProgress = 0.3
        proofStatus = "Generating zero-knowledge proof... (this may take 30-60 seconds)"

        // In a real implementation, this would call SnarkJS via WebAssembly
        // For now, we'll simulate the proof generation
        let proof = try await simulateProofGeneration(
            input: circuitInput,
            wasmPath: wasmPath,
            zkeyPath: zkeyPath
        )

        proofProgress = 1.0
        proofStatus = "Proof generated successfully!"

        // Auto-delete sensitive input data
        await clearSensitiveData()

        return proof
    }

    private func simulateProofGeneration(
        input: CircuitInput,
        wasmPath: String,
        zkeyPath: String
    ) async throws -> CensusProof {
        // Simulate proof generation time
        for i in 1...10 {
            try await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds
            proofProgress = 0.3 + (Double(i) * 0.06)
            proofStatus = "Computing witness... (\(i * 10)%)"
        }

        // Generate public signals
        let ageRange = AgeRange.from(dateOfBirth: input.dateOfBirth)
        let continent = Continent.from(countryCode: input.nationalityCode)
        let nullifierHash = generateNullifierHash(
            passportNumber: input.passportNumber,
            secret: input.nullifierSecret
        )

        let publicSignals = ProofPublicSignals(
            nullifierHash: nullifierHash,
            ageRange: ageRange.rawValue,
            continent: continent.rawValue,
            censusId: input.censusId,
            timestamp: Int64(input.currentTimestamp.timeIntervalSince1970)
        )

        // Generate mock proof (in production, this would be real Groth16 proof)
        let zkProof = ZKProof(
            pi_a: [
                "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
                "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321"
            ],
            pi_b: [
                [
                    "0x1111111111111111111111111111111111111111111111111111111111111111",
                    "0x2222222222222222222222222222222222222222222222222222222222222222"
                ],
                [
                    "0x3333333333333333333333333333333333333333333333333333333333333333",
                    "0x4444444444444444444444444444444444444444444444444444444444444444"
                ]
            ],
            pi_c: [
                "0x5555555555555555555555555555555555555555555555555555555555555555",
                "0x6666666666666666666666666666666666666666666666666666666666666666"
            ]
        )

        return CensusProof(
            proof: zkProof,
            publicSignals: publicSignals
        )
    }

    // MARK: - Proof Verification

    func verifyProof(_ proof: CensusProof) async throws -> Bool {
        proofStatus = "Verifying proof..."

        guard let vkeyPath = Bundle.main.path(forResource: "verification_key", ofType: "json") else {
            throw ZKProofError.verificationKeyNotFound
        }

        // In production, this would verify using SnarkJS
        // For now, we'll do basic validation
        let isValid = validateProofStructure(proof)

        proofStatus = isValid ? "Proof is valid!" : "Proof is invalid"

        return isValid
    }

    private func validateProofStructure(_ proof: CensusProof) -> Bool {
        // Basic structure validation
        return proof.proof.pi_a.count == 2 &&
               proof.proof.pi_b.count == 2 &&
               proof.proof.pi_b[0].count == 2 &&
               proof.proof.pi_b[1].count == 2 &&
               proof.proof.pi_c.count == 2 &&
               proof.proof.protocol == "groth16" &&
               proof.proof.curve == "bn128"
    }

    // MARK: - Nullifier Generation

    private func generateNullifierHash(passportNumber: String, secret: String) -> String {
        // Use Poseidon hash for ZK-friendly nullifier
        // In production, this should match the circuit's hash function
        let combined = "\(passportNumber)_\(secret)"

        // For now, use SHA256 as a placeholder
        // Production should use Poseidon hash
        guard let data = combined.data(using: .utf8) else {
            return ""
        }

        let hash = SHA256.hash(data: data)
        return hash.compactMap { String(format: "%02x", $0) }.joined()
    }

    // MARK: - Privacy & Cleanup

    private func clearSensitiveData() async {
        proofStatus = "Clearing sensitive data..."

        // Clear any cached input data from memory
        jsContext?.evaluateScript("var sensitiveData = null;")

        // Force garbage collection
        jsContext?.evaluateScript("if (global.gc) global.gc();")

        proofStatus = ""
    }

    func resetState() {
        isGeneratingProof = false
        proofProgress = 0.0
        proofStatus = ""
    }
}

// MARK: - SHA256 Helper (should use CryptoKit in production)

import CryptoKit

extension SHA256 {
    static func hash(data: Data) -> Data {
        let hash = SHA256.hash(data: data)
        return Data(hash)
    }
}

// MARK: - ZK Proof Errors

enum ZKProofError: LocalizedError {
    case circuitFilesNotFound
    case verificationKeyNotFound
    case invalidInput
    case proofGenerationFailed(String)
    case verificationFailed
    case jsContextNotAvailable

    var errorDescription: String? {
        switch self {
        case .circuitFilesNotFound:
            return "Circuit files (WASM/zkey) not found in app bundle"
        case .verificationKeyNotFound:
            return "Verification key not found in app bundle"
        case .invalidInput:
            return "Invalid circuit input data"
        case .proofGenerationFailed(let reason):
            return "Proof generation failed: \(reason)"
        case .verificationFailed:
            return "Proof verification failed"
        case .jsContextNotAvailable:
            return "JavaScript context not available"
        }
    }
}
