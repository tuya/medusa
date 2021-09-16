module.exports = {
  // The Webpack config to use when compiling your react app for development or production.
  webpack: function(config, env) {
    // ...add your webpack config
    config.resolve = config.resolve || {}
    config.resolve.alias = config.resolve.alias || {}

    return config;
  },
}