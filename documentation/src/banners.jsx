import { Callout } from 'nextra/components';
import Link from 'next/link';

export const TeamCredentialsBanner = () => {
    return (
        <Callout emoji="💡">This command needs team credentials to be used. See <Link href='/business' style={{ textDecoration: 'underline' }}>team credentials generation</Link>.</Callout>
    );
};

export const AdminBanner = () => {
    return (
        <Callout emoji="🔒">This command is only available to team administrators.</Callout>
    );
};