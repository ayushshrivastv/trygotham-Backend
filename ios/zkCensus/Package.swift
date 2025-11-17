// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "zkCensus",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "zkCensus",
            targets: ["zkCensus"]),
    ],
    dependencies: [
        // Solana SDK
        .package(url: "https://github.com/solana-mobile/mobile-wallet-adapter-swift.git", from: "1.0.0"),
        .package(url: "https://github.com/portto/solana-swift.git", from: "1.0.0"),

        // Networking
        .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.8.0"),

        // IPFS
        .package(url: "https://github.com/ipfs-shipyard/swift-ipfs-http-client.git", from: "1.0.0"),

        // QR Code & Scanning
        .package(url: "https://github.com/dmytro-anokhin/url-image.git", from: "3.1.0"),

        // Keychain
        .package(url: "https://github.com/kishikawakatsumi/KeychainAccess.git", from: "4.2.2"),

        // Charts
        .package(url: "https://github.com/danielgindi/Charts.git", from: "5.0.0"),
    ],
    targets: [
        .target(
            name: "zkCensus",
            dependencies: [
                .product(name: "MobileWalletAdapter", package: "mobile-wallet-adapter-swift"),
                .product(name: "Solana", package: "solana-swift"),
                .product(name: "Alamofire", package: "Alamofire"),
                .product(name: "KeychainAccess", package: "KeychainAccess"),
                .product(name: "DGCharts", package: "Charts"),
            ],
            path: ".",
            exclude: ["Supporting", "Resources"]
        ),
        .testTarget(
            name: "zkCensusTests",
            dependencies: ["zkCensus"]),
    ]
)
