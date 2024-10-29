const { defineConfig } = require("@vue/cli-service");
const path = require("path");

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    proxy: {
      '^/api/admin': {
        target: process.env.VUE_APP_PLATFORMADMIN_SERVER_URL,
        changeOrigin: true,
        pathRewrite: {'^/api' : ''},
      },
      '^/api/meta': {
        target: process.env.VUE_APP_METADATA_API_SERVER_URL,
        changeOrigin: true,
        pathRewrite: {'^/api' : ''},
      } 
    }
  },
  configureWebpack: {
    // plugins: [new BundleAnalyzerPlugin()],
    resolve: {
      alias: {
        "@": path.join(__dirname, "src/"),
      },
      fallback: {
        os: require.resolve('os-browserify/browser'),
        url: require.resolve('url'),
        http: false,
        https: false,
        zlib: false,
      }
    },
    devtool: 'source-map'
  },
  css: {
    loaderOptions: {
      scss: {
        additionalData: `
          @import "@/assets/scss/common/variables.scss";
        `
      }
    }
  },
});
