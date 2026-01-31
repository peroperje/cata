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
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

const configFn = composePlugins(...plugins)(nextConfig);

/**
 * Workaround for Next.js 16 compatibility.
 * Next.js 16 no longer supports 'eslint' and 'typescript' keys in next.config.js.
 * We wrap the configuration function to remove these keys before Next.js processes them.
 */
/**
 * @param {any} phase
 * @param {any} context
 */
export default async (phase, context) => {
  const fullConfig = await (typeof configFn === 'function'
    ? configFn(phase, context)
    : configFn);

  const config = /** @type {any} */ (fullConfig);

  if (config.eslint) {
    delete config.eslint;
  }
  if (config.typescript) {
    delete config.typescript;
  }

  return config;
};
