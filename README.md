# Secret Santa

A tiny Secret Santa app. No server, no accounts. Runs on GitHub Pages.

## How it works

1. Open the page. Type in everyone's names.
2. Add rules, like "Alice can't get Bob (both ways)" for couples.
3. Click **Make the draw**.
4. Copy each person's link and send it to them.
5. Each person opens their link and clicks **Draw my person** to see who they got.

The draw is saved in your browser, so you can come back and copy links again.

## Good to know

- Each link holds that person's result inside it (lightly scrambled). If you open someone else's link, you'll see their person.
- Making a new draw means the old links no longer match. Send everyone the new ones.

## Put it on GitHub Pages

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment", pick **Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
4. Your site will be at `https://<your-username>.github.io/<repo-name>/` in a minute or two.

## Run the tests

```bash
node test.js
```
