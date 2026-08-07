# APIControl

APIControl 是一个开源的个人 API 控制台项目，当前处于基础项目构造阶段。

## 环境要求

- Python 3.11 或更高版本
- Node.js 18 或更高版本
- pnpm 10 或更高版本

## 后端启动

在项目根目录执行：

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python start.py
```

后端默认运行在：

```text
http://127.0.0.1:8000
```

健康检查接口：

```text
http://127.0.0.1:8000/health
```

## 前端启动

在另一个终端窗口执行：

```powershell
cd fronted
pnpm install
pnpm dev
```

前端默认运行在：

```text
http://127.0.0.1:5173
```

打开前端页面后，点击“测试后端接口”按钮即可验证前后端联通。成功响应会输出在浏览器开发者工具的控制台中。

## 前端检查

前端只执行类型和语法检查，不执行完整构建：

```powershell
cd fronted
pnpm run check
```

## 后端测试

```powershell
cd backend
python -m pytest -q
```

## 目录说明

```text
backend/  FastAPI 后端
fronted/  React 前端
plan/     需求、制作计划和完成记录
rules/    项目开发规则
```
