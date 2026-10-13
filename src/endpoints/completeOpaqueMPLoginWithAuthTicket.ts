import { requestAppApi } from '../requestApi.js';

interface completeOpaqueMPLoginWithAuthTicketParams {
    authTicket: string;
    finishLoginRequest: string;
    login: string;
    opaqueMPLoginFlowId: string;
}

export interface completeOpaqueMPLoginWithAuthTicketOutput {
    authTicket: {
        ticket: string;
        expireDateUnix: number;
    };
}

export const completeOpaqueMPLoginWithAuthTicket = (params: completeOpaqueMPLoginWithAuthTicketParams) =>
    requestAppApi<completeOpaqueMPLoginWithAuthTicketOutput>({
        path: 'authentication/CompleteOpaqueMPLoginWithAuthTicket',
        payload: {
            authTicket: params.authTicket,
            login: params.login,
            finishLoginRequest: params.finishLoginRequest,
            opaqueMPLoginFlowId: params.opaqueMPLoginFlowId,
        },
    });
