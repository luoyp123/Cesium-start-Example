#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

echo -e '\033[32;40m

  ____        U  ___ u    ____      ____     U _____ u   __   __
 / __"| u      \/"_ \/ U /"___|u U |  _"\ u  \| ___"|/   \ \ / /
<\___ \/       | | | | \| |  _ /  \| |_) |/   |  _|"      \ V /
 u___) |   .-,_| |_| |  | |_| |    |  _ <     | |___     U_|"|_u
 |____/>>   \_)-\___/    \____|    |_| \_\    |_____|      |_|
  )(  (__)       \\\\      _)(|_     //   \\\\_   <<   >>  .-,//|(_
 (__)           (__)    (__)__)   (__)  (__) (__) (__)  \_) (__)  .github.io
 
'

echo -e "\033[32;40m commit 2 master branch \033[0m"

git init
git add -A
git commit -m 'deploy master'

# 如果你想要部署到 https://USERNAME.github.io
git push -f https://github.com/Sogrey/Cesium-start-Example.git master

echo -e "\033[32;40m done \033[0m "

cd -