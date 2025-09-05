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
              to: path.resolve(__dirname, '.next/server/app/api/admin/send-report/data'),
            },
          ],
        })
      );
    }

    return config;
  },
};

module.exports = nextConfig;