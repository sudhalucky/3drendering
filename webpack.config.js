const path = require('path');

module.exports = {
    mode: "development",
    devtool: 'eval-source-map',
    entry: ['./src/index.js', './src/3d-rendering.js'],
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'public'),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        port: 9000,
    }
};