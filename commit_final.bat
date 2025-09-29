@echo off
echo Fazendo commit das correcoes de email e telefone...
git add .
git commit -m "CORRIGIDOS EMAILS E TELEFONES - Agora usando suporte@buscaaquibdc.com e (99) 98444-7055"
git push origin master
echo Commit finalizado!
pause 