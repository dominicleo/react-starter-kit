# react-starter-kit

## 快速开始

#### 安装依赖

```bash
$ npm install
# 或
$ yarn
```

#### 启动开发服务器

```bash
$ yarn start
# 修改启动端口
$ yarn start -p 8080 # 默认 3000
```

#### 构建应用程序

```bash
$ yarn build -r
```

## 构建自动化工具

#### `yarn [command]`

| command    | 描述                                             |
| ---------- | ------------------------------------------------ |
| start      | 启动开发服务器                                   |
| build      | 编译应用程序                                     |
| copy       | 将静态文件复制到输出文件夹 `/public`             |
| clean      | 清除输出目录 `/build`                            |
| lint       | 执行 `eslint` `stylelint` 检测项目语法           |
| fix        | 执行 `eslint` `stylelint` 检测项目语法并尝试修复 |
| test       | 启动 jest 执行项目测试用例                       |
| test:watch | 在监听模式下启动 jest 执行项目测试用例           |
| coverage   | 检测项目代码覆盖率                               |

##### `start`、`build` 可选参数

| 参数        | 别名 | 描述                               |
| ----------- | ---- | ---------------------------------- |
| `--release` | -r   | 最小化和优化编译输出               |
| `--verbose` | -v   | 将详细信息打印到控制台             |
| `--analyze` | -a   | 启动 `Webpack Bundle Analyzer`     |
| `--static`  | -S   | 将指定的路由呈现为静态 `html` 文件 |
| `--docker`  | -d   | 从 `Dockerfile` 构建映像           |
| `--silent`  | -s   | 禁止打开默认浏览器                 |
| `--port`    | -p   | 启动端口                           |
| `--help`    | -h   | 显示帮助信息                       |

示例:

```sh
# 在生产模式下构建应用程序
$ yarn solar build --release --verbose
```

or

```sh
# 以生产模式启动 dev server
$ yarn solar start --release
```

or

```sh
# 分析构建应用程序 bundle
$ yarn solar build --release --analyse
```

## 开发指南

分支管理及 git 常用命令 [查看文档](https://juejin.im/post/5ad99c05f265da0b9265231b)

## 参考文档

[ahooks](https://ahooks.js.org/zh-CN) React Hooks 库

[dayjs](https://day.js.org/zh-CN/) 一个轻量的处理时间和日期的库

[jest](https://jestjs.io/zh-Hans/) Javascript 测试框架

[commitlint](https://commitlint.js.org/) Lint commit message
