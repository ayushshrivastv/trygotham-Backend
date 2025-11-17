# iOS App Architecture

## Overview

The zk-Census iOS application follows a **modular, feature-based architecture** with clear separation of concerns and a unidirectional data flow pattern.

## Architecture Principles

### 1. **MVVM + Services Pattern**

```
View (SwiftUI) → ViewModel (@Observable) → Service Layer → API/Blockchain
                        ↑                        ↓
                    Models ← ← ← ← ← ← ← ← Data Layer
```

**Benefits**:
- Clear separation of UI and business logic
- Testable components
- Reusable service layer
- Type-safe data models

### 2. **Feature Modules**

Each feature is self-contained with its own:
- Views (SwiftUI)
- View Models (where needed)
- Models (feature-specific)
- Navigation logic

**Example**: PassportScanner module
```
Features/PassportScanner/
├── PassportScannerView.swift       # UI
├── PassportScannerViewModel.swift  # Logic (if complex)
└── Components/                     # Reusable components
    ├── CameraPreview.swift
    └── NFCReaderView.swift
```

### 3. **Dependency Injection**

Using SwiftUI's `@EnvironmentObject` for shared state:

```swift
@main
struct zkCensusApp: App {
    @StateObject private var authManager = AuthenticationManager.shared
    @StateObject private var solanaService = SolanaService.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(solanaService)
        }
    }
}
```

## Core Components

### Authentication Layer

**AuthenticationManager**: Central auth state management

```swift
class AuthenticationManager: ObservableObject {
    @Published var isAuthenticated: Bool
    @Published var currentUser: UserProfile?
    @Published var userType: UserType?

    func signInAsCompany() async throws
    func signInAsIndividual() async throws
    func signOut()
}
```

**Flow**:
1. User selects type (Company/Individual)
2. Connect Solana wallet via MobileWalletAdapter
3. Create/fetch user profile
4. Store in Core Data + Keychain
5. Update `@Published` state → UI updates automatically

### Service Layer

#### **APIClient**
- Singleton pattern
- Alamofire-based networking
- Request/response interceptors
- Automatic retry with exponential backoff

```swift
class APIClient {
    static let shared = APIClient()

    func submitProof(_ request: SubmitProofRequest) async throws -> SubmitProofResponse
    func getCensus(id: String) async throws -> CensusMetadata
    func listCensuses() async throws -> [CensusMetadata]
}
```

#### **SolanaService**
- Wallet connection management
- Transaction signing
- Program interaction (Anchor)
- Account queries

```swift
class SolanaService: ObservableObject {
    @Published var isConnected: Bool
    @Published var walletAddress: String?

    func connectWallet() async throws -> String
    func signTransaction(_ tx: Transaction) async throws -> String
    func submitProof(...) async throws -> String
}
```

#### **ZKProofService**
- SnarkJS integration via JavaScriptCore
- Proof generation (30-60s on device)
- Proof verification
- Witness computation

```swift
class ZKProofService: ObservableObject {
    @Published var isGeneratingProof: Bool
    @Published var proofProgress: Double

    func generateProof(from input: CircuitInput) async throws -> CensusProof
    func verifyProof(_ proof: CensusProof) async throws -> Bool
}
```

#### **PassportScannerService**
- Vision framework OCR
- CoreNFC chip reading
- MRZ parsing
- Automatic data cleanup

```swift
class PassportScannerService: ObservableObject {
    @Published var isScanning: Bool
    @Published var scanProgress: Double

    func scanPassportWithOCR(from image: UIImage) async throws -> PassportData
    func scanPassportWithNFC(...) async throws -> NFCPassportData
}
```

### Data Layer

#### **Core Data**
Persistent storage for:
- User profiles
- Census metadata (cached)
- Registrations (local history)
- Company pages (cached)
- Connections

