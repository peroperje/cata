import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
    manifest_version: 3,
    name: 'AI Job Auto-Filler',
    version: '1.0.4',
    permissions: ['storage', 'activeTab', 'scripting', 'sidePanel'],
    action: {
    },
    side_panel: {
        default_path: 'src/popup/index.html',
    },
    background: {
        service_worker: 'src/background/index.ts',
        type: 'module',
    },
    content_scripts: [
        {
            matches: ['<all_urls>'],
            js: ['src/content/index.ts'],
        },
    ],
    host_permissions: ['<all_urls>'],
})
