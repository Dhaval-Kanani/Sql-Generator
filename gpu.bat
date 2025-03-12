:: Refresh GPU stats every 2 seconds
@echo off
:loop
cls
nvidia-smi
timeout /t 2 > nul
goto loop