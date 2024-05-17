import { JSONSchema4 } from 'json-schema';

/**
 * https://docs.aws.amazon.com/enclaves/latest/user/verify-root.html
 * Attestation document specification
 * - user_data = bytes .size (0..1024)
 * To accommodate base64 encoding 1024 * 1.3 ~= 1332
 */
export const attestationUserDataSchema: JSONSchema4 = {
    type: 'object',
    description: 'User data from verifyAttestation',
    properties: {
        publicKey: {
            type: 'string',
            base64: true,
            maxLength: 1500,
            minLength: 4,
        },
        header: {
            type: 'string',
            base64: true,
            maxLength: 1500,
            minLength: 4,
        },
    },
    required: ['publicKey', 'header'],
    additionalProperties: false,
};

export const clientHelloResponseSchema: JSONSchema4 = {
    type: 'object',
    properties: {
        attestation: {
            type: 'string',
            pattern: '^[A-Fa-f0-9]+$',
            description: 'NSM enclave attestation in hexadecimal format',
        },
        tunnelUuid: {
            type: 'string',
            description: 'The UUID of the tunnel used for the cryptographic session',
        },
    },
    required: ['attestation', 'tunnelUuid'],
    additionalProperties: false,
};

export const secureContentBodyDataSchema: JSONSchema4 = {
    type: 'object',
    description: 'Send secure content data',
    properties: {
        encryptedData: {
            type: 'string',
            // TODO: Extends AJV with an `encoding` keyword to support base64 | hex
            pattern: '^[A-Fa-f0-9]+$',
        },
    },
    required: ['encryptedData'],
    additionalProperties: false,
};
