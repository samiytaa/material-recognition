@echo off
chcp 65001 >nul
title 材料识别应用

:: 检查依赖
if not exist "node_modules\" (
    echo 正在安装依赖...
    call npm install || (pause & exit /b 1)
)

:: 启动开发服务器
echo 启动开发服务器: http://localhost:3000
echo 等待服务器就绪后自动打开浏览器...

:: 后台启动服务器
start /B npm run dev

:: 等待端口开放后打开浏览器
:wait_loop
timeout /t 1 /nobreak >nul
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 goto wait_loop

:: 打开浏览器
start http://localhost:3000

:: 保持窗口运行
pause
