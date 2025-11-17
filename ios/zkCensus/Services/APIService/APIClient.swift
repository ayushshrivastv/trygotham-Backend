import Foundation
import Alamofire

/// API Client for communicating with the zk-Census backend
class APIClient {
    static let shared = APIClient()

    private let baseURL: String
    private let session: Session

    private init() {
        // Read from config or environment
        self.baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:3000"

        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 300

        // Rate limiting handling
        let interceptor = APIInterceptor()

        self.session = Session(
            configuration: configuration,
            interceptor: interceptor
        )
    }

    // MARK: - Census APIs

    func createCensus(_ request: CreateCensusRequest) async throws -> CensusMetadata {
        return try await session.request(
            "\(baseURL)/api/v1/census",
            method: .post,
            parameters: request,
            encoder: JSONParameterEncoder.default
        )
        .validate()
        .serializingDecodable(CensusMetadata.self)
        .value
    }

    func getCensus(id: String) async throws -> CensusMetadata {
        return try await session.request(
            "\(baseURL)/api/v1/census/\(id)",
            method: .get
        )
        .validate()
        .serializingDecodable(CensusMetadata.self)
        .value
    }

    func listCensuses() async throws -> [CensusMetadata] {
        struct Response: Decodable {
            let censuses: [CensusMetadata]
        }

        let response: Response = try await session.request(
            "\(baseURL)/api/v1/census",
            method: .get
        )
        .validate()
        .serializingDecodable(Response.self)
        .value

        return response.censuses
    }

    func closeCensus(id: String, signature: String) async throws -> CensusMetadata {
        struct Request: Encodable {
            let signature: String
        }

        return try await session.request(
            "\(baseURL)/api/v1/census/\(id)/close",
            method: .post,
            parameters: Request(signature: signature),
            encoder: JSONParameterEncoder.default
        )
        .validate()
        .serializingDecodable(CensusMetadata.self)
        .value
    }

    // MARK: - Proof APIs

    func submitProof(_ request: SubmitProofRequest) async throws -> SubmitProofResponse {
        return try await session.request(
            "\(baseURL)/api/v1/proof/submit",
            method: .post,
            parameters: request,
            encoder: JSONParameterEncoder.default
        )
        .validate()
        .serializingDecodable(SubmitProofResponse.self)
        .value
    }

    func verifyProof(_ proof: CensusProof) async throws -> Bool {
        struct Request: Encodable {
            let proof: CensusProof
        }

        struct Response: Decodable {
            let valid: Bool
        }

        let response: Response = try await session.request(
            "\(baseURL)/api/v1/proof/verify",
            method: .post,
            parameters: Request(proof: proof),
            encoder: JSONParameterEncoder.default
        )
        .validate()
        .serializingDecodable(Response.self)
        .value

        return response.valid
    }

    func checkNullifier(_ hash: String) async throws -> Bool {
        struct Response: Decodable {
            let exists: Bool
        }

        let response: Response = try await session.request(
            "\(baseURL)/api/v1/proof/nullifier/\(hash)",
            method: .get
        )
        .validate()
        .serializingDecodable(Response.self)
        .value

        return response.exists
    }

    // MARK: - Statistics APIs

    func getCensusStats(censusId: String) async throws -> CensusStatistics {
        return try await session.request(
            "\(baseURL)/api/v1/stats/\(censusId)",
            method: .get
        )
        .validate()
        .serializingDecodable(CensusStatistics.self)
        .value
    }

    func getGlobalStats() async throws -> CensusStatistics {
        return try await session.request(
            "\(baseURL)/api/v1/stats",
            method: .get
        )
        .validate()
        .serializingDecodable(CensusStatistics.self)
        .value
    }

    // MARK: - Company APIs (Extended)

    func createCompanyPage(_ request: CreateCompanyPageRequest) async throws -> CompanyPage {
        return try await session.request(
            "\(baseURL)/api/v1/company",
            method: .post,
            parameters: request,
            encoder: JSONParameterEncoder.default
        )
        .validate()
        .serializingDecodable(CompanyPage.self)
        .value
    }

