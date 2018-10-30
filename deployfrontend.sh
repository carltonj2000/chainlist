rsync -r src/ docs/
rsync build/contracts/ChainList.json docs/
git add .
git commit -m "update githib pages with updated frontend"
git push