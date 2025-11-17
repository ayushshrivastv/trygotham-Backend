# zk-Census iOS App

A privacy-preserving passport verification app that uses zero-knowledge proofs to create anonymous census without revealing personal information.

## Overview

The zk-Census iOS app allows users to:

- **Individuals**: Scan passports, generate zero-knowledge proofs, and join census while maintaining privacy
- **Companies**: Create census, verify members, and view aggregate statistics without accessing personal data

### Key Features

- 🛂 **Passport Scanning**: OCR and NFC-based passport reading
- 🔐 **Zero-Knowledge Proofs**: On-device proof generation using SnarkJS
- 🔗 **Solana Integration**: Blockchain-based verification and storage
- 👤 **Dual User Types**: Separate flows for individuals and companies
- 📊 **Privacy-Preserving Analytics**: View demographics without exposing identities
- 🔒 **Complete Privacy**: All passport data processed locally and never transmitted

## Architecture

### Tech Stack

- **UI Framework**: SwiftUI
- **Blockchain**: Solana (Mobile Wallet Adapter)
- **Storage**: Core Data + Keychain
- **Networking**: Alamofire
- **Zero-Knowledge**: SnarkJS (via JavaScriptCore)
- **Passport Scanning**: Vision Framework (OCR) + CoreNFC
- **Deployment Target**: iOS 16.0+

### Project Structure

```
ios/zkCensus/
├── App/                          # Main app entry point
│   ├── zkCensusApp.swift        # App delegate
│   └── ContentView.swift        # Root view
│
├── Core/                         # Core infrastructure
│   ├── Authentication/          # Auth manager
│   ├── Network/                 # Network layer
│   ├── Storage/                 # Core Data models
│   └── Utilities/               # Helpers & extensions
│
├── Features/                     # Feature modules
│   ├── Onboarding/             # User onboarding flows
│   ├── Company/                # Company-specific features
│   ├── User/                   # Individual user features
│   ├── PassportScanner/        # Passport scanning
│   ├── ZKProof/                # ZK proof generation
│   └── Dashboard/              # Statistics & analytics
│
├── Models/                       # Data models
│   ├── UserType.swift          # User types & profiles
│   ├── ZKModels.swift          # ZK proof structures
│   ├── CensusModels.swift      # Census data models
│   └── PassportModels.swift    # Passport data structures
│
├── Services/                     # Business logic services
│   ├── APIService/             # Backend API client
│   ├── SolanaService/          # Blockchain integration
│   ├── ZKProofService/         # Proof generation
│   └── PassportService/        # Passport scanning
│
└── Resources/                    # Assets & configuration
    ├── Assets.xcassets         # Images & colors
    └── Localizable.strings     # Localization
```

## Setup Instructions

### Prerequisites

1. **Xcode 15.0+**
2. **iOS 16.0+ device** (for NFC scanning)
3. **Solana wallet** (Phantom, Solflare, etc.)
4. **Backend server** running (see `../packages/api/README.md`)

### Installation

1. **Clone the repository**
   ```bash
   cd ios/zkCensus
   ```

2. **Install dependencies**

   Dependencies are managed via Swift Package Manager and will be automatically resolved when you open the project in Xcode.

3. **Configure environment**

   Edit `Supporting/Config.xcconfig`:
   ```
   API_BASE_URL = http://localhost:3000
   SOLANA_NETWORK = devnet
   SOLANA_RPC_URL = https://api.devnet.solana.com
   PROGRAM_ID = <your-program-id>
   ```

4. **Add circuit files**

   Place the following files in `Resources/`:
   - `census.wasm` - Circuit WebAssembly
   - `census.zkey` - Proving key
   - `verification_key.json` - Verification key

   Generate these using the circuits package:
   ```bash
   cd ../../packages/circuits
   npm run build
   cp build/* ../../ios/zkCensus/Resources/
   ```

5. **Configure signing**

   In Xcode:
   - Select the zkCensus target
   - Go to Signing & Capabilities
   - Select your development team
   - Enable capabilities:
     - Near Field Communication Tag Reading
     - Keychain Sharing

6. **Add NFC entitlements**

   Create `zkCensus.entitlements`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>com.apple.developer.nfc.readersession.formats</key>
       <array>
           <string>TAG</string>
       </array>
   </dict>
   </plist>
   ```

7. **Build and run**
   ```
   ⌘ + R in Xcode
   ```

## Usage

### For Individuals

1. **Onboarding**
   - Launch app
   - Select "Individual" user type
   - Connect Solana wallet

2. **Scan Passport**
   - Tap "Scan Passport"
   - Choose OCR or NFC method
   - Position passport in camera frame
   - Wait for scan to complete

3. **Generate ZK Proof**
   - Select census to join
   - Wait 30-60s for proof generation
   - Review proof details
   - Submit to blockchain

4. **Manage Connections**
   - Browse companies
   - Request connections
   - Share ZK proofs selectively

### For Companies

1. **Onboarding**
   - Launch app
   - Select "Company" user type
   - Connect Solana wallet
   - Complete company profile

2. **Create Census**
   - Tap "Create Census"
   - Fill in census details
   - Set minimum age requirement
   - Choose privacy settings
   - Submit to blockchain

3. **View Statistics**
   - See total members
   - View age distribution
   - View location distribution (if enabled)
   - Export reports (coming soon)

4. **Manage Members**
   - View connected users
   - Track shared proofs
   - Verify proof validity

## Privacy & Security

### Data Handling

| Data Type | Storage | Transmission | Retention |
|-----------|---------|--------------|-----------|
| Passport MRZ | Never stored | Never transmitted | Deleted immediately |
| Passport Image | Temp memory only | Never transmitted | Deleted after scan |
| NFC Chip Data | Never stored | Never transmitted | Deleted immediately |
| ZK Proof | Local + Blockchain | Encrypted | Permanent |
| Wallet Address | Keychain | HTTPS only | Until logout |
| Nullifier Secret | Keychain | Never transmitted | Permanent |

### Privacy Guarantees

✅ **Zero personal data stored**: Passport info is never saved
✅ **On-device processing**: All ZK proofs generated locally
✅ **Aggregate-only stats**: Only age ranges and continents revealed
✅ **Double-registration prevention**: Nullifiers ensure uniqueness
✅ **Blockchain transparency**: All proofs verifiable on-chain

### Security Features

- 🔐 **Keychain storage** for sensitive data
- 🔒 **Biometric authentication** (optional)
- 🛡️ **Certificate pinning** for API calls
- 🔑 **Wallet signature** verification
- 🚫 **No analytics tracking**
- ⏰ **Auto-cleanup** of sensitive data

## API Integration

The app communicates with the backend API for:

### Endpoints Used

```swift
// Census
POST   /api/v1/census          // Create census
GET    /api/v1/census/:id      // Get census
GET    /api/v1/census          // List all census

