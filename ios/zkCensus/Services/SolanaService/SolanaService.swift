import Foundation
import Solana
import MobileWalletAdapter

/// Service for interacting with Solana blockchain
class SolanaService: ObservableObject {
    static let shared = SolanaService()

    @Published var isConnected: Bool = false
    @Published var walletAddress: String?

    private var solana: Solana?
    private var walletAdapter: MobileWalletAdapter?

    private let network: String
    private let rpcUrl: String
    private let programId: String

    private init() {
        self.network = ProcessInfo.processInfo.environment["SOLANA_NETWORK"] ?? "devnet"
        self.rpcUrl = ProcessInfo.processInfo.environment["SOLANA_RPC_URL"] ?? "https://api.devnet.solana.com"
        self.programId = ProcessInfo.processInfo.environment["PROGRAM_ID"] ?? "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

        setupSolana()
    }

    private func setupSolana() {
        guard let endpoint = URL(string: rpcUrl) else {
            print("Invalid Solana RPC URL")
            return
        }

        self.solana = Solana(router: NetworkingRouter(endpoint: endpoint))
    }

    // MARK: - Wallet Connection

    func connectWallet() async throws -> String {
        guard let adapter = MobileWalletAdapter(
            network: network == "mainnet-beta" ? .mainnetBeta : .devnet,
            cluster: rpcUrl
        ) else {
            throw SolanaError.walletAdapterNotAvailable
        }

        self.walletAdapter = adapter

        let result = try await adapter.authorize()

        guard let publicKey = result.publicKey else {
            throw SolanaError.authorizationFailed
        }

        let address = publicKey.base58EncodedString

        DispatchQueue.main.async {
            self.isConnected = true
            self.walletAddress = address
        }

        // Save to keychain
        KeychainManager.shared.saveWalletAddress(address)

        return address
    }

    func disconnectWallet() {
        walletAdapter?.deauthorize()

        DispatchQueue.main.async {
            self.isConnected = false
            self.walletAddress = nil
        }

        KeychainManager.shared.deleteWalletAddress()
    }

    func restoreWalletConnection() {
        if let savedAddress = KeychainManager.shared.getWalletAddress() {
            DispatchQueue.main.async {
                self.isConnected = true
                self.walletAddress = savedAddress
            }
        }
    }

    // MARK: - Transaction Signing

    func signTransaction(_ transaction: Transaction) async throws -> String {
        guard let adapter = walletAdapter else {
            throw SolanaError.walletNotConnected
        }

        let signedTransaction = try await adapter.signTransaction(transaction)

        guard let signature = signedTransaction.signature else {
            throw SolanaError.signatureFailed
        }

        return signature.base58EncodedString
    }

    func signMessage(_ message: String) async throws -> String {
        guard let adapter = walletAdapter else {
            throw SolanaError.walletNotConnected
        }

        guard let messageData = message.data(using: .utf8) else {
            throw SolanaError.invalidMessage
        }

        let signature = try await adapter.signMessage(messageData)

        return signature.base64EncodedString()
    }

    // MARK: - Census Program Interactions

    func createCensus(
        censusId: String,
        name: String,
        description: String,
        enableLocation: Bool,
        minAge: UInt8
    ) async throws -> String {
        guard let walletAddress = walletAddress else {
            throw SolanaError.walletNotConnected
        }

        // Build transaction instruction
        let instruction = try buildCreateCensusInstruction(
            censusId: censusId,
            name: name,
            description: description,
            enableLocation: enableLocation,
            minAge: minAge,
            creator: walletAddress
        )

        // Create and send transaction
        let transaction = try await buildTransaction(instructions: [instruction])
        let signature = try await signAndSendTransaction(transaction)

        return signature
    }

    func submitProof(
        censusId: String,
        nullifierHash: String,
        ageRange: UInt8,
        continent: UInt8
    ) async throws -> String {
        guard let walletAddress = walletAddress else {
            throw SolanaError.walletNotConnected
        }

        // Build transaction instruction
        let instruction = try buildSubmitProofInstruction(
            censusId: censusId,
            nullifierHash: nullifierHash,
            ageRange: ageRange,
            continent: continent,
            submitter: walletAddress
        )

        // Create and send transaction
        let transaction = try await buildTransaction(instructions: [instruction])
        let signature = try await signAndSendTransaction(transaction)

        return signature
    }

    // MARK: - Account Queries

    func getCensusAccount(censusId: String) async throws -> CensusAccount {
        guard let solana = solana else {
            throw SolanaError.notInitialized
        }

        // Derive PDA for census account
        let pda = try deriveCensusPDA(censusId: censusId)

        // Fetch account data
        let accountInfo = try await solana.api.getAccountInfo(account: pda.base58EncodedString)

        guard let data = accountInfo?.data else {
            throw SolanaError.accountNotFound
        }

        // Deserialize account data
        return try CensusAccount.deserialize(from: data)
    }

    func getBalance() async throws -> UInt64 {
        guard let solana = solana,
              let address = walletAddress else {
            throw SolanaError.walletNotConnected
        }

        let balance = try await solana.api.getBalance(account: address)
        return balance
    }

    // MARK: - Helper Methods

