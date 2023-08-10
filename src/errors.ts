export class CouldNotFindTeamCredentialsError extends Error {
    constructor() {
        super('Could not find team credentials');
    }
}

export class InvalidDashlanePathError extends Error {
    constructor() {
        super('Invalid Dashlane path');
    }
}
