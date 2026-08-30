from contextlib import asynccontextmanager
from pathlib import Path

import math
import sqlite3
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent


async def lifespan(app: FastAPI):
    print("正在连接数据库...")
    conn = sqlite3.connect("mydata.db")
    curotr = conn.cursor()
    curotr.execute(
        """
        create table if not exists users (
            uid integer primary key autoincrement,
            name text not null,
            password text not null,
            age integer,
            gender text
        )
        """
    )
    conn.commit()
    curotr.close()
    conn.close()
    yield
    print("正在关闭数据库连接...")

app = FastAPI(lifespan=lifespan)

# 挂载静态资源目录，可通过 /static/... 访问（如 /static/index.html）
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


@app.get("/")
def read_root():
    # 根路径返回用户管理页面
    return FileResponse(BASE_DIR / "static" / "index.html")

@app.get("/items/{item_id}")
def read_item(item_id):
    return {"item_id": item_id}

@app.get("/users/add")
def add_user(name: str, password: str, age: int, gender: str):
    with sqlite3.connect("mydata.db") as conn:
        cursor = conn.cursor()
        cursor.execute("insert into users (name, password, age, gender) values(?, ?, ?, ?)", (name, password, age, gender))
        conn.commit()
    return {"message": "User added successfully"}

@app.get("/users/list")
def list_users(page: int = 1, page_size: int = 5):
    with sqlite3.connect("mydata.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        total = cursor.fetchone()[0]
        cursor.execute("SELECT * FROM users LIMIT ? OFFSET ?", (page_size, (page - 1) * page_size))
        users = cursor.fetchall()
    total_pages = math.ceil(total / page_size)
    return {"users": users, "total": total, "total_pages": total_pages}


@app.get("/users/{user_id}")
def get_user(user_id: int):
    with sqlite3.connect("mydata.db") as conn:
        cursor = conn.cursor()
        cursor.execute("select * from users where uid = ?", (user_id,))
        user = cursor.fetchone()
    return {"user": user}

@app.get("/users/update/{user_id}")
def update_user(user_id: int, name: str = None, password: str = None, age: int = None, gender: str = None):
    with sqlite3.connect("mydata.db") as conn:
        cursor = conn.cursor()
        cursor.execute("update users set name = ?, password = ?, age = ?, gender = ? where uid = ?", (name, password, age, gender, user_id))
        conn.commit()
    return {"message": "User updated successfully"}

@app.get("/users/delete/{user_id}")
def delete_user(user_id: int):
    with sqlite3.connect("mydata.db") as conn:
        cursor = conn.cursor()
        cursor.execute("delete from users where uid = ?", (user_id,))
        conn.commit()
    return {"message": "User deleted successfully"}

import uvicorn
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)