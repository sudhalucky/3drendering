const path = require('path');

module.exports = {
    mode: "development",
    devtool: 'eval-source-map',
//    entry: ['./src/index.js', './src/volumeapi.js'],
    entry: ['./src/index.js', './src/3d-rendering.js'],
//    entry: ['./src/local.js', './src/htmlSetup.js', './src/uids.js'],
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'public'),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        port: 3000,
        headers: {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"          },
    }
};