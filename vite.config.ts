import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import type { Plugin, Rollup } from 'vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Libraries like @tanstack/react-router and @mantine/core ship "use client"
// directives for Next.js App Router compatibility. They're meaningless
// outside an RSC bundler and Rollup already strips them correctly — this
// warning is just noise. Applied via configEnvironment (after nitro() in the
// plugins array) since nitro's own environment config otherwise overrides a
// plain top-level build.rollupOptions.onwarn for its "nitro" environment.
const suppressUseClientDirectiveWarning: Plugin = {
  name: 'suppress-use-client-directive-warning',
  configEnvironment(_name, config) {
    const existingOnwarn = config.build?.rollupOptions?.onwarn;
    config.build ??= {};
    config.build.rollupOptions ??= {};
    const onwarn: Rollup.WarningHandlerWithDefault = (warning, warn) => {
      if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
      if (existingOnwarn) existingOnwarn(warning, warn);
      else warn(warning);
    };
    config.build.rollupOptions.onwarn = onwarn;
  },
};

// Over HTTP/2 a browser sends the host only as the ":authority" pseudo-header.
// Nitro's dev proxy then forwards the request with its internal worker address
// as the host, which breaks every URL built from it (OAuth and bank
// redirects). Adding a "host" header from ":authority" keeps the real one; the
// proxy copies rawHeaders, so it goes there too.
const keepHostOverHttp2: Plugin = {
  name: 'keep-host-over-http2',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const authority = req.headers[':authority'];
      if (!req.headers.host && typeof authority === 'string') {
        req.headers.host = authority;
        req.rawHeaders.push('host', authority);
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [
    keepHostOverHttp2,
    basicSsl(),
    tsconfigPaths(),
    tanstackStart(),
    nitro(),
    viteReact(),
    suppressUseClientDirectiveWarning,
  ],
});
