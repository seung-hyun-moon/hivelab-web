@echo off

REM Activate the Python virtual environment
CALL C:\hivelab\hivelab-web\.venv\Scripts\activate

REM Change to the project directory
cd C:\hivelab\hivelab-web

REM Update the repository and switch to feature/update_borad branch
git fetch origin
git checkout feature/add_db_and_login
git pull origin feature/add_db_and_login

REM Run the main.py script
echo Running main.py...
uvicorn main:app --reload --port 80 --host 0.0.0.0

REM Deactivate the virtual environment
CALL C:\Hivelab\venv\Scripts\deactivate

REM End of the script
echo Script finished.
pause