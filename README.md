# Hivelab web

This project is a web application for managing real estate customers and items, including images. It is built using Python, FastAPI, HTML, CSS, and JavaScript. The database is managed using SQLAlchemy and stored in a SQLite file named `hive.db` and located in the `APP_DATA` directory.

## Project Structure

The project has the following structure:

- `backend/`: Directory where the backend code is located.
    - `db/`: Contains `database.py` for setting up the SQLAlchemy session and engine, and `models.py` for defining the SQLAlchemy models.
    - `routers/`: Contains Python files defining the routes for the application.
    - `schemas/`: Contains Python files defining various schemas.
- `frontend/`: Directory where the frontend code is located.
    - `static/`: Contains CSS styles, JavaScript code, and item images for the web pages.
    - `templates/`: Contains HTML files defining each page of the website.
- `main.py`: Entry point of the application.
- `APP_DATA/`: Directory where the SQLite database files are stored.
- `requirements.txt`: Contains Python dependencies for the project.

## Setup

1. Install the required Python packages:

```
pip install -r requirements.txt
```

2. Run the application:

```
uvicorn main:app --reload
```

The application will be available at `http://localhost:80`.

## Usage

Navigate to `http://localhost:80` in your web browser to use the application. You can view and manage customers and items from here.