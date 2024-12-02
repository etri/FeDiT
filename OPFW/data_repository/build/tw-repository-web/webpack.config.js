const path = require("path");
const fs = require("fs");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyAfterBuildPlugin = require('./webpack/custom_plugin/CopyAfterBuildPlugin');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const autoprefixer = require("autoprefixer");

const PLUGIN_NAME = "TimeLoggerPlugin";

const WEBPACK_OUTPUT = 'webpack/output/';

class TimeLoggerPlugin {
  apply(compiler) {
    compiler.hooks.watchRun.tap(PLUGIN_NAME, (compiler) => {
      const logger = compiler.getInfrastructureLogger(PLUGIN_NAME);
      logger.info(
        `[Message from ${PLUGIN_NAME}] Compilation Done ${new Date().toLocaleString()}`,
      );
    });
  }
}

class FileListPlugin {
  constructor(options) {
    this.outputFile = options.outputFile || "filelist.json";
    this.sourceDir = options.sourceDir || "src/some-directory";
  }

  apply(compiler) {
    compiler.hooks.afterPlugins.tap("FileListPlugin", (compilation) => {
      const fileList = fs.readdirSync(path.resolve(__dirname, this.sourceDir));

      const content = JSON.stringify(fileList, null, 2);

      // 출력 파일의 절대 경로 생성
      const outputPath = path.resolve(__dirname, this.outputFile);

      // 파일 쓰기
      fs.writeFile(outputPath, content, (err) => {
        if (err) {
          console.error("Error writing file:", err);
        } else {
          console.log(`File ${this.outputFile} has been created successfully.`);
        }
      });
    });
  }
}

