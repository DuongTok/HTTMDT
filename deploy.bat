@echo off
chcp 65001 >nul
echo ========================================================
echo   NÉT DUYÊN - ĐỒNG BỘ GIT & CẬP NHẬT WEB SERVER (VERCEL)
echo ========================================================
echo.
echo [1/3] Đang pull code mới nhất từ GitHub...
git pull origin main
echo.
echo [2/3] Đang deploy cập nhật cổng Admin (netduyen-admin)...
call npx vercel deploy admin --project netduyen-admin --prod --yes
echo.
echo [3/3] Đang deploy cập nhật cổng User + Admin chung (netduyen)...
call npx vercel deploy . --project netduyen --prod --yes
echo.
echo ========================================================
echo   CẬP NHẬT HOÀN TẤT! 2 LINK TRỰC TUYẾN ĐÃ LÊN SÓNG:
echo   1. Link Khách hàng (User):  https://netduyen.vercel.app
echo   2. Link Quản trị (Admin):   https://netduyen-admin.vercel.app
echo                               (hoặc https://netduyen.vercel.app/admin)
echo ========================================================
pause
