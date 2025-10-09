import { Callout } from 'nextra/components';
import Link from 'next/link';

export const EnrolledDeviceCredentialsBanner = () => {
    return (
        <Callout emoji="💡">This command needs CLI keys to be used. See <Link href='/business' style={{ textDecoration: 'underline' }}>CLI keys generation</Link>.</Callout>
    );
};

export const AdminBanner = () => {
    return (
        <Callout emoji="🔒">This command is only available to team administrators.</Callout>
    );
};

export const AdminFeatureBanner = () => {
    return (
        <Callout emoji="🔒">This feature is only available to team administrators.</Callout>
    );
};