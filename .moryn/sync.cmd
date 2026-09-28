@echo off
set "ACTION=%~1"
set "TASK_ID=%~2"
set "EXTRA=%~3"
set "API_URL=https://moryn.web.id"
set "TOKEN=piar_live_574a9624fbffce7fa228c937c8a08a87ebee5cd8"
set "PROJECT_ID=cmudmzuns0001kz042cyjg7p5"

if "%ACTION%"=="start" (
  curl -s -X POST "%API_URL%/api/agent/tasks/%TASK_ID%/start?projectId=%PROJECT_ID%" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json"
  exit /b
)
if "%ACTION%"=="complete" (
  curl -s -X POST "%API_URL%/api/agent/tasks/%TASK_ID%/complete?projectId=%PROJECT_ID%" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json"
  exit /b
)
if "%ACTION%"=="fail" (
  curl -s -X POST "%API_URL%/api/agent/tasks/%TASK_ID%/fail?projectId=%PROJECT_ID%" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"reason\":\"%EXTRA%\"}"
  exit /b
)
if "%ACTION%"=="current" (
  curl -s "%API_URL%/api/agent/tasks/current?projectId=%PROJECT_ID%" -H "Authorization: Bearer %TOKEN%"
  exit /b
)
if "%ACTION%"=="context" (
  curl -s "%API_URL%/api/agent/project?projectId=%PROJECT_ID%&section=context" -H "Authorization: Bearer %TOKEN%"
  exit /b
)
if "%ACTION%"=="design" (
  curl -s "%API_URL%/api/agent/project?projectId=%PROJECT_ID%&section=design" -H "Authorization: Bearer %TOKEN%"
  exit /b
)
if "%ACTION%"=="prd" (
  curl -s "%API_URL%/api/agent/project?projectId=%PROJECT_ID%&section=prd" -H "Authorization: Bearer %TOKEN%"
  exit /b
)
if "%ACTION%"=="taste" (
  curl -s "%API_URL%/api/agent/project?projectId=%PROJECT_ID%&section=taste-skill&skill=%TASK_ID%" -H "Authorization: Bearer %TOKEN%"
  exit /b
)
if "%ACTION%"=="validate" (
  npx moryn-cli validate-ui
  exit /b
)
if "%ACTION%"=="theme" (
  npx moryn-cli init-theme
  exit /b
)
if "%ACTION%"=="clean" (
  npx moryn-cli clean
  exit /b
)
