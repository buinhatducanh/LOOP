@echo off
cd /d d:\LOOP_COMPANY\LOOP
npx tsc --noEmit --skipLibCheck 2>&1 | findstr "dich-vu\client.tsx" | head -20