    private func buildTransaction(instructions: [TransactionInstruction]) async throws -> Transaction {
        guard let solana = solana,
              let walletAddress = walletAddress else {
            throw SolanaError.walletNotConnected
        }

        let recentBlockhash = try await solana.api.getRecentBlockhash()

        let transaction = Transaction(
            feePayer: PublicKey(string: walletAddress)!,
            instructions: instructions,
            recentBlockhash: recentBlockhash
        )

        return transaction
    }

    private func signAndSendTransaction(_ transaction: Transaction) async throws -> String {
        guard let solana = solana else {
            throw SolanaError.notInitialized
        }

        // Sign transaction with wallet
        let signature = try await signTransaction(transaction)

        // Send transaction
        let txSignature = try await solana.api.sendTransaction(
            serializedTransaction: transaction.serialize()
        )

        // Wait for confirmation
        try await solana.api.confirmTransaction(signature: txSignature)

        return txSignature
    }

    private func deriveCensusPDA(censusId: String) throws -> PublicKey {
        guard let programPublicKey = PublicKey(string: programId) else {
            throw SolanaError.invalidProgramId
        }

        let seeds = [
            "census".data(using: .utf8)!,
            censusId.data(using: .utf8)!
        ]

        let (pda, _) = try PublicKey.findProgramAddress(
            seeds: seeds,
            programId: programPublicKey
        )

        return pda
    }

    private func buildCreateCensusInstruction(
        censusId: String,
        name: String,
        description: String,
        enableLocation: Bool,
        minAge: UInt8,
        creator: String
    ) throws -> TransactionInstruction {
        // Build instruction data according to Anchor IDL
        var data = Data()
        data.append(contentsOf: [0]) // Instruction discriminator for "create_census"

        // Serialize parameters
        data.append(contentsOf: censusId.data(using: .utf8)!)
        data.append(contentsOf: name.data(using: .utf8)!)
        data.append(contentsOf: description.data(using: .utf8)!)
        data.append(enableLocation ? 1 : 0)
        data.append(minAge)

        // Build accounts
        let accounts: [AccountMeta] = [
            AccountMeta(publicKey: try PublicKey(string: creator), isSigner: true, isWritable: true),
            AccountMeta(publicKey: try deriveCensusPDA(censusId: censusId), isSigner: false, isWritable: true),
            AccountMeta(publicKey: PublicKey.systemProgramId, isSigner: false, isWritable: false)
        ]

        return TransactionInstruction(
            programId: try PublicKey(string: programId),
            accounts: accounts,
            data: data
        )
    }

    private func buildSubmitProofInstruction(
        censusId: String,
        nullifierHash: String,
        ageRange: UInt8,
        continent: UInt8,
        submitter: String
    ) throws -> TransactionInstruction {
        // Build instruction data
        var data = Data()
        data.append(contentsOf: [1]) // Instruction discriminator for "register_member"

        // Serialize parameters
        data.append(contentsOf: nullifierHash.data(using: .utf8)!)
        data.append(ageRange)
        data.append(continent)

        // Build accounts
        let accounts: [AccountMeta] = [
            AccountMeta(publicKey: try PublicKey(string: submitter), isSigner: true, isWritable: true),
            AccountMeta(publicKey: try deriveCensusPDA(censusId: censusId), isSigner: false, isWritable: true),
            AccountMeta(publicKey: PublicKey.systemProgramId, isSigner: false, isWritable: false)
        ]

        return TransactionInstruction(
            programId: try PublicKey(string: programId),
            accounts: accounts,
            data: data
        )
    }
}

// MARK: - Census Account (Deserialized from Solana)

struct CensusAccount {
    let censusId: String
    let name: String
    let description: String
    let creator: PublicKey
    let createdAt: Int64
    let active: Bool
    let enableLocation: Bool
    let minAge: UInt8
    let totalMembers: UInt64
    let merkleRoot: [UInt8]
    let ipfsHash: String
    let ageDistribution: [UInt64]
    let continentDistribution: [UInt64]
    let lastUpdated: Int64

    static func deserialize(from data: Data) throws -> CensusAccount {
        // Simplified deserialization - in production, use Borsh or proper Anchor deserialization
        // This is a placeholder implementation
        throw SolanaError.deserializationFailed
    }
}

// MARK: - Solana Errors

enum SolanaError: LocalizedError {
    case notInitialized
    case walletNotConnected
    case walletAdapterNotAvailable
    case authorizationFailed
    case signatureFailed
    case invalidMessage
    case invalidProgramId
    case accountNotFound
    case deserializationFailed
    case transactionFailed(String)

    var errorDescription: String? {
        switch self {
        case .notInitialized:
            return "Solana service not initialized"
        case .walletNotConnected:
            return "Wallet not connected. Please connect your wallet first."
        case .walletAdapterNotAvailable:
            return "Mobile Wallet Adapter not available"
        case .authorizationFailed:
            return "Failed to authorize wallet"
        case .signatureFailed:
            return "Failed to sign transaction"
        case .invalidMessage:
            return "Invalid message format"
        case .invalidProgramId:
            return "Invalid program ID"
        case .accountNotFound:
            return "Account not found on blockchain"
        case .deserializationFailed:
            return "Failed to deserialize account data"
        case .transactionFailed(let reason):
            return "Transaction failed: \(reason)"
        }
    }
}
