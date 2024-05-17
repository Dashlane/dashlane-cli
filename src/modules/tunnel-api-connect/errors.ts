export class HTTPError extends Error {
    constructor(
        readonly statusCode: number,
        readonly message: string
    ) {
        super(`HTTP error: ${statusCode}`);
    }
}

export class ApiError extends Error {
    constructor(
        readonly status: string,
        readonly code: string,
        readonly message: string
    ) {
        super(`Api error: ${code}`);
    }
}

export class SecureTunnelNotInitialized extends Error {
    constructor() {
        super('Secure tunnel not initialized');
    }
}

export class SendSecureContentDataDecryptionError extends Error {
    constructor() {
        super('Send secure content data decryption error');
    }
}