module.exports = (env) => {
  const pages = [
    { name: "CollectorMonitoring",     useKakaoMap: false,     srcDir: "project_front/src/contents/pages/system",     distUpFolder: "system",    },
    { name: "DataCategoryList",        useKakaoMap: false,     srcDir: "project_front/src/contents/pages/system",     distUpFolder: "system",    },
    { name: "DataItem",                useKakaoMap: false,     srcDir: "project_front/src/contents/pages/system",     distUpFolder: "system",    },
    { name: "DataRegistRequestList",   useKakaoMap: false,     srcDir: "project_front/src/contents/pages/system",     distUpFolder: "system",    },
    { name: "DataUseRequestList",      useKakaoMap: false,     srcDir: "project_front/src/contents/pages/system",     distUpFolder: "system",    },
    { name: "InstitutionList",         useKakaoMap: false,     srcDir: "project_front/src/contents/pages/system",     distUpFolder: "system",    },
    { name: "InstitutionUserManage",   useKakaoMap: false,     srcDir: "project_front/src/contents/pages/system",     distUpFolder: "system",    },
    { name: "DataList",                useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
    { name: "DataDetail",              useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
    { name: "UserGuide",               useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
    { name: "Signup",                  useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
    { name: "Login",                   useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
    { name: "FindPassword",            useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
    { name: "Index",                   useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
    { name: "DataRegistRequest",       useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
    { name: "MyPage",                  useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
    { name: "ModifyInfo",              useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
    { name: "ModifyPwd",               useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
    { name: "RestKeyList",             useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
    { name: "DataUseRequestList",      useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
    { name: "DataRegistList",          useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
    { name: "DataUseRequest",          useKakaoMap: false,     srcDir: "project_front/src/contents/pages/public",     distUpFolder: "public",    },
  ];
  const profile = !env.production ? "development" : "production";
  console.log("profile : " + profile);

  return {
    entry: pages.reduce((config, page) => {
      config[`${page.distUpFolder}_${page.name}`] = {
        import: path.resolve(__dirname,page.srcDir,`${page.name}/${page.name}`),
        // filename: `js/${page.distUpFolder}/[name].bundle.js?ver=\${build_date}`,
      };
      return config;
    }, {}),
    cache: true,
    output: {
      path: path.resolve(__dirname, WEBPACK_OUTPUT),
      // path: path.resolve(__dirname, "src/main/webapp/public/"),
      filename: "js/[name].bundle.js?ver=${build_date}", // entry 에서 설정
      chunkFilename: `js/[id].[contenthash:8].chunk.js`,
      publicPath: "/static/",
    },
    optimization: {
      splitChunks: {
        chunks: "all",
      },
    },
    mode: profile,
    devtool: "eval-source-map",
    resolve: {
      extensions: [".js", ".ts", ".jsx", ".tsx"],
      alias: {
        "@": path.resolve(__dirname, "./project_front/src"),
        "@images": path.resolve(__dirname, "./project_front/assets/image"),
        "@scss": path.resolve(__dirname, "./project_front/scss"),
        "@i18n": path.resolve(__dirname, "./src/main/resources/i18n"),
      },
    },
    watchOptions: {
      ignored: /project_front\/assets\/watchIgnore/,
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /(node_modules)/,
          use: "babel-loader",
        },
        {
          test: /\.scss$/,
          use: [
            "style-loader",
            { loader: "css-loader", options: { importLoaders: 1 } },
            {
              loader: "postcss-loader",
            },
            "sass-loader",
          ],
        },
        {
          // Extract any CSS content and minimize
          test: /\.css$/,
          use: [
            "style-loader",
            { loader: "css-loader", options: { importLoaders: 1 } },
            { loader: "postcss-loader" },
          ],
        },
        // {
        //     test: /\.(css|s[ac]ss)$/i,
        //     use: ['style-loader', 'css-loader', 'sass-loader', 'postcss-loader']
        // },
        // {
        //     test: /\.css$/,
        //     use: ['style-loader', 'css-loader']
        // },
        {
          test: /\.(png)$/,
          type: "asset", // 40KB(default) 미만은 inline, 이상은 resource로 대처
          generator: {
            filename: "images/[hash][ext][query]",
          },
          parser: {
            dataUrlCondition: {
              maxSize: 1 * 1024, // 기준을 20KB 로 변경
            },
          },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: "asset/resource",
          generator: {
            filename: "fonts/[hash][ext][query]",
          },
        },
        {
          test: /\.svg/,
          type: "asset/inline",
        },
        {
          test: /\.(yaml|yml)$/,
          use: "yaml-loader",
        },
      ],
    },
    plugins: [].concat(
      // new FileListPlugin({
      //     outputFile: './project_front/assets/watchIgnore/customErrorList.json',  // webpack 출력 디렉토리 외부의 경로
      //     sourceDir: './project_front/src/errors/impl'  // 스캔할 디렉토리 지정
      // }),
      new TimeLoggerPlugin(),
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [
          "**/*",
          // build 폴더 안의 모든 것을 지우도록 설정
          path.resolve(__dirname, "src/main/resources/static/fonts/*"),
          path.resolve(__dirname, "src/main/resources/static/images/*"),
          path.resolve(__dirname, "src/main/resources/static/js/*"),
        ],
      }),
      new CopyAfterBuildPlugin([
        { from: `${WEBPACK_OUTPUT}/fonts`, to: 'src/main/resources/static/fonts' },
        { from: `${WEBPACK_OUTPUT}/images`, to: 'src/main/resources/static/images' },
        { from: `${WEBPACK_OUTPUT}/js`, to: 'src/main/resources/static/js' },
      ]),
      pages.map((page) => {
        return new HtmlWebpackPlugin({
          header: {
            tags:
              '<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>\n' +
              '<%@ include file="/WEB-INF/view/include/tags.jspf" %>',
          },
          templateParameters: {
            useKakaoMap: page.useKakaoMap,
          },
          template: path.resolve(__dirname, "webpack/template", "index.ejs"),
          publicPath: "/static/",
          filename: path.resolve(
            __dirname,
            `src/main/webapp/WEB-INF/view/${page.distUpFolder}/repository/${page.name}.jsp`,
          ),
          chunks: [`${page.distUpFolder}_${page.name}`],
          minify: false,
          inject: false,
        });
      }),
    ),
  };
};
