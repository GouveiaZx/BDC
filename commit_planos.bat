@echo off
echo Fazendo commit dos ajustes de planos...
git add .
git commit -m "VALORES DOS PLANOS CORRIGIDOS - Conforme especificacao do usuario"
git push origin master
echo Commit finalizado!
pause 