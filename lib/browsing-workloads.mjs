const CATEGORIES = [
  "Technology",
  "Local news",
  "Home",
  "Travel",
  "Shopping",
  "Community",
];

const TITLE_WORDS = [
  "practical",
  "guide",
  "repair",
  "community",
  "weekend",
  "review",
  "update",
  "recommended",
  "everyday",
  "project",
  "market",
  "workshop",
];

function nextValue(state) {
  return (state * 1664525 + 1013904223) >>> 0;
}

function checksum(values) {
  return values.reduce(
    (value, item) => ((value << 5) - value + item) >>> 0,
    2166136261,
  );
}

export const browsingActionNames = [
  "Open a news article",
  "Search and scan results",
  "Browse a product grid",
  "Load a busy home page",
  "Filter and change pages",
];

export function buildBrowsingDataset(seed, size) {
  let state = seed >>> 0;
  const items = Array.from({ length: size }, (_, index) => {
    state = nextValue(state);
    const category = CATEGORIES[state % CATEGORIES.length];
    const first = TITLE_WORDS[(state >>> 3) % TITLE_WORDS.length];
    state = nextValue(state);
    const second = TITLE_WORDS[(state >>> 7) % TITLE_WORDS.length];
    return {
      id: index + 1,
      category,
      title: `${first[0].toUpperCase()}${first.slice(1)} ${second} ${category.toLowerCase()}`,
      summary:
        "A realistic local page preview with text, metadata, navigation, and related information for the reader.",
      price: 12 + (state % 780),
      rating: 2.5 + ((state >>> 6) % 26) / 10,
      popularity: state % 10000,
      updated: 2_000_000_000 - index * 113 - (state % 101),
      hue: state % 360,
    };
  });
  return { items };
}

export function createBrowsingView(dataset, actionIndex, domRows, seed) {
  const action = actionIndex % browsingActionNames.length;
  const { items } = dataset;
  let layout = "results";
  let query = "";
  let visible = [];
  let article = null;

  if (action === 0) {
    layout = "article";
    article = items[(seed + 17) % items.length];
    visible = items
      .filter((item) => item.category === article.category)
      .slice(0, Math.min(12, domRows));
  } else if (action === 1) {
    layout = "results";
    query = "repair guide";
    visible = items
      .filter(
        (item) =>
          item.title.includes("repair") ||
          item.title.includes("guide") ||
          item.summary.includes("reader"),
      )
      .sort((left, right) => right.popularity - left.popularity)
      .slice(0, domRows);
  } else if (action === 2) {
    layout = "catalog";
    visible = items
      .filter((item) => item.category === "Shopping" || item.rating >= 4)
      .sort((left, right) => left.price - right.price)
      .slice(0, domRows);
  } else if (action === 3) {
    layout = "homepage";
    visible = [...items]
      .sort((left, right) => right.updated - left.updated)
      .slice(0, domRows);
  } else {
    layout = "results";
    query = "Highly rated";
    const filtered = items
      .filter((item) => item.rating >= 4)
      .sort(
        (left, right) =>
          right.rating - left.rating || right.popularity - left.popularity,
      );
    const pageStart = Math.min(
      Math.max(0, filtered.length - domRows),
      (seed % 5) * Math.max(1, Math.floor(domRows / 2)),
    );
    visible = filtered.slice(pageStart, pageStart + domRows);
  }

  const paragraphCount =
    layout === "article" ? Math.min(32, Math.max(8, Math.round(domRows / 3))) : 0;
  const paragraphs = article
    ? Array.from(
        { length: paragraphCount },
        (_, index) =>
          `${article.summary} Section ${index + 1} adds enough text to exercise wrapping, layout, links, and the surrounding page chrome.`,
      )
    : [];

  return {
    actionName: browsingActionNames[action],
    layout,
    query,
    article,
    paragraphs,
    items: visible,
    totalResults: items.length,
    checksum: checksum([
      seed,
      action,
      items.length,
      ...visible.slice(0, 40).map((item) => item.id + item.popularity),
      ...paragraphs.slice(0, 12).map((paragraph) => paragraph.length),
    ]),
    success:
      visible.length > 0 &&
      (layout !== "article" || (article != null && paragraphs.length >= 8)),
  };
}
