@echo off
title Catálogo Mecatrónico
cd /d "%~dp0"

echo ============================================
echo    Catalogo Mecatronico - Servidor Local
echo ============================================

if not exist ".venv\Scripts\python.exe" (
    echo [1/2] Creando entorno virtual e instalando dependencias...
    python -m venv .venv
    ".venv\Scripts\python.exe" -m pip install --upgrade pip
    ".venv\Scripts\python.exe" -m pip install -r requirements.txt
)

echo [2/2] Iniciando servidor en http://127.0.0.1:8000 ...
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:8000"
".venv\Scripts\python.exe" -m uvicorn app:app --host 127.0.0.1 --port 8000

pause
