import { requestAppApi } from '../requestApi.js';

interface requestOpaqueMPLoginWithAuthTicketParams {
    authTicket: string;
    login: string;
    loginRequest: string;
}

export interface requestOpaqueMPLoginWithAuthTicketOutput {
    loginResponse: string;
    opaqueMPLoginFlowId: string;
}

export const requestOpaqueMPLoginWithAuthTicket = (params: requestOpaqueMPLoginWithAuthTicketParams) =>
    requestAppApi<requestOpaqueMPLoginWithAuthTicketOutput>({
        path: 'authentication/RequestOpaqueMPLoginWithAuthTicket',
        payload: {
            authTicket: params.authTicket,
            login: params.login,
            loginRequest: params.loginRequest,
        },
    });
