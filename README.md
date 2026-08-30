# FastAPI 学习笔记

> 本文档结合本项目的 [main.py](main.py) 与 [static/](static/) 前端代码，讲解 FastAPI 的核心概念。
> 项目目前功能：一个支持**增、删、改、查、分页**的用户管理系统，后端用 FastAPI，数据存储用 SQLite，前端用原生 HTML/CSS/JS。

---

## 目录

1. [项目结构](#1-项目结构)
2. [快速开始](#2-快速开始)

---

## 1. 项目结构

``` -_-
fastapi_code/
├── main.py                 # 后端主程序（FastAPI 应用）
├── mydata.db               # SQLite 数据库文件（运行后自动生成）
└── static/                 # 前端静态资源
    ├── index.html          # 页面结构
    ├── style.css           # 样式
    └── app.js              # 前端逻辑（调用后端接口）
```

**分层思想**：后端负责提供数据接口（API），前端负责界面展示和交互，两者通过 HTTP 请求沟通。这就是常见的「前后端分离」模式。

---

## 2. 快速开始

```bash
# 1. 安装依赖
pip install fastapi uvicorn

# 2. 启动服务（两种方式任选）
python main.py
# 或者
uvicorn main:app --reload
```

启动后访问：

- 交互式 API 文档（FastAPI 自动生成）：<http://127.0.0.1:8000/docs>
- 前端用户管理页面：<http://127.0.0.1:8000/>

> `uvicorn main:app` 中的 `main` 是文件名，`app` 是文件里的 FastAPI 实例名。

---

## 延伸阅读

- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [FastAPI 中文文档](https://fastapi.tiangolo.com/zh/)
