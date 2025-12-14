import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Minimal Flow Writer',
        short_name: 'Flow Writer',
        description: 'A minimal writing space with ambient sounds',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
            {
                src: '/file.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
            },
            {
                src: '/file.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
            },
        ],
    };
}
