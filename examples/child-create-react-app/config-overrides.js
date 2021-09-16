module.exports = {
  devServer: function(configFunction) {
    return function(proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
      config.headers = {'Access-Control-Allow-Origin': '*'}
      return config;
    };
  },
  webpack: function(config, env) {
    config.output.publicPath = 'http://localhost:8001/'
    return config;
  },
};