import sodium from 'libsodium-wrappers';
import { EnclavePcr } from '@dashlane/nsm-attestation';
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

const getEnclavePcrList = (): EnclavePcr<string>[] => {
    if (process.env.DCLI_STAGING_HOST) {
        return [
            [3, '90528150e0f0537fa9e96b067137f6494d525f2fcfd15b478ce28ab2cfaf38dd4e24ad73f9d9d6f238a7f39f2d1956b7'],
        ];
    }

    return [
        [3, 'dfb6428f132530b8c021bea8cbdba2c87c96308ba7e81c7aff0655ec71228122a9297fd31fe5db7927a7322e396e4c16'],
        [8, '4dbb92401207e019e132d86677857081d8e4d21f946f3561b264b7389c6982d3a86bcf9560cef4a2327eac5c5c6ab820'],
    ];
};

/** Return an object that can be used to send secure content through the tunnel
 */
export const apiConnect = async (apiParametersIn: ApiConnectParams): Promise<ApiConnect> => {
    await sodium.ready;

    const apiParameters = {
        ...apiParametersIn,
        enclavePcrList: getEnclavePcrList(),
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
