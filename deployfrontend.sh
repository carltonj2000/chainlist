# the contract needs to be built and deployed before executing this script
# truffle deployment to ganache GUI command follows:
#   truffle migrate --compile-all --reset --network ganache

rsync -r src/ docs/
rsync build/contracts/ChainList.json docs/
git add .
git commit -m "update githib pages with updated frontend"
git push