    func getCompanyPage(id: String) async throws -> CompanyPage {
        return try await session.request(
            "\(baseURL)/api/v1/company/\(id)",
            method: .get
        )
        .validate()
        .serializingDecodable(CompanyPage.self)
        .value
    }

    func listCompanies() async throws -> [CompanyPage] {
        struct Response: Decodable {
            let companies: [CompanyPage]
        }

        let response: Response = try await session.request(
            "\(baseURL)/api/v1/company",
            method: .get
        )
        .validate()
        .serializingDecodable(Response.self)
        .value

        return response.companies
    }

    // MARK: - Connection APIs (Extended)

    func createConnection(companyId: String, message: String?) async throws -> ConnectionRequest {
        struct Request: Encodable {
            let companyId: String
            let message: String?
        }

        return try await session.request(
            "\(baseURL)/api/v1/connection",
            method: .post,
            parameters: Request(companyId: companyId, message: message),
            encoder: JSONParameterEncoder.default
        )
        .validate()
        .serializingDecodable(ConnectionRequest.self)
        .value
    }

    func getUserConnections() async throws -> [UserConnection] {
        struct Response: Decodable {
            let connections: [UserConnection]
        }

        let response: Response = try await session.request(
            "\(baseURL)/api/v1/connection",
            method: .get
        )
        .validate()
        .serializingDecodable(Response.self)
        .value

        return response.connections
    }

    // MARK: - ZK Share APIs (Extended)

    func shareZKProof(companyId: String, censusId: String, nullifierHash: String) async throws -> ZKShare {
        struct Request: Encodable {
            let companyId: String
            let censusId: String
            let nullifierHash: String
        }

        return try await session.request(
            "\(baseURL)/api/v1/share",
            method: .post,
            parameters: Request(companyId: companyId, censusId: censusId, nullifierHash: nullifierHash),
            encoder: JSONParameterEncoder.default
        )
        .validate()
        .serializingDecodable(ZKShare.self)
        .value
    }

    func revokeZKShare(shareId: String) async throws {
        _ = try await session.request(
            "\(baseURL)/api/v1/share/\(shareId)/revoke",
            method: .post
        )
        .validate()
        .serializingData()
        .value
    }

    // MARK: - Health Check

    func healthCheck() async throws -> Bool {
        struct HealthResponse: Decodable {
            let status: String
        }

        let response: HealthResponse = try await session.request(
            "\(baseURL)/api/health",
            method: .get
        )
        .validate()
        .serializingDecodable(HealthResponse.self)
        .value

        return response.status == "ok"
    }
}

// MARK: - Request Interceptor

class APIInterceptor: RequestInterceptor {
    func adapt(_ urlRequest: URLRequest, for session: Session, completion: @escaping (Result<URLRequest, Error>) -> Void) {
        var urlRequest = urlRequest

        // Add headers
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("zkCensus-iOS/1.0", forHTTPHeaderField: "User-Agent")

        // Add authentication token if available
        if let token = KeychainManager.shared.get(key: "auth_token") {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        completion(.success(urlRequest))
    }

    func retry(_ request: Request, for session: Session, dueTo error: Error, completion: @escaping (RetryResult) -> Void) {
        guard let response = request.task?.response as? HTTPURLResponse else {
            completion(.doNotRetryWithError(error))
            return
        }

        // Retry on 429 (rate limit) with exponential backoff
        if response.statusCode == 429 {
            let retryAfter = response.allHeaderFields["Retry-After"] as? String
            let delay = Double(retryAfter ?? "5") ?? 5.0

            completion(.retryWithDelay(delay))
            return
        }

        // Retry on 5xx errors (server issues)
        if (500...599).contains(response.statusCode) {
            completion(.retryWithDelay(2.0))
            return
        }

        completion(.doNotRetry)
    }
}

// MARK: - API Error

enum APIError: LocalizedError {
    case invalidResponse
    case serverError(String)
    case rateLimited
    case unauthorized
    case notFound
    case unknown

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from server"
        case .serverError(let message):
            return "Server error: \(message)"
        case .rateLimited:
            return "Too many requests. Please try again later."
        case .unauthorized:
            return "Unauthorized. Please sign in again."
        case .notFound:
            return "Resource not found"
        case .unknown:
            return "An unknown error occurred"
        }
    }
}