// Proofs
POST   /api/v1/proof/submit    // Submit ZK proof
GET    /api/v1/proof/nullifier/:hash  // Check nullifier

// Statistics
GET    /api/v1/stats/:censusId // Census stats
GET    /api/v1/stats           // Global stats

// Company (Extended)
POST   /api/v1/company         // Create company
GET    /api/v1/company         // List companies

// Connections (Extended)
POST   /api/v1/connection      // Request connection
GET    /api/v1/connection      // List connections

// Health
GET    /api/health             // Health check
```

### Error Handling

The app handles:
- Network failures with retry logic
- Rate limiting (429) with exponential backoff
- Invalid proofs with user feedback
- Blockchain transaction failures
- Wallet connection issues

## Testing

### Unit Tests

Run tests in Xcode:
```
⌘ + U
```

Test coverage includes:
- Model serialization/deserialization
- ZK proof generation logic
- API client requests
- Keychain operations
- Passport MRZ parsing

### Integration Tests

Test end-to-end flows:
1. Onboarding → Wallet Connection
2. Passport Scan → Proof Generation → Submission
3. Census Creation → Member Join
4. Statistics Update

### Manual Testing Checklist

- [ ] Onboarding (Company & Individual)
- [ ] Wallet connection/disconnection
- [ ] Passport OCR scanning
- [ ] NFC passport reading (requires physical passport)
- [ ] ZK proof generation
- [ ] Proof submission to blockchain
- [ ] Census creation
- [ ] Statistics viewing
- [ ] Company search & connection
- [ ] Proof sharing
- [ ] Sign out & data cleanup

## Troubleshooting

### Common Issues

**1. "Wallet not connected"**
- Ensure Solana wallet app is installed
- Grant permission when prompted
- Try disconnecting and reconnecting

**2. "Failed to scan passport"**
- Use good lighting
- Ensure MRZ is clearly visible
- Clean camera lens
- Try NFC if OCR fails

**3. "Proof generation failed"**
- Ensure circuit files are present
- Check device has sufficient memory
- Wait full 60 seconds before canceling

**4. "Transaction failed"**
- Check wallet has SOL for fees
- Ensure network is not congested
- Verify program ID is correct

**5. "NFC not available"**
- NFC requires iPhone 7 or newer
- Check NFC is enabled in Settings
- Ensure passport has chip (ePassport symbol)

### Debug Mode

Enable debug logging:
```swift
// In zkCensusApp.swift
UserDefaults.standard.set(true, forKey: "DEBUG_MODE")
```

View logs:
```bash
# In Xcode Console
# Filter by "zkCensus"
```

## Performance Optimization

### ZK Proof Generation

- **Expected time**: 30-60 seconds on iPhone 12+
- **Memory usage**: ~200MB peak during generation
- **Optimization**: Uses WASM for maximum performance
- **Background**: Runs on background thread to keep UI responsive

### Camera Scanning

- **OCR time**: 2-5 seconds
- **Accuracy**: 95%+ with good lighting
- **Optimization**: Uses Vision framework ML model

### Network Requests

- **Caching**: Census data cached for 5 minutes
- **Compression**: Gzip compression enabled
- **Timeout**: 30s for API calls, 5min for proof submission

## Deployment

### TestFlight

1. Archive build in Xcode
2. Upload to App Store Connect
3. Add to TestFlight
4. Invite testers
5. Share install link

### App Store

1. Complete App Store metadata
2. Prepare screenshots (6.7", 6.5", 5.5")
3. Write privacy policy
4. Submit for review
5. Address review feedback

### Required Disclosures

- Camera usage (passport scanning)
- NFC usage (passport chip reading)
- Network usage (API communication)
- Keychain usage (secure storage)
- No data collection or tracking

## Roadmap

### v1.1 (Planned)
- [ ] Biometric authentication
- [ ] Multi-language support
- [ ] Dark mode refinements
- [ ] Offline mode support
- [ ] Export statistics to PDF

### v1.2 (Future)
- [ ] Widget support
- [ ] Watch app
- [ ] Face ID for sensitive operations
- [ ] Advanced filtering
- [ ] Push notifications

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](../../LICENSE) file.

## Support

- **Issues**: GitHub Issues
- **Email**: support@zkcensus.io
- **Discord**: [Join our server](https://discord.gg/zkcensus)

## Acknowledgments

- SnarkJS team for ZK proof libraries
- Solana Mobile for wallet adapter
- ICAO for passport standards
- Zero-knowledge community

---

**Built with privacy in mind. Your data, your control.**
