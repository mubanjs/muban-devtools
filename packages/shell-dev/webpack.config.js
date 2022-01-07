const path = require('path')
const { createConfig } = require('@muban-devtools/build-tools')
const openInEditor = require('launch-editor-middleware')

module.exports = createConfig({
  entry: {
    devtools: require.resolve('@muban-devtools/shell-host/src/devtools.js'),
    backend: require.resolve('@muban-devtools/shell-host/src/backend.js'),
    hook: require.resolve('@muban-devtools/shell-host/src/hook.js'),
    target: './src/index.js'
  },
  output: {
    path: path.join(__dirname, '/build'),
    publicPath: '/build/',
    filename: '[name].js'
  },
  devtool: '#cheap-module-source-map',
  devServer: {
    quiet: true,
    before (app) {
      app.use('/__open-in-editor', openInEditor())
    }
  }
})
