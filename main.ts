import {
  App,
  Editor,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  requestUrl,
} from "obsidian";

interface StoicQuote {
  text: string;
  author: string;
}

interface StoicQuotesSettings {
  quotesFilePath: string;
  fetchCount: number;
  autoFetchOnStartup: boolean;
  showRefreshButton: boolean;
}

const DEFAULT_SETTINGS: StoicQuotesSettings = {
  quotesFilePath: "stoic-quotes.json",
  fetchCount: 50,
  autoFetchOnStartup: false,
  showRefreshButton: true,
};

export default class StoicQuotesPlugin extends Plugin {
  settings: StoicQuotesSettings;
  quotes: StoicQuote[] = [];

  async onload() {
    await this.loadSettings();
    await this.loadQuotesFromFile();

    // ── Code block renderer ────────────────────────────────────────────────
    this.registerMarkdownCodeBlockProcessor("stoic", (_source, el) => {
      this.renderQuoteBlock(el);
    });

    // ── Commands ───────────────────────────────────────────────────────────

    this.addCommand({
      id: "insert-quote-block",
      name: "Insert quote block",
      editorCallback: (editor: Editor) => {
        editor.replaceSelection("```stoic\n```\n");
      },
    });

    this.addCommand({
      id: "insert-quote-as-blockquote",
      name: "Insert quote as blockquote text",
      editorCallback: (editor: Editor) => {
        const quote = this.getRandomQuote();
        if (quote) {
          editor.replaceSelection(
            `> "${quote.text}"\n>\n> — *${quote.author}*\n`
          );
        } else {
          new Notice(
            'No quotes cached yet. Run "Fetch and cache quotes" first.'
          );
        }
      },
    });

    this.addCommand({
      id: "fetch-quotes",
      name: "Fetch and cache quotes",
      callback: async () => {
        await this.fetchAndCacheQuotes();
      },
    });

    // ── Settings tab ───────────────────────────────────────────────────────
    this.addSettingTab(new StoicQuotesSettingTab(this.app, this));

    // ── Auto-fetch on startup ──────────────────────────────────────────────
    if (this.settings.autoFetchOnStartup) {
      this.app.workspace.onLayoutReady(async () => {
        await this.fetchAndCacheQuotes(true);
      });
    }
  }

  // ── Rendering ────────────────────────────────────────────────────────────

  renderQuoteBlock(el: HTMLElement) {
    el.empty();
    const quote = this.getRandomQuote();
    const container = el.createDiv({ cls: "stoic-quote-container" });

    if (!quote) {
      const empty = container.createDiv({ cls: "stoic-quote-empty" });
      empty.createSpan({ text: "⚡ " });
      empty.createSpan({
        text: 'No quotes cached. Run "Fetch and cache quotes" from the command palette first.',
      });
      return;
    }

    container.createEl("p", {
      text: `"${quote.text}"`,
      cls: "stoic-quote-text",
    });
    container.createEl("p", {
      text: `— ${quote.author}`,
      cls: "stoic-quote-author",
    });

    if (this.settings.showRefreshButton) {
      const footer = container.createDiv({ cls: "stoic-quote-footer" });
      const btn = footer.createEl("button", {
        text: "New quote",
        cls: "stoic-quote-refresh",
      });
      btn.onclick = () => this.renderQuoteBlock(el);
    }
  }

  // ── Quote helpers ─────────────────────────────────────────────────────────

  getRandomQuote(): StoicQuote | null {
    if (!this.quotes.length) return null;
    return this.quotes[Math.floor(Math.random() * this.quotes.length)];
  }

  async fetchAndCacheQuotes(silent = false) {
    if (!silent) new Notice("Fetching quotes…");

    try {
      const count = this.settings.fetchCount;
      const fetched: StoicQuote[] = [];

      const requests = Array.from({ length: count }, () =>
        requestUrl({ url: "https://stoic-quotes.com/api/quote" })
          .then((r) => r.json as StoicQuote)
          .catch(() => null)
      );

      const results = await Promise.all(requests);
      results.forEach((q) => {
        if (q?.text && q?.author) fetched.push(q);
      });

      // Deduplicate by quote text
      const seen = new Set<string>();
      this.quotes = fetched.filter((q) => {
        if (seen.has(q.text)) return false;
        seen.add(q.text);
        return true;
      });

      await this.saveQuotesToFile();

      if (!silent) {
        new Notice(`Cached ${this.quotes.length} quotes.`);
      }
    } catch {
      new Notice("Failed to fetch quotes. Check your internet connection.");
    }
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  async loadQuotesFromFile() {
    try {
      const path = this.settings.quotesFilePath;
      const exists = await this.app.vault.adapter.exists(path);
      if (exists) {
        const raw = await this.app.vault.adapter.read(path);
        this.quotes = JSON.parse(raw);
      }
    } catch {
      this.quotes = [];
    }
  }

  async saveQuotesToFile() {
    const path = this.settings.quotesFilePath;
    await this.app.vault.adapter.write(
      path,
      JSON.stringify(this.quotes, null, 2)
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// ── Settings tab ──────────────────────────────────────────────────────────────

class StoicQuotesSettingTab extends PluginSettingTab {
  plugin: StoicQuotesPlugin;

  constructor(app: App, plugin: StoicQuotesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Quotes cache file")
      .setDesc(
        "Path inside your vault where quotes are stored as JSON. Change and re-fetch if you want it somewhere specific."
      )
      .addText((text) =>
        text
          .setPlaceholder("stoic-quotes.json")
          .setValue(this.plugin.settings.quotesFilePath)
          .onChange(async (value) => {
            this.plugin.settings.quotesFilePath = value.trim() || "stoic-quotes.json";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Quotes to fetch")
      .setDesc("How many quotes to request each time you fetch (10–200).")
      .addSlider((slider) =>
        slider
          .setLimits(10, 200, 10)
          .setValue(this.plugin.settings.fetchCount)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.fetchCount = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Auto-fetch on startup")
      .setDesc("Refresh the quote cache every time Obsidian opens.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoFetchOnStartup)
          .onChange(async (value) => {
            this.plugin.settings.autoFetchOnStartup = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show refresh button")
      .setDesc('Show a "New quote" button inside the rendered quote block.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showRefreshButton)
          .onChange(async (value) => {
            this.plugin.settings.showRefreshButton = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("Actions").setHeading();

    new Setting(containerEl)
      .setName("Fetch quotes now")
      .setDesc(
        `Download ${this.plugin.settings.fetchCount} quotes from stoic-quotes.com and save to your vault.`
      )
      .addButton((btn) =>
        btn.setButtonText("Fetch").setCta().onClick(async () => {
          await this.plugin.fetchAndCacheQuotes();
        })
      );

    const info = containerEl.createEl("p", { cls: "stoic-settings-info" });
    info.setText(
      `Currently cached: ${this.plugin.quotes.length} quote${
        this.plugin.quotes.length !== 1 ? "s" : ""
      }.`
    );
  }
}
