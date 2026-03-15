# Obsidian Stoic Quotes

An [Obsidian](https://obsidian.md) plugin that fetches random Stoic quotes from [stoic-quotes.com](https://stoic-quotes.com), caches them locally in your vault, and lets you embed a live quote block anywhere in a note with a simple code fence.

---

## Features

- 📜 Embed a randomly selected Stoic quote anywhere in a note using a single code block
- 🔄 "New quote" button to cycle through quotes without leaving the note
- 💾 Quotes are cached locally as JSON — no network call needed at read time
- ✍️ Command to stamp a static blockquote into a note (great for daily notes)
- ⚙️ Configurable fetch count, cache file path, and startup behaviour

---

## Demo

In any note, add:

````markdown
```stoic
```
````

In Reading View or Live Preview it renders as:

> *"You have power over your mind, not outside events. Realise this, and you will find strength."*
>
> — Marcus Aurelius
>
> <kbd>New quote</kbd>

---

## Installation

### Manual (from source)

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/obsidian-stoic-quotes.git
   cd obsidian-stoic-quotes
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

3. Copy the plugin files into your vault:
   ```bash
   mkdir -p YOUR_VAULT/.obsidian/plugins/stoic-quotes
   cp main.js manifest.json styles.css YOUR_VAULT/.obsidian/plugins/stoic-quotes/
   ```

4. In Obsidian, go to **Settings → Community Plugins**, and enable **Stoic Quotes**.

---

## First-time setup

After enabling the plugin, open the Command Palette (`Ctrl/Cmd+P`) and run:

> **Stoic Quotes: Fetch & cache stoic quotes**

This downloads quotes from `stoic-quotes.com` and saves them as a JSON file in your vault. You only need to do this once — or whenever you want a fresh batch.

---

## Usage

### Embedded quote block

Paste this into any note:

````markdown
```stoic
```
````

Renders a styled quote card in Reading View and Live Preview, with a **New quote** button to cycle to another quote on demand.

### Commands

| Command | Description |
|---|---|
| **Insert stoic quote block** | Inserts the ` ```stoic ``` ` shortcode at your cursor |
| **Insert random stoic quote as blockquote text** | Stamps the current quote as a static Markdown blockquote |
| **Fetch & cache stoic quotes** | Downloads a fresh batch of quotes and saves them to your vault |

---

## Settings

| Setting | Default | Description |
|---|---|---|
| Quotes cache file | `stoic-quotes.json` | Path within your vault where quotes are stored |
| Quotes to fetch | `50` | Number of quotes to fetch per refresh (10–200) |
| Auto-fetch on startup | Off | Automatically refresh the cache each time Obsidian opens |
| Show refresh button | On | Show the "New quote" button inside embedded blocks |

---

## How it works

1. Quotes are fetched in parallel from the free `https://stoic-quotes.com/api/quote` endpoint — no API key required.
2. Duplicates are filtered out and the result is saved as a JSON file inside your vault.
3. When Obsidian renders a `stoic` code block, the plugin picks a random quote from the local cache — no network request is made at read time.
4. The cache file is a plain JSON array, so it can be committed to git, synced via Obsidian Sync, or edited by hand.

---

## Development

```bash
npm install       # install dependencies
npm run dev       # watch mode (rebuilds on save)
npm run build     # production build
```

After building, copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugin folder as described in the installation steps above.

---

## Credits

Quote data provided by [stoic-quotes.com](https://stoic-quotes.com).

---

## License

[MIT](LICENSE)
