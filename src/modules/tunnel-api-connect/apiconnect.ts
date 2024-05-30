import * as sodium from 'libsodium-wrappers';
import { clientHello, terminateHello, SendSecureContentParams, sendSecureContent } from './steps/index.js';
import { ApiConnectParams, ApiConnect, ApiData, ApiRequestsDefault } from './types.js';
import { makeClientKeyPair, makeOrRefreshSession } from './utils/index.js';

/** Type predicates
 * https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
 *
 * From Partial<ApiData> to ApiData
 */
const hasFullApiData = (data: Partial<ApiData>): data is ApiData => {
    if (data.clientHello && data.terminateHello) {
        return true;
    }
    return false;
};

/** Return an object that can be used to send secure content through the tunnel
 */
export const apiConnect = async (apiParametersIn: ApiConnectParams): Promise<ApiConnect> => {
    await sodium.ready;

    const apiParameters = {
        ...apiParametersIn,
        ...{ clientKeyPair: apiParametersIn.clientKeyPair ?? makeClientKeyPair() },
    };

    const apiData: Partial<ApiData> = {};
    const api: ApiConnect = {
        apiData,
        apiParameters,
        clientHello: () => clientHello(apiParameters),
        terminateHello: ({ attestation }: { attestation: Buffer }, apiData: Partial<ApiData>) =>
            terminateHello({ ...apiParameters, attestation }, apiData),
        makeOrRefreshSession,
        sendSecureContent: async <R extends ApiRequestsDefault>(
            params: Pick<SendSecureContentParams<R>, 'path' | 'payload'>
        ) => {
            await api.makeOrRefreshSession({ api, apiData });
            if (!hasFullApiData(apiData)) {
                throw new Error('ShouldNotHappen');
            }
            return sendSecureContent({ ...apiParameters, ...apiData.terminateHello, ...params }, apiData);
        },
    };
    return api;
};
