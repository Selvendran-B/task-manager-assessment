import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import verify_google_token
from database import Base, engine, get_db
from models import User, Task


Base.metadata.create_all(bind=engine)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
SESSION_SECRET = os.getenv("SESSION_SECRET")

app = FastAPI(title="Task Manager")

# Serve CSS and JavaScript files from the static folder
app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET
)

templates = Jinja2Templates(directory="templates")

class GoogleLogin(BaseModel):
    credential: str


class TaskCreate(BaseModel):
    title: str
    description: str = ""


class StatusUpdate(BaseModel):
    status: str


ALLOWED_STATUSES = ["Planned", "In Progress", "Complete"]


def get_current_user(request: Request, db: Session):
    user_id = request.session.get("user_id")

    if not user_id:
        return None

    return db.query(User).filter(User.id == user_id).first()


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={}
    )


@app.post("/auth/google")
def google_login(
    data: GoogleLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        google_user = verify_google_token(
        data.credential,
        GOOGLE_CLIENT_ID
    )
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid Google ID token"
        )

    google_id = google_user["sub"]
    email = google_user.get("email")
    name = google_user.get("name", "User")

    user = db.query(User).filter(
        User.google_id == google_id
    ).first()

    if not user:
        user = User(
            google_id=google_id,
            name=name,
            email=email
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    request.session["user_id"] = user.id

    return {
        "message": "Login successful",
        "name": user.name,
        "email": user.email
    }


@app.get("/auth/me")
def get_me(
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }


@app.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"message": "Logged out"}


@app.get("/api/tasks")
def get_tasks(
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    tasks = (
        db.query(Task)
        .filter(Task.user_id == user.id)
        .order_by(Task.id.desc())
        .all()
    )

    return [
        {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status
        }
        for task in tasks
    ]


@app.post("/api/tasks")
def create_task(
    task_data: TaskCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    title = task_data.title.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Task title is required"
        )

    task = Task(
        user_id=user.id,
        title=title,
        description=task_data.description.strip(),
        status="Planned"
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status
    }


@app.patch("/api/tasks/{task_id}/status")
def update_status(
    task_id: int,
    status_data: StatusUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, db)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    if status_data.status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    task = (
        db.query(Task)
        .filter(
            Task.id == task_id,
            Task.user_id == user.id
        )
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    task.status = status_data.status
    db.commit()

    return {
        "message": "Status updated",
        "status": task.status
    }