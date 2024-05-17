export class SAMLResponseNotFound extends Error {
    constructor() {
        super('SAML Response not found');
    }
}
