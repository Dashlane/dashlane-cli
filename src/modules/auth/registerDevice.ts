import { completeDeviceRegistration } from '../../endpoints/index.js';
import { getAuthenticationTickets } from './getAuthenticationTickets.js';

interface RegisterDevice {
    login: string;
    deviceName: string;
}

export const registerDevice = async ({ deviceName, login }: RegisterDevice) => {
    const { authTicket, ssoSpKey } = await getAuthenticationTickets(login);

    // Complete the device registration and save the result
    const completeDeviceRegistrationResponse = await completeDeviceRegistration({ login, deviceName, authTicket });
    return { ...completeDeviceRegistrationResponse, ssoSpKey, authTicket };
};
