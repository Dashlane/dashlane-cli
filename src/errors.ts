export class CouldNotFindTeamCredentialsError extends Error {
    constructor() {
        super('Could not find team credentials');
    }
}

export class TeamCredentialsWrongFormatError extends Error {
    constructor() {
        super('Team credentials has a wrong format');
    }
}

export class InvalidDashlanePathError extends Error {
    constructor() {
        super('Invalid Dashlane path');
    }
}

export class CloudflareStagingCredentialsNotSetError extends Error {
    constructor() {
        super('Cloudflare staging credentials not set');
    }
}