**Schema**:
```
UserProfileEntity
├── id: String
├── userType: String
├── walletAddress: String
├── companyName: String?
└── ...

CensusEntity
├── id: String
├── name: String
├── description: String
├── active: Bool
└── registrations: [RegistrationEntity]

RegistrationEntity
├── id: String
├── censusId: String
├── nullifierHash: String
├── ageRange: Int16
├── continent: Int16
└── census: CensusEntity?
```

#### **Keychain**
Secure storage for:
- Wallet address
- Nullifier secret (CRITICAL - never exposed)
- User ID
- Auth tokens
- Biometric preferences

```swift
class KeychainManager {
    func saveWalletAddress(_ address: String)
    func getWalletAddress() -> String?
    func generateAndSaveNullifierSecret() -> String
    func clearUserData()
}
```

## Data Flow

### Example: Passport Scan → ZK Proof → Submission

```
┌─────────────────┐
│ PassportScanner │
│      View       │
└────────┬────────┘
         │ User taps "Scan"
         ▼
┌─────────────────┐
│ PassportScanner │
│     Service     │ ← Uses Vision/CoreNFC
└────────┬────────┘
         │ Returns PassportData
         ▼
┌─────────────────┐
│  Passport Data  │ ← Validated, parsed
│   (in memory)   │
└────────┬────────┘
         │ User selects census
         ▼
┌─────────────────┐
│   ZKProofService│
│   .generate()   │ ← Uses SnarkJS WASM
└────────┬────────┘
         │ 30-60s later...
         ▼
┌─────────────────┐
│   CensusProof   │ ← ZK proof + public signals
└────────┬────────┘
         │ User confirms
         ▼
┌─────────────────┐
│ SolanaService   │
│   .sign()       │ ← Wallet signature
└────────┬────────┘
         │ Signed transaction
         ▼
┌─────────────────┐
│   APIClient     │
│ .submitProof()  │ ← POST to backend
└────────┬────────┘
         │ Success response
         ▼
┌─────────────────┐
│   Core Data     │ ← Save registration locally
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  UI Updates     │ ← @Published triggers view refresh
└─────────────────┘
```

### State Management

**SwiftUI + Combine Pattern**:

```swift
// Service publishes state changes
class ZKProofService: ObservableObject {
    @Published var isGeneratingProof: Bool = false
    @Published var proofProgress: Double = 0.0
}

// View observes and reacts
struct ProofGenerationView: View {
    @StateObject private var zkService = ZKProofService.shared

    var body: some View {
        VStack {
            if zkService.isGeneratingProof {
                ProgressView(value: zkService.proofProgress)
            }
        }
    }
}
```

## Navigation Architecture

### Root-Level Navigation

```swift
ContentView (Root)
    ├─ isAuthenticated == false
    │   └─ OnboardingView
    │       ├─ CompanyOnboardingView
    │       └─ UserOnboardingView
    │
    └─ isAuthenticated == true
        ├─ userType == .company
        │   └─ CompanyDashboardView (TabView)
        │       ├─ CensusListView
        │       ├─ CompanyStatsView
        │       ├─ CompanyConnectionsView
        │       └─ CompanyProfileView
        │
        └─ userType == .individual
            └─ UserDashboardView (TabView)
                ├─ HomeView
                ├─ MyProofsView
                ├─ UserCompaniesView
                └─ UserProfileView
```

### Navigation Patterns

1. **Tab-based navigation**: Main dashboards
2. **NavigationStack**: Drill-down flows
3. **Sheet presentation**: Modal flows (scan, create census)
4. **FullScreenCover**: Onboarding, critical flows

## Privacy Architecture

### Data Lifecycle

```
┌──────────────────┐
│  Passport Image  │ ← Captured from camera
└────────┬─────────┘
         │ OCR extraction
         ▼
┌──────────────────┐
│   MRZ Data       │ ← Parsed text (in memory)
└────────┬─────────┘
         │ Convert to CircuitInput
         ▼
┌──────────────────┐
│  Circuit Input   │ ← Hashed passport number,
└────────┬─────────┘   DOB, nationality, etc.
         │ Generate proof
         ▼
┌──────────────────┐
│   ZK Proof       │ ← Only public signals revealed
└────────┬─────────┘
         │ Submit to blockchain
         ▼
┌──────────────────┐
│   Public Data    │ ← Nullifier, age range, continent
└──────────────────┘
         │
         ▼ PASSPORT DATA DELETED
         ▼ (Image, MRZ, Circuit Input all cleared)
```

