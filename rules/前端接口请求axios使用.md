# 前端接口请求 Axios 使用规范

## 适用范围

所有 `front` 前端接口请求都必须使用统一封装的 `request`，不要在页面、组件或业务服务中直接调用 `axios`。

封装位置：

```text
front/src/utils/request/index.ts
```

## 基本用法

`request` 接收 Axios 请求配置，并直接返回后端响应体，不需要再次访问 `response.data`。

```ts
import { request } from "../../utils/request";

const product = await request<Product>({
  url: "/product/1",
  method: "GET",
});
```

请求列表接口时，使用后端分页结构对应的泛型：

```ts
import {
  request,
  type PaginatedResponse,
} from "../../utils/request";

const result = await request<PaginatedResponse<Product>>({
  url: "/product",
  method: "GET",
  params: { page: 1, size: 20, keyword: "reader" },
});
```

创建或更新数据时，将请求体放在 `data`：

```ts
await request<Product, CreateProductPayload>({
  url: "/product",
  method: "POST",
  data: payload,
});
```

## 后端路径约定

- 默认请求基地址是 `/backend`，开发环境由 Vite 代理到 `http://127.0.0.1:8000`。
- 后端当前没有 `/v1` 前缀，接口路径必须遵循 `backend/app/api` 的实际结构。
- 产品接口使用 `/product`，产品统计使用 `/product/statistics`，作者使用 `/product/author`，状态使用 `/product/status`，来源使用 `/product/source`，提供者使用 `/product/provider`。
- 后端分页响应统一为 `{ items, page, size, total }`，优先使用 `PaginatedResponse<T>`。
- 数组查询参数可以直接放入 `params`，封装会序列化为 FastAPI 可识别的重复参数格式。

## 错误处理

封装会把 FastAPI 的 `{ detail }`、422 字段校验错误、超时和网络错误统一转换为 `RequestError`：

```ts
import { RequestError } from "../../utils/request";

try {
  await request<Product>({ url: "/product/1", method: "GET" });
} catch (error) {
  if (error instanceof RequestError) {
    console.error(error.status, error.message, error.detail);
  }
}
```

## 禁止事项

- 不要在业务代码中直接 `import axios` 或新建 Axios 实例。
- 不要重复拼接 `/backend`，也不要添加不存在的 `/v1` 前缀。
- 不要在调用方重复处理 `response.data`。
- 不要吞掉 `RequestError`；页面需要根据业务场景展示错误或交给上层处理。

如需切换后端地址，使用 `VITE_API_ENV` 环境变量，不修改业务接口路径。

## 环境配置

前端环境变量位于 `front/.env`，当前项目默认使用线上环境：

```env
VITE_API_ENV=online
VITE_LOCAL_API_URL=http://127.0.0.1:8000
VITE_ONLINE_API_URL=http://opc.cofcodeport.online/backend
```

- `VITE_API_ENV=local` 时请求本地 `127.0.0.1:8000`。
- `VITE_API_ENV=online` 时请求 `http://opc.cofcodeport.online/backend`。
- 新环境优先复制 `front/.env.example`，不要在业务代码中硬编码地址。

## API 目录与面向对象约定

API 文件放在 `front/src/api`，按后端一级路由划分：

```text
src/api/
  health/
    index.ts
    types.ts
  product/
    index.ts
    types.ts
```

- 后端一级路由对应一个 API 类文件；该路由下的所有接口方法集中在同一个类中。
- 类型与对应 API 放在同一目录的 `types.ts`，接口响应、分页参数和请求体都必须有明确类型。
- API 类使用单例实例导出，例如 `productApi`、`healthApi`；产品统计通过 `productApi.getStatistics()` 调用。
- 页面和组件只调用 API 实例方法，例如 `productApi.list()`、`productApi.get(id)`，不直接拼接接口 URL，也不直接调用 `request`。
- 新增后端一级路由时，必须同步新增 API 类、类型文件，并更新本规则文档。
