import { getGoogleAuthUrl } from '../../../../lib/google';

export const GET = async () => {
    const url = await getGoogleAuthUrl();
    return new Response(null, {
        status: 302,
        headers: {
            Location: url,
        },
    });
};
