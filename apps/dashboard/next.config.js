//@ts-check

import { composePlugins, withNx } from '@nx/next';

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

const config = composePlugins(...plugins)(nextConfig);

// Workaround for Next.js 16 / Nx 20 compatibility where these keys are now deprecated/unsupported in next.config.js
// @ts-ignore
if (config.eslint) delete config.eslint;
// @ts-ignore
if (config.typescript) delete config.typescript;

export default config;
