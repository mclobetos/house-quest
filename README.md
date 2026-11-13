# House Quest: Josh & Nat

A home screen app where Josh and Nat clear chores as "quests" and the **house** levels up. It's a team effort with no scoreboard between them. Each of them has a customizable original anime-style avatar, and Elliott, Ocean and Hiccup ride along as party members (tap them).

Total cost: $0. About 15 minutes of setup.

---

## What's in the folder

| File | What it is |
|---|---|
| `index.html`, `app.js`, `store.js`, `avatar.js` | The app |
| `config.js` | Where your Supabase keys go |
| `manifest.webmanifest`, `sw.js`, `icons/` | Make it installable on iPhone |
| `supabase/schema.sql` | Creates the database and starter quests |
| `widget/house-quest-widget.js` | The home screen widget (Scriptable) |

---

## Step 1: Set up the database (Supabase, 3 min)

1. Go to supabase.com and create a **New project** (any name, e.g. `house-quest`). Pick the West US region. Save the database password somewhere, though you won't need it here.
2. When it finishes, open **SQL Editor** in the left sidebar and click **New query**.
3. Open `supabase/schema.sql`, copy everything, paste it in, and click **Run**. You should see "Success."
4. Go to **Project Settings > API** (sometimes labeled **Data API** / **API Keys**) and copy two things:
   - **Project URL** (looks like `https://abcdxyz.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`, or a newer `sb_publishable_...` key; either works)

## Step 2: Add your keys (1 min)

Open `config.js` and paste them in:

```js
window.HQ_CONFIG = {
  SUPABASE_URL: 'https://abcdxyz.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...',
};
```

## Step 3: Put it online with GitHub Pages (5 min)

1. On github.com click **New repository**. Name it `house-quest`, set it to **Public** (free Pages requires public), and create it.
2. Click **uploading an existing file**. Drag in **everything inside** the `house-quest` folder (the files and the `icons`, `supabase`, `widget` folders), then click **Commit changes**.
3. Go to **Settings > Pages**. Under "Build and deployment," set Source to **Deploy from a branch**, Branch to **main** and **/ (root)**, then **Save**.
4. Wait about a minute and refresh. The page shows your link, like `https://YOURNAME.github.io/house-quest/`.

> Heads up: a public repo means the anon key is visible to anyone who goes looking. The worst a stranger could do is mess with the chore list. Don't put anything private in the app.

## Step 4: Install on their iPhones (1 min each)

1. Open the link in **Safari** (it has to be Safari).
2. Tap the **Share** button, then **Add to Home Screen**, then **Add**.
3. Open it from the home screen and pick "Josh" or "Nat" for that phone.

It now runs full screen with its own icon, and both phones update live.

## Step 5: The widget (Scriptable, 3 min each phone)

1. Install **Scriptable** from the App Store (free).
2. Open Scriptable, tap **＋**, and paste in all of `widget/house-quest-widget.js`.
3. At the top, fill in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `APP_URL` (the GitHub Pages link).
4. Tap the title at the top and rename it **House Quest**. Tap ▶︎ to test. You should see the level card.
5. Go to the home screen, long-press an empty spot, tap **Edit > Add Widget**, find **Scriptable**, and choose **Medium** (or Small).
6. Long-press the new widget, choose **Edit Widget**, set **Script** to *House Quest*, and set **When Interacting** to *Open URL*.

The widget shows house level, title, an XP bar, streak, and how many daily and weekly quests are left. iOS refreshes widgets on its own schedule, usually every 15 to 30 minutes.

---

## How it works

- **XP and levels:** Every quest gives XP to the house. Level 2 takes 100 XP, level 3 takes 300, level 5 takes 1,000, and levels keep getting further apart. Every level has a new house title.
- **Together combo:** Choosing "Together" when clearing a quest gives +25% XP. That's the only "who did it" mechanic, and it rewards teamwork.
- **Resets:** Daily quests reset at midnight. Weekly quests reset Monday. Side quests (one-time) disappear once cleared.
- **Undo:** Tap a cleared quest to undo it.
- **Unlocks:** House levels unlock avatar items: Blaze aura (Lv2), Zigzag pattern (Lv3), Cloak (Lv4), Golden egg (Lv5), Stars (Lv6), Prismatic aura (Lv10).
- **Pets:** Tap Elliott, Ocean or Hiccup on the main screen.
- **Settings:** Rename the house, switch whose phone it is, and manage quests.

## Making changes later

Edit a file in GitHub (click the file, then the pencil icon), commit, and the site updates in about a minute. If phones seem stuck on an old version, open `sw.js`, change `hq-v1` to `hq-v2`, commit, then close and reopen the app.

## Demo mode

If `config.js` is left blank, the app runs in demo mode and saves to that one phone only. That's handy for a preview before the Supabase step.