### Privacy Guarantees

| Stage | Data Stored | Data Transmitted | Data Revealed |
|-------|-------------|------------------|---------------|
| 1. Scan | Temp image in RAM | None | None |
| 2. Parse | MRZ in RAM | None | None |
| 3. Generate | Circuit input in RAM | None | None |
| 4. Submit | None | ZK proof only | Age range + Continent |
| 5. Complete | Nullifier hash only | Transaction signature | Public signals |

**Critical**: No passport data ever leaves the device or is stored permanently.

## Error Handling

### Layered Error Handling

```swift
// 1. Service Layer - Domain errors
enum PassportError: LocalizedError {
    case invalidMRZ
    case expiredPassport
    case nfcNotSupported
}

// 2. Network Layer - API errors
enum APIError: LocalizedError {
    case invalidResponse
    case rateLimited
    case serverError(String)
}

// 3. Blockchain Layer - Solana errors
enum SolanaError: LocalizedError {
    case walletNotConnected
    case transactionFailed(String)
}

// 4. View Layer - User-friendly messages
.alert("Error", isPresented: $showError) {
    Text(error.localizedDescription)
}
```

## Testing Strategy

### Unit Tests
- Model serialization/deserialization
- Business logic in services
- Utility functions
- Keychain operations

### Integration Tests
- API client requests (mocked server)
- Core Data operations
- End-to-end proof generation (small test circuit)

### UI Tests
- User flows (onboarding, scanning, submission)
- Navigation
- Error states

## Performance Considerations

### Memory Management

1. **Passport Images**: Immediately released after OCR
2. **Large Proofs**: Streamed, not loaded entirely into memory
3. **Core Data**: Batch fetching, faulting for large datasets
4. **Circuit Files**: Loaded on-demand, cached

### Background Tasks

```swift
// Heavy computation on background thread
Task {
    let proof = try await zkProofService.generateProof(input)

    await MainActor.run {
        // Update UI on main thread
        self.generatedProof = proof
    }
}
```

### Caching Strategy

- **Census list**: 5 minute cache
- **Company pages**: 10 minute cache
- **Statistics**: 1 minute cache
- **User profile**: Persistent until logout

## Security Architecture

### Secure Enclaves

1. **Keychain**: Hardware-encrypted storage
2. **Biometrics**: Face ID / Touch ID for sensitive operations
3. **App Sandbox**: Isolated file system

### Network Security

```swift
// Certificate pinning
let evaluators: [String: ServerTrustEvaluating] = [
    "api.zkcensus.io": PinnedCertificatesTrustEvaluator()
]

let trustManager = ServerTrustManager(evaluators: evaluators)
```

### Code Obfuscation

- R8/ProGuard for release builds
- String obfuscation for sensitive constants
- Strip debug symbols

## Deployment Architecture

### Environments

1. **Development**: Local backend, devnet Solana
2. **Staging**: Staging backend, testnet Solana
3. **Production**: Production backend, mainnet Solana

### Configuration

```swift
#if DEBUG
let apiBaseURL = "http://localhost:3000"
let solanaNetwork = "devnet"
#else
let apiBaseURL = "https://api.zkcensus.io"
let solanaNetwork = "mainnet-beta"
#endif
```

## Future Enhancements

### Planned Architecture Changes

1. **Modular Framework**: Extract services into separate Swift Package
2. **SwiftData Migration**: Replace Core Data with SwiftData
3. **Async/Await Everywhere**: Remove completion handlers
4. **Structured Concurrency**: Use task groups for parallel operations
5. **Actor Isolation**: Protect mutable state with actors

---

This architecture balances **simplicity**, **security**, and **privacy** while remaining **scalable** and **maintainable**.
