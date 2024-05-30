import { CloudflareStagingCredentialsNotSetError } from '../errors.js';

export const initStagingCheck = () => {
    if (process.env.DCLI_STAGING_HOST) {
        if (process.env.CLOUDFLARE_SERVICE_TOKEN_ACCESS && process.env.CLOUDFLARE_SERVICE_TOKEN_SECRET) {
            return;
        }
        throw new CloudflareStagingCredentialsNotSetError();
    }
};
