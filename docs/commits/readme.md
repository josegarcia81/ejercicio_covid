## Comando para general el archivo commit.txt
git log --date=format:"%d/%m/%Y %H:%M:%S" --pretty=format:"%h - %an, %ad : %s" > commits.txt