import { RefreshSessionParams } from '../types';

export const makeOrRefreshSession = async ({ api, apiData }: RefreshSessionParams) => {
    if (apiData.clientHello && apiData.clientHello.tunnelUuid && apiData.terminateHello) {
        return;
    }
    const clientHelloResponse = await api.clientHello();
    apiData.clientHello = clientHelloResponse;

    const terminateHelloResponse = await api.terminateHello(
        { ...api.apiParameters, attestation: clientHelloResponse.attestation },
        apiData
    );
    apiData.terminateHello = terminateHelloResponse;
};
