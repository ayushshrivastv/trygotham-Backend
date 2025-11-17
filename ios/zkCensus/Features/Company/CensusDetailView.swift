import SwiftUI
import Charts

struct CensusDetailView: View {
    let census: CensusMetadata

    @State private var stats: CensusStatistics?
    @State private var isLoading = false
    @State private var showCloseCensus = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                headerView

                // Statistics
                if let stats = stats {
                    statisticsView(stats: stats)
                } else if isLoading {
                    ProgressView("Loading statistics...")
                        .frame(maxWidth: .infinity, alignment: .center)
                }

                // Census Info
                censusInfoView
            }
            .padding()
        }
        .navigationTitle(census.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button {
                        // Share census
                    } label: {
                        Label("Share", systemImage: "square.and.arrow.up")
                    }

                    if census.active {
                        Button(role: .destructive) {
                            showCloseCensus = true
                        } label: {
                            Label("Close Census", systemImage: "xmark.circle")
                        }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .task {
            await loadStatistics()
        }
        .confirmationDialog("Close Census", isPresented: $showCloseCensus) {
            Button("Close Census", role: .destructive) {
                closeCensus()
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("Are you sure you want to close this census? No new members will be able to join.")
        }
    }

    private var headerView: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(census.name)
                        .font(.title2)
                        .fontWeight(.bold)

                    Text(census.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                StatusBadge(isActive: census.active)
            }

            HStack(spacing: 16) {
                Label(census.memberCount, systemImage: "person.2.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)

                if census.enableLocation {
                    Label("Location", systemImage: "location.fill")
                        .font(.caption)
                        .foregroundColor(.blue)
                }

                Text("Min age: \(census.minAge)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text("Created \(census.createdAt.formatted(date: .abbreviated, time: .omitted))")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .cornerRadius(12)
    }

    private func statisticsView(stats: CensusStatistics) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Statistics")
                .font(.title3)
                .fontWeight(.semibold)

            // Total Members Card
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Total Members")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Text("\(stats.totalMembers)")
                        .font(.system(size: 48, weight: .bold))
                        .foregroundColor(.blue)
                }

                Spacer()

                Image(systemName: "person.3.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.blue.opacity(0.3))
            }
            .padding()
            .background(Color.blue.opacity(0.1))
            .cornerRadius(12)

            // Age Distribution
            VStack(alignment: .leading, spacing: 12) {
                Text("Age Distribution")
                    .font(.headline)

                ForEach(stats.ageData, id: \.range) { item in
                    DistributionBar(
                        label: item.range.displayName,
                        value: item.count,
                        total: stats.totalMembers,
                        color: .blue
                    )
                }
            }
            .padding()
            .background(Color.gray.opacity(0.05))
            .cornerRadius(12)

            // Location Distribution
            if census.enableLocation && !stats.continentData.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Location Distribution")
                        .font(.headline)

                    ForEach(stats.continentData, id: \.continent) { item in
                        DistributionBar(
                            label: item.continent.displayName,
                            value: item.count,
                            total: stats.totalMembers,
                            color: .green
                        )
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.05))
                .cornerRadius(12)
            }

            Text("Last updated: \(stats.lastUpdated.formatted(date: .abbreviated, time: .shortened))")
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .center)
        }
    }

    private var censusInfoView: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Census Information")
                .font(.title3)
                .fontWeight(.semibold)

            VStack(alignment: .leading, spacing: 8) {
                InfoRow(label: "Census ID", value: census.id)
                InfoRow(label: "Merkle Root", value: String(census.merkleRoot.prefix(16)) + "...")

                if let ipfsHash = census.ipfsHash {
                    InfoRow(label: "IPFS Hash", value: String(ipfsHash.prefix(16)) + "...")
                }
            }
            .padding()
            .background(Color.gray.opacity(0.05))
            .cornerRadius(12)
        }
    }

    private func loadStatistics() async {
        isLoading = true
        defer { isLoading = false }

        do {
            stats = try await APIClient.shared.getCensusStats(censusId: census.id)
        } catch {
            print("Failed to load statistics: \(error)")
        }
    }

    private func closeCensus() {
        Task {
            do {
                let signature = try await SolanaService.shared.signMessage("Close census: \(census.id)")
                _ = try await APIClient.shared.closeCensus(id: census.id, signature: signature)
                // Refresh or navigate back
            } catch {
                print("Failed to close census: \(error)")
            }
        }
    }
}

struct InfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.system(.caption, design: .monospaced))
                .foregroundColor(.primary)
        }
    }
}

#Preview {
    NavigationStack {
        CensusDetailView(census: CensusMetadata(
            id: "test-123",
            name: "Sample Census",
            description: "A sample census for testing",
            creator: "test-creator",
            createdAt: Date(),
            active: true,
            enableLocation: true,
            minAge: 18,
            merkleRoot: "0x1234567890abcdef",
            ipfsHash: "QmTest123",
            totalMembers: 150,
            ageDistribution: [10, 20, 30, 40, 25, 15, 10],
            continentDistribution: [5, 30, 50, 20, 15, 20, 10],
            lastUpdated: Date()
        ))
    }
}
