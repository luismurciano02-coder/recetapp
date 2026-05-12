@echo off
REM ════════════════════════════════════════════════════════════════════
REM Despliegue de RecetApp Frontend a XAMPP.
REM Compila Angular y copia los archivos a c:\xampp\htdocs\recetapp-app\.
REM Ejecuta este .bat haciendo doble clic o desde cmd:
REM   cd c:\xampp\htdocs\recetapp\recetapp-frontend
REM   deploy.bat
REM ════════════════════════════════════════════════════════════════════

echo [1/3] Compilando Angular...
call npx ng build --configuration=development --base-href=/recetapp-app/
if errorlevel 1 (
  echo Build FALLIDA. Abortado.
  exit /b 1
)

echo [2/3] Copiando archivos a c:\xampp\htdocs\recetapp-app\...
if not exist c:\xampp\htdocs\recetapp-app mkdir c:\xampp\htdocs\recetapp-app
xcopy /E /Y /Q dist\recetapp-frontend\browser\* c:\xampp\htdocs\recetapp-app\

echo [3/3] Creando .htaccess para SPA routing...
(
echo ^<IfModule mod_rewrite.c^>
echo     RewriteEngine On
echo     RewriteBase /recetapp-app/
echo     RewriteCond %%{REQUEST_FILENAME} -f [OR]
echo     RewriteCond %%{REQUEST_FILENAME} -d
echo     RewriteRule ^^ - [L]
echo     RewriteRule ^^ index.html [L]
echo ^</IfModule^>
) > c:\xampp\htdocs\recetapp-app\.htaccess

echo.
echo ✓ Desplegado en http://localhost/recetapp-app/
echo Pulsa Ctrl+Shift+R en el navegador para recargar.
