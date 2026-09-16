# Task Manager

A simple task management web application built for the Graduate Support Engineer Trainee assessment.

## Features

- Sign in with Google
- Create tasks
- View personal task list
- Update task status
- Supported statuses:
  - Planned
  - In Progress
  - Complete
- Each user's tasks are associated with their own account

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: FastAPI
- Database: SQLite
- ORM: SQLAlchemy
- Authentication: Google Identity Services
- API communication: REST APIs / Fetch API
- Version Control: Git and GitHub
- Deployment: Render

## How to Use

1. Open the application URL.
2. Click **Sign in with Google**.
3. Select a Google account and complete authentication.
4. Enter a task title.
5. Optionally enter a description.
6. Click **Create Task**.
7. The task will appear under **My Tasks**.
8. Use the status selector to change the task between:
   - Planned
   - In Progress
   - Complete
9. Click **Logout** when finished.

## Login Instructions

The application uses Google Authentication.

1. Click **Sign in with Google**.
2. Select an available Google account.
3. Complete Google's authentication/verification if requested.
4. After successful authentication, the Task Manager dashboard will be displayed.

No separate username or password is required.

## Important Assumptions

- Only authenticated users can create and access tasks.
- Each task belongs to the Google-authenticated user who created it.
- Users can only view and update their own tasks.
- Task title is required.
- Task description is optional.
- New tasks are created with the status `Planned`.
- Only three task statuses are supported:
  `Planned`, `In Progress`, and `Complete`.
- Task deletion, priorities, due dates, reminders, and collaboration features are outside the current scope.

## Known Limitations

- The application currently supports basic task management only.
- There is no task deletion feature.
- There are no due dates, priorities, reminders, or notifications.
- SQLite is used as the database for simplicity.
- The application does not provide team/shared task management.
- Google Authentication must be configured correctly for the deployed application domain.

## Important Notes

- Do not commit the `.env` file to GitHub.
- The Google Client ID is used by the frontend for Google Sign-In.
- Session secrets and other sensitive configuration values should be stored in environment variables.
- The local SQLite database is excluded from version control.
- For deployment, the production application URL must be configured as an authorized JavaScript origin in Google Cloud.

## Local Setup

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Selvendran-B/task-manager-assessment.git
cd task-manager-assessment

