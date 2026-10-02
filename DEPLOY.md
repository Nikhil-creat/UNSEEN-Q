# Publish UNSEEN-Q on GitHub (phone friendly, Codespaces)

1. Open https://github.com/Nikhil-creat/UNSEEN-Q and tap "Create a codespace".
2. In the Codespace explorer, upload `unseen-q-fully-loaded.zip` (Upload option in the explorer menu).
3. Open the terminal and run:
   ```
   unzip unseen-q-fully-loaded.zip
   cp -r unseen-q/. .
   rm -rf unseen-q unseen-q-fully-loaded.zip
   git add .
   git commit -m "UNSEEN-Q initial release"
   git push
   ```
4. Repo Settings > Pages > Deploy from a branch > main > /docs > Save.
5. Live in 1 to 2 minutes at https://nikhil-creat.github.io/UNSEEN-Q/

On a laptop you can use plain git: git init, git add ., git commit, git remote add origin https://github.com/Nikhil-creat/UNSEEN-Q.git, git push -u origin main.

# GitHub Projects board
Repo > Projects tab > New project > Board. Add the cards from docs/ROADMAP.md.
