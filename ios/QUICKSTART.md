# Quick Start Guide - zk-Census iOS App

Get the zk-Census iOS app running in under 10 minutes!

## Prerequisites Checklist

- [ ] macOS Ventura (13.0) or later
- [ ] Xcode 15.0 or later
- [ ] iOS device with iOS 16.0+ (or simulator)
- [ ] Solana wallet app installed (for testing on device)
- [ ] Backend server running (see instructions below)

## Step 1: Start the Backend (5 minutes)

```bash
# Navigate to project root
cd Calindria

# Install dependencies
pnpm install

# Set up environment variables
cp packages/api/.env.example packages/api/.env

# Edit .env with your settings
nano packages/api/.env

# Start services with Docker
docker-compose up -d

# Or start manually
pnpm --filter @zk-census/api dev
```

Verify backend is running:
```bash
curl http://localhost:3000/api/health
# Should return: {"status":"ok"}
```

## Step 2: Set Up iOS Project (2 minutes)

```bash
# Navigate to iOS directory
cd ios/zkCensus

# The project uses Swift Package Manager - dependencies will auto-resolve
# No additional installation needed!
```

## Step 3: Configure the App (1 minute)

1. Open `Supporting/Config.xcconfig`
2. Verify settings:

```xcconfig
API_BASE_URL = http://localhost:3000
SOLANA_NETWORK = devnet
SOLANA_RPC_URL = https://api.devnet.solana.com
PROGRAM_ID = Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

## Step 4: Add Circuit Files (2 minutes)

```bash
# Build circuits (from project root)
cd packages/circuits
npm install
npm run build

# Copy to iOS app
cp build/census.wasm ../../ios/zkCensus/Resources/
cp build/census.zkey ../../ios/zkCensus/Resources/
cp build/verification_key.json ../../ios/zkCensus/Resources/
```

**Note**: For quick testing, you can skip this step initially. The app will use mock proofs.

## Step 5: Open in Xcode

```bash
cd ios/zkCensus
open zkCensus.xcodeproj
```

Or simply double-click `zkCensus.xcodeproj` in Finder.

## Step 6: Configure Signing

1. In Xcode, select the **zkCensus** target
2. Go to **Signing & Capabilities**
3. Select your **Team**
4. Xcode will automatically manage signing

## Step 7: Run the App

### On Simulator (Quickest)

1. Select a simulator (iPhone 15 Pro recommended)
2. Press `⌘ + R` or click the Play button
3. App will launch in ~30 seconds

**Note**: NFC scanning won't work in simulator. Use OCR mode for testing.

### On Physical Device (For NFC)

1. Connect iPhone via USB
2. Select your device from the device menu
3. Press `⌘ + R`
4. Trust the developer certificate on your device when prompted
5. App will install and launch

## Step 8: Test the App (3 minutes)

### Test as Individual User

1. Launch app
2. Tap **"Individual"**
3. Tap **"Connect Wallet"**
   - In simulator: Mock wallet will connect
   - On device: Choose wallet app (Phantom/Solflare)
4. Grant permissions
5. You're in! 🎉

### Test Passport Scanning (Simulator)

1. Tap **"Scan Passport"**
2. Select **"Camera (OCR)"** mode
3. Tap **"Start Scan"**
   - In simulator: Will use mock passport data
4. Select a census
5. Wait for proof generation (~30s in simulator)
6. Submit proof

### Test as Company

1. Sign out
2. Tap **"Company"**
3. Fill in company details:
   - Name: "Test Company"
   - Description: "Testing zk-Census"
4. Tap **"Connect Wallet & Create Profile"**
5. Create a census:
   - Tap **"+"** button
   - Name: "Test Census"
   - Description: "My first census"
   - Min Age: 18
   - Tap **"Create"**

## Common Quick Start Issues

### 1. "Cannot connect to API"

**Solution**:
```bash
# Check backend is running
curl http://localhost:3000/api/health

# If not, start it
cd packages/api
pnpm dev
```

### 2. "Failed to load circuit files"

**Solution**:
```bash
# Verify files exist
ls -la ios/zkCensus/Resources/census.*

# If missing, build circuits
cd packages/circuits
npm run build
```

### 3. "Signing certificate issue"

**Solution**:
1. Xcode → Preferences → Accounts
2. Add your Apple ID
3. Download manual profiles
4. Select team in Signing & Capabilities

### 4. "Wallet not connecting"

**Simulator Solution**:
- Use mock wallet (automatic in simulator)

**Device Solution**:
- Install a wallet app (Phantom recommended)
- Ensure wallet has testnet SOL
- Grant permissions when prompted

### 5. "Build errors"

**Solution**:
```bash
# Clean build folder
⌘ + Shift + K

# Reset package cache
File → Packages → Reset Package Caches

# Build again
⌘ + R
```

## Testing Without Backend

To test the UI without running the backend:

1. Open `Services/APIService/APIClient.swift`
2. Enable mock mode:

```swift
class APIClient {
    private let useMockData = true  // Set to true

    func listCensuses() async throws -> [CensusMetadata] {
        if useMockData {
            return MockData.censuses
        }
        // ... normal implementation
    }
}
```

## Next Steps

Now that you have the app running:

1. **Explore Features**:
   - Try different user flows
   - Create multiple census
   - Test passport scanning with a real passport (device only)

2. **Customize**:
   - Change app theme colors
   - Modify census requirements
   - Add new census types

3. **Deploy**:
   - See [README.md](README.md) for deployment instructions
   - Configure production backend
   - Submit to TestFlight

## Development Tips

### Enable Debug Mode

In `zkCensusApp.swift`:
```swift
init() {
    #if DEBUG
    UserDefaults.standard.set(true, forKey: "DEBUG_MODE")
    print("🐛 Debug mode enabled")
    #endif
}
```

### Hot Reload

SwiftUI supports live previews:
1. Open any View file
2. Click "Resume" in preview canvas
3. Edit view → See changes instantly

### Useful Shortcuts

- `⌘ + R` - Build & Run
- `⌘ + .` - Stop running
- `⌘ + Shift + K` - Clean build
- `⌘ + U` - Run tests
- `⌘ + B` - Build only
- `⌘ + /` - Toggle comment

## Resources

- **Full Documentation**: [README.md](README.md)
- **Architecture Guide**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Backend Setup**: [../packages/api/README.md](../packages/api/README.md)
- **Circuits Guide**: [../packages/circuits/README.md](../packages/circuits/README.md)

## Getting Help

**Stuck?** Check these resources:

1. **Logs**: Xcode console (⌘ + Shift + Y)
2. **Network**: Charles Proxy / Proxyman for API debugging
3. **Issues**: [GitHub Issues](https://github.com/ayushshrivastv/Calindria/issues)
4. **Community**: Discord server

## Congratulations! 🎉

You now have a fully functional privacy-preserving identity verification system running locally!

**What's next?**
- Invite friends to test
- Create real census for your organization
- Contribute features or improvements
- Deploy to production

Happy coding! 🚀
