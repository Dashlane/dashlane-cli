export class CouldNotFindEnrolledTeamDeviceCredentialsError extends Error {
    constructor() {
        super('Could not find enrolled team device credentials');
    }
}

export class EnrolledTeamDeviceCredentialsWrongFormatError extends Error {
    constructor() {
        super('Enrolled team device credentials has a wrong format');
    }
}

export class DeviceCredentialsWrongFormatError extends Error {
    constructor() {
        super('Device credentials has a wrong format');
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
