@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 设置标题
title 材料识别应用 - 开发服务器

:: 显示启动信息
echo.
echo ========================================
echo   材料识别应用 - 启动中...
echo ========================================
echo.

:: 检查 Node.js 是否安装
where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 检查 package.json 是否存在
if not exist "package.json" (
    echo [错误] 未找到 package.json 文件
    echo 请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

:: 检查 node_modules 是否存在
if not exist "node_modules\" (
    echo [警告] 未找到 node_modules 目录
    echo 正在安装依赖...
    echo.
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo.
    echo 依赖安装完成！
    echo.
)

:: 检查端口 3000 是否被占用
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [警告] 端口 3000 已被占用
    echo 请关闭占用端口的程序或修改配置文件中的端口
    echo.
    choice /C YN /M "是否尝试继续启动"
    if errorlevel 2 (
        echo 已取消启动
        pause
        exit /b 0
    )
    echo.
)

:: 启动开发服务器
echo ----------------------------------------
echo 正在启动开发服务器...
echo ----------------------------------------
echo.
echo 服务地址: http://localhost:3000
echo 局域网地址: 启动后查看终端显示
echo.
echo [提示] 服务器启动后将自动打开浏览器
echo [提示] 按 Ctrl+C 可停止服务器
echo.
echo ========================================
echo.

:: 启动 Vite 开发服务器（确保绑定到 0.0.0.0:3000）
call npm run dev

:: 如果服务器异常退出
if errorlevel 1 (
    echo.
    echo [错误] 服务器启动失败
    echo 请检查错误信息并修复后重试
    pause
    exit /b 1
)

endlocal
