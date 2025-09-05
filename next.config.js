const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Solo ejecutar esta lógica en el build del servidor
    if (isServer) {
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, 'node_modules/pdfkit/js/data'),
              to: path.resolve(__dirname, '.next/server/vendor-chunks/data'),
            },
          ],
        })
      );

      // Esto es necesario para que pdfkit pueda encontrar los archivos en la nueva ubicación
      config.externals.push({
        './data': `require('./data')`,
      });
    }

    return config;
  },
};

module.exports = nextConfig;