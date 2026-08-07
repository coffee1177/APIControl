# APIControl 项目规则

修改本仓库前必须阅读并遵守以下规范：

- [Python 包与缓存规范](rules/python-package.md)
- [数据库结构同步规范](rules/database-schema.md)
- [需求开发整理规范](rules/需求开发整理.md)

通用要求：

1. 文案和文档优先使用中文。
2. 修改代码时不要随意删除已有注释。
3. 前端代码修改后，非用户要求不执行构建，只检查改动文件的语法。
4. 接口按 `backend/app/api` 下的实际路由层级组织，不使用 `v1` 目录。
- [前端接口请求 Axios 使用规范](rules/前端接口请求axios使用.md)

前端接口调用必须遵循该规则：按后端一级路由使用 `front/src/api` 下的面向对象 API 类和对应类型文件，页面不得直接调用 Axios 或拼接接口地址。
