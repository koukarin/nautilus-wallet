const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const WindiCSSWebpackPlugin = require("windicss-webpack-plugin");
var webpack = require("webpack");
const { defineConfig } = require("@vue/cli-service");

const commitHash = require("child_process").execSync("git rev-parse HEAD").toString().trim();

module.exports = defineConfig({
  publicPath: "/",
  productionSourceMap: false,
  devServer: {
    devMiddleware: {
      writeToDisk: true
    }
  },
  lintOnSave: false,
  configureWebpack: {
    devtool: "cheap-source-map",
    optimization: {
      splitChunks: {
        chunks: "all"
      }
    },
    resolve: {
      fallback: {
        stream: require.resolve("stream-browserify")
      }
    },
    experiments: {
      asyncWebAssembly: true
    },
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"]
      })
    ]
  },
  pages: {
    index: { entry: "src/main.ts", template: "public/index.html", title: "Nautilus" },
    background: { entry: "src/background/background.ts", template: "public/background.html" }
  },
  chainWebpack: (config) => {
    config.output.filename("js/[name].js").chunkFilename("js/[name].js").end();

    config.plugin("copy").tap(([pathConfigs]) => {
      pathConfigs.patterns.push({
        from: "src/content-scripts",
        to: "js"
      });

      return [pathConfigs];
    });

    config.plugin("ignore").use(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/wordlists\/(?!english)/,
        contextRegExp: /bip39\\src$/
      })
    );

    config.plugin("define").tap((options) => {
      options[0]["process.env"].GIT_HASH = JSON.stringify(commitHash);
      options[0]["process.env"].MAINNET = JSON.stringify(!process.argv.includes("--testnet"));
      return options;
    });

    config
      .plugin("clean-output")
      .use(
        new CleanWebpackPlugin({
          cleanStaleWebpackAssets: false
        })
      )
      .end();

    const svgRule = config.module.rule("svg");
    svgRule.uses.clear();
    svgRule.delete("type");
    svgRule.delete("generator");
    svgRule
      .use("vue-loader")
      .loader("vue-loader")
      .end()
      .use("vue-svg-loader")
      .loader("vue-svg-loader")
      .end();

    config.plugin("windicss").use(new WindiCSSWebpackPlugin()).end();
  }
});
