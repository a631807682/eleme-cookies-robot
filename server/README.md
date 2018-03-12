# eleme-cookies-robot/server

puppeteer学习

## 配置

修改 `data/accounts.js` 为要登陆的QQ用户密码

## 开发与运行

建议安装 Node.js 9.x 以上

安装依赖

```bash
npm i
```

运行

```bash
node index
```

> 查看结果data/cookies.json
> 查看日志logs/eleme.log


## 注意
1. 当需要QQ安全认证时需要页面上手动验证
2. 在认证时发现登陆密码不正确需手动关闭当前页面
3. 由于QQ安全认证过不去无法做成服务
   仅当做一次性的辅助工具

## 用途
替换项目https://github.com/game-helper/hongbao 中饿了么cookie搭建自己的红包私服