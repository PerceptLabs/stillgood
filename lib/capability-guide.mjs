const everydayNames = {
  None: "Not verified",
  Basic: "Light browsing",
  Everyday: "Everyday browsing",
  Busy: "Busy websites",
  Demanding: "Demanding websites",
  Extreme: "Demanding websites with room to spare",
  Headroom: "Demanding websites with room to spare",
  Limit: "Demanding websites with room to spare",
};

const multitaskingNames = {
  None: "One task at a time",
  Basic: "One task at a time",
  Everyday: "One main task",
  Busy: "Several everyday tasks",
  Demanding: "Several demanding browser tasks",
  Extreme: "Heavy browser multitasking",
  Headroom: "Heavy browser multitasking",
  Limit: "Heavy browser multitasking",
};

export function friendlyEverydayLevel(tier) {
  return everydayNames[tier] ?? tier ?? "Not verified";
}

export function friendlyMultitaskingLevel(tier) {
  return multitaskingNames[tier] ?? tier ?? "Not verified";
}

export function friendlyVideoLevel(video) {
  if (video?.available === false) return "Not verified";
  const tier = video?.highestComfortable ?? video?.highestUsable ?? "None";
  if (tier === "None") return "Not comfortable";
  return `${tier} video`;
}

function tierIdFromLabel(label, kind) {
  if (!label || label === "None") return "None";
  if (["Basic", "Everyday", "Busy", "Demanding", "Extreme"].includes(label))
    return label;

  const value = Number(String(label).replaceAll(",", "").match(/\d+/)?.[0]);
  if (!Number.isFinite(value)) return "None";
  const thresholds = {
    email: [1000, 5000, 20000, 50000],
    writing: [1500, 8000, 25000, 60000],
    spreadsheets: [1000, 10000, 50000, 150000],
  }[kind];
  if (!thresholds) return "None";
  if (value > thresholds[3]) return "Extreme";
  if (value >= thresholds[3]) return "Demanding";
  if (value >= thresholds[2]) return "Busy";
  if (value >= thresholds[1]) return "Everyday";
  return "Basic";
}

function comfortableTierId(category, kind) {
  const measured = [...(category?.tiers ?? [])]
    .reverse()
    .find((tier) => tier.status === "comfortable");
  return measured?.id
      ? ["headroom", "limit", "reserve"].includes(measured.id)
      ? "Extreme"
      : measured.id[0].toUpperCase() + measured.id.slice(1)
    : tierIdFromLabel(category?.highestComfortable, kind);
}

const performanceAreas = [
  {
    id: "video",
    title: "Video playback",
    shortTitle: "video playback",
    strength: (guide) =>
      `${guide.videoLabel} stayed smooth, making media one of this device's strongest uses.`,
    relativeLimit:
      "Video is practical, but it reaches its comfortable limit sooner than this device's strongest tasks.",
    clearLimit:
      "Video playback showed visible drops or interruptions at ordinary resolutions.",
  },
  {
    id: "email",
    title: "Email",
    shortTitle: "email",
    strength: () =>
      "Large searches, rich messages, and composing remained responsive.",
    relativeLimit:
      "Everyday email is comfortable, but very large searches and rich message threads slow sooner.",
    clearLimit:
      "Large webmail searches, rich threads, and composing may respond slowly.",
  },
  {
    id: "multitasking",
    title: "Multitasking",
    shortTitle: "multitasking",
    strength: () =>
      "Several browser tasks stayed responsive while active at the same time.",
    relativeLimit:
      "Several light tasks are practical, but heavier combinations slow sooner than this device's strongest work.",
    clearLimit:
      "Overlapping demanding tasks can cause visible pauses; keep one main job in front.",
  },
  {
    id: "graphics",
    title: "Visual smoothness",
    shortTitle: "busy visual pages",
    strength: () =>
      "Scrolling, motion, and visually busy pages stayed smooth as scenes became denser.",
    relativeLimit:
      "Ordinary visual pages are comfortable, but dense animation has less reserve than this device's strongest tasks.",
    clearLimit:
      "Animation-heavy and visually dense pages may stutter, especially during other work.",
  },
  {
    id: "spreadsheets",
    title: "Spreadsheets",
    shortTitle: "spreadsheets",
    strength: () =>
      "Formula work, sorting, filtering, and larger tables were handled well.",
    relativeLimit:
      "Everyday spreadsheets are comfortable, but the largest recalculations and pasted ranges have less reserve.",
    clearLimit:
      "Large recalculations, sorts, and pasted ranges may need extra time.",
  },
  {
    id: "browsing",
    title: "Web browsing",
    shortTitle: "busy websites",
    strength: () =>
      "Articles, search, shopping pages, and navigation remained responsive as pages became busier.",
    relativeLimit:
      "Ordinary browsing is comfortable, but very busy websites have less reserve than this device's strongest tasks.",
    clearLimit:
      "Image-heavy pages, long feeds, and complex shopping or news sites may respond slowly.",
  },
  {
    id: "writing",
    title: "Writing and documents",
    shortTitle: "large documents",
    strength: () =>
      "Editing, formatting, tables, and page reflow remained responsive in larger documents.",
    relativeLimit:
      "Documents are practical, but long files and repeated text reflow slow sooner than this device's strongest tasks.",
    clearLimit:
      "Long documents may pause when editing forces later text and pages to rewrap.",
  },
];

function joinPlainLanguage(items) {
  if (items.length <= 1) return items[0] ?? "everyday work";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function capitalizeSentence(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function buildPerformanceProfile(result, guide) {
  const areas = performanceAreas
    .map((area) => ({ ...area, score: result[area.id]?.score }))
    .filter((area) => Number.isFinite(area.score));
  if (!areas.length) {
    return {
      summary: "Not enough category evidence was available to compare strengths.",
      wellRounded: false,
      strengths: [],
      limits: [],
    };
  }

  const scores = areas.map((area) => area.score);
  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);
  const wellRounded = lowest >= 90 && highest - lowest <= 10;
  const ranked = [...areas].sort((left, right) => right.score - left.score);
  // Profiles describe meaningful differences, not every score fluctuation. The
  // top three areas remain stable when closely matched scores trade places.
  const strengths = wellRounded
    ? []
    : ranked.filter((area) => area.score >= 84).slice(0, 3);
  const ascending = [...areas].sort((left, right) => left.score - right.score);
  const weakest = ascending[0];
  const limits =
    wellRounded || highest - weakest.score < 12
      ? []
      : ascending
          .filter(
            (area, index) =>
              index === 0 ||
              (area.score - weakest.score <= 5 && highest - area.score >= 12),
          )
          .slice(0, 2);
  const strengthItems = strengths.slice(0, 3).map((area) => ({
    id: area.id,
    title: area.title,
    detail: area.strength(guide),
    score: area.score,
  }));
  const limitItems = limits.map((area) => ({
    id: area.id,
    title: area.title,
    detail: area.score < 68 ? area.clearLimit : area.relativeLimit,
    relative: area.score >= 68,
    score: area.score,
  }));
  const featuredStrengths = strengthItems.slice(0, 2);
  const strengthNames = joinPlainLanguage(
    featuredStrengths.map((item) => item.title.toLowerCase()),
  );
  const limitNames = joinPlainLanguage(
    limitItems.map(
      (item) => areas.find((area) => area.id === item.id)?.shortTitle,
    ),
  );

  return {
    wellRounded,
    strengths: strengthItems,
    limits: limitItems,
    summary: wellRounded
      ? "Everyday performance was consistently strong, with no clear weak area."
      : limitItems.length
        ? `${capitalizeSentence(strengthNames)} ${featuredStrengths.length === 1 ? "was" : "were"} especially strong. ${capitalizeSentence(limitNames)} may slow first.`
        : `${capitalizeSentence(strengthNames)} ${featuredStrengths.length === 1 ? "was" : "were"} especially strong. No major weak area appeared in ordinary work.`,
  };
}

function plainCapabilityRating(score) {
  if (!Number.isFinite(score)) return "Not verified";
  if (score >= 86) return "Comfortable";
  if (score >= 76) return "Practical";
  if (score >= 66) return "Best kept light";
  if (score >= 56) return "May feel slow";
  return "Not recommended";
}

export function runQualityLabel(confidence) {
  if (confidence === "High") return "Clean";
  if (confidence === "Medium") return "Usable";
  return "Use with caution";
}

function buildReserveProfile(result) {
  const standardIndex = result.shadowScoring?.pressureIndex;
  const extendedIndex = result.shadowScoring?.extendedPressureIndex;
  const fallbackScore = result.upperReserve?.score;
  const checked =
    Boolean(result.upperReserve?.tested) || Number.isFinite(standardIndex);

  if (!checked) {
    return {
      checked: false,
      level: "not-checked",
      label: "Not checked",
      summary:
        "Heavy-work reserve was not measured, so this result does not assume extra capacity.",
    };
  }

  const level = Number.isFinite(standardIndex)
    ? standardIndex >= 4500 && extendedIndex >= 4000
      ? "exceptional"
      : standardIndex >= 2500
        ? "strong"
        : standardIndex >= 1250
          ? "moderate"
          : standardIndex >= 750
            ? "limited"
            : "low"
    : fallbackScore >= 97
      ? "exceptional"
      : fallbackScore >= 86
        ? "strong"
        : fallbackScore >= 70
          ? "moderate"
          : fallbackScore >= 55
            ? "limited"
            : "low";
  const copy = {
    exceptional: {
      label: "Exceptional",
      summary:
        "Keeps its speed when large projects and several demanding jobs overlap.",
    },
    strong: {
      label: "Strong",
      summary:
        "Handles larger jobs and several active tasks without major slowdowns.",
    },
    moderate: {
      label: "Moderate",
      summary:
        "Can take on occasional heavier work, but slows when demanding jobs pile up.",
    },
    limited: {
      label: "Limited",
      summary: "Best with ordinary work and one demanding job at a time.",
    },
    low: {
      label: "Low",
      summary:
        "Slows noticeably when files become large or several active jobs overlap.",
    },
  }[level];

  return { checked: true, level, ...copy };
}

function buildConsistencyProfile(result) {
  const label = result.responsiveness?.label;
  if (label === "Frequent interruptions") {
    return {
      level: "frequent",
      label: "Frequent interruptions",
      summary:
        "Repeated pauses make it feel slower than its average performance suggests.",
    };
  }
  if (label === "Noticeable hitches") {
    return {
      level: "hitchy",
      label: "Noticeable hitches",
      summary:
        "Most actions are practical, but some take much longer than the usual response.",
    };
  }
  if (label === "Occasional pauses") {
    return {
      level: "occasional",
      label: "Occasional catch-up",
      summary:
        "Usually responsive, with occasional moments where the device needs to catch up.",
    };
  }
  return {
    level: "steady",
    label: "Steady",
    summary: "Response stayed consistent during the measured everyday work.",
  };
}

function everydaySummary(grade) {
  if (["A+", "A", "A-"].includes(grade)) return "Everyday work feels fast.";
  if (["B+", "B"].includes(grade)) return "Everyday work is comfortable.";
  if (grade === "B-") return "Everyday work is practical, with some limits.";
  if (["C+", "C"].includes(grade)) return "Light everyday work is practical.";
  if (grade === "C-") return "Best kept to focused, straightforward tasks.";
  if (grade === "D") return "Best with one simple job at a time.";
  return "Ordinary browser work did not remain consistently practical.";
}

function topSummaryFor(result, reserve, consistency) {
  const everyday = everydaySummary(result.grade);
  if (consistency.level !== "steady") {
    return `${everyday} ${consistency.summary}`;
  }
  if (reserve.checked) {
    const reserveSummary = {
      exceptional:
        "It also stayed exceptionally responsive in the heavier-work check.",
      strong: "It also stayed responsive in the heavier-work check.",
      moderate:
        "It remained practical in the heavier-work check, with less room as jobs piled up.",
      limited:
        "Heavier work is best kept to one demanding job at a time.",
      low: "It slowed noticeably in the heavier-work check.",
    }[reserve.level];
    return `${everyday} ${reserveSummary}`;
  }
  if (["A+", "A", "A-"].includes(result.grade)) {
    return `${everyday} The test did not verify how well that speed holds up during unusually large or overlapping jobs.`;
  }
  return everyday;
}

function resultVariation(result) {
  const confidenceMargin =
    result.confidence === "Low" ? 6 : result.confidence === "Medium" ? 4 : 2;
  const measuredMargin = Number.isFinite(result.variability)
    ? result.variability > 0.45
      ? 6
      : result.variability > 0.25
        ? 4
        : result.variability > 0.12
          ? 3
          : 2
    : confidenceMargin;
  const margin = Math.max(confidenceMargin, measuredMargin);
  return {
    margin,
    lower: Math.max(0, (result.score ?? 0) - margin),
    upper: Math.min(100, (result.score ?? 0) + margin),
    message: `Treat changes of ${margin} point${margin === 1 ? "" : "s"} or less as normal run-to-run variation.`,
  };
}

const officeNames = {
  email: {
    None: "Simple email only",
    Basic: "Email basics",
    Everyday: "Everyday email",
    Busy: "Busy inboxes",
    Demanding: "Large, busy inboxes",
    Extreme: "Large, busy inboxes",
  },
  writing: {
    None: "Short notes only",
    Basic: "Notes and short documents",
    Everyday: "Everyday documents",
    Busy: "Long documents",
    Demanding: "Long, complex documents",
    Extreme: "Long, complex documents",
  },
  spreadsheets: {
    None: "Small tables only",
    Basic: "Small spreadsheets",
    Everyday: "Everyday spreadsheets",
    Busy: "Larger spreadsheets",
    Demanding: "Large, complex spreadsheets",
    Extreme: "Large, complex spreadsheets",
  },
};

export function friendlyOfficeLevel(category, kind) {
  return officeNames[kind]?.[comfortableTierId(category, kind)] ?? "Not verified";
}

function gradeHeadline(grade) {
  if (grade === "A+") return "Exceptionally fast and flexible";
  if (grade === "A") return "Fast and flexible";
  if (grade === "A-") return "Fast for everyday work";
  if (grade === "B+") return "Comfortable and capable";
  if (grade === "B") return "Comfortable for everyday work";
  if (grade === "B-") return "Useful with some limits";
  if (grade === "C+") return "Good for lighter work";
  if (grade === "C") return "Best for light everyday work";
  if (grade === "C-") return "Best for focused tasks";
  if (grade === "D") return "One simple job at a time";
  return "Not practical for general browser use";
}

export function buildCapabilityGuide(result) {
  const browsingTier = comfortableTierId(result.browsing);
  const multitaskingTier =
    comfortableTierId(result.multitasking);
  const browsingLabel = friendlyEverydayLevel(browsingTier);
  const everydayLabel = friendlyOfficeLevel(result.email, "email");
  const writingLabel = friendlyOfficeLevel(result.writing, "writing");
  const spreadsheetLabel = friendlyOfficeLevel(
    result.spreadsheets,
    "spreadsheets",
  );
  const multitaskingLabel = friendlyMultitaskingLevel(multitaskingTier);
  const videoLabel = friendlyVideoLevel(result.video);
  const officeScore = Math.min(
    result.email?.score ?? 0,
    result.writing?.score ?? 0,
    result.spreadsheets?.score ?? 0,
  );
  const officeLabel =
    officeScore >= 84
      ? "Comfortable office work"
      : officeScore >= 68
        ? "Everyday office work"
        : officeScore >= 58
          ? "Light office work"
          : "Office basics only";
  const webAndEmailScore = Math.min(
    result.browsing?.score ?? 0,
    result.email?.score ?? 0,
  );
  const documentsScore = Math.min(
    result.writing?.score ?? 0,
    result.spreadsheets?.score ?? 0,
  );
  const reserve = buildReserveProfile(result);
  const consistency = buildConsistencyProfile(result);
  const capabilityDetail = (score, comfortable, practical, light, slow) =>
    !Number.isFinite(score)
      ? "This part of the test did not produce enough valid evidence."
      : score >= 86
        ? comfortable
        : score >= 76
          ? practical
          : score >= 66
            ? light
            : slow;
  const capabilityCards = [
    {
      id: "web",
      title: "Web and email",
      rating: plainCapabilityRating(webAndEmailScore),
      detail: capabilityDetail(
        webAndEmailScore,
        "Ordinary sites, shopping pages, searches, and large inboxes responded promptly.",
        "Ordinary sites and email are practical; very busy pages may pause.",
        "Best with simpler sites, smaller inboxes, and fewer busy tabs.",
        "Busy pages and large webmail searches are likely to feel slow.",
      ),
    },
    {
      id: "documents",
      title: "Documents and spreadsheets",
      rating: plainCapabilityRating(documentsScore),
      detail: capabilityDetail(
        documentsScore,
        "Writing, formatting, formulas, sorting, and tables remained comfortable.",
        "Everyday files are practical; long documents and large recalculations may pause.",
        "Best with shorter documents, smaller tables, and lighter formula work.",
        "Large files, text rewrapping, sorting, and recalculation may feel slow.",
      ),
    },
    {
      id: "video",
      title: "Video",
      rating:
        result.video?.available === false
          ? "Not verified"
          : `${plainCapabilityRating(result.video?.score)}${videoLabel !== "Not comfortable" ? ` · ${videoLabel.replace(" video", "")}` : ""}`,
      detail:
        result.video?.available === false
          ? "Video playback could not be verified in this browser."
          : `${videoLabel} was the highest playback level that remained comfortable.`,
    },
    {
      id: "multitasking",
      title: "Multitasking",
      rating: plainCapabilityRating(result.multitasking?.score),
      detail: capabilityDetail(
        result.multitasking?.score,
        "Several everyday browser tasks remained comfortable while active together.",
        "A main job and a few lighter tasks can remain active together.",
        "Keep one main job active and limit busy background tasks.",
        "Overlapping active jobs are likely to cause noticeable waits.",
      ),
    },
  ];
  const bestFor = [];

  if ((result.browsing?.score ?? 0) >= 58) {
    bestFor.push({
      title: "Web browsing",
      detail: `A good fit for ${browsingLabel.toLowerCase()}, including articles, search results, shopping pages, and navigation.`,
    });
  }
  if ((result.email?.score ?? 0) >= 58) {
    bestFor.push({
      title: "Email and webmail",
      detail: `A good fit for ${everydayLabel.toLowerCase()}, including searching, opening conversations, and writing replies.`,
    });
  }
  if ((result.writing?.score ?? 0) >= 58) {
    bestFor.push({
      title: "Writing and documents",
      detail: `A good fit for ${writingLabel.toLowerCase()}, including editing, formatting, tables, and changing page layout.`,
    });
  }
  if ((result.spreadsheets?.score ?? 0) >= 58) {
    bestFor.push({
      title: "Spreadsheets",
      detail: `A good fit for ${spreadsheetLabel.toLowerCase()}, including formulas, sorting, filtering, and pasted data.`,
    });
  }

  if (result.video?.available !== false && videoLabel !== "Not comfortable") {
    bestFor.push({
      title: "Video playback",
      detail: `${videoLabel} played comfortably in this browser.`,
    });
  }

  if (result.roles?.some((role) => role.includes("Remote access"))) {
    bestFor.push({
      title: "Remote access",
      detail:
        "A good candidate for remote desktop, browser-based terminals, and SSH tools.",
    });
  }

  const cautions = [];
  if (
    ["Occasional pauses", "Noticeable hitches", "Frequent interruptions"].includes(
      result.responsiveness?.label,
    )
  ) {
    cautions.push({
      title: consistency.label,
      detail: consistency.summary,
    });
  }
  if ((result.browsing?.score ?? 0) < 68) {
    cautions.push({
      title: "Busy websites",
      detail:
        "Image-heavy pages, long feeds, and complex shopping or news sites may respond slowly.",
    });
  }
  if ((result.email?.score ?? 0) < 68) {
    cautions.push({
      title: "Large email websites",
      detail:
        "Large searches, long HTML threads, or rich composing may respond slowly.",
    });
  }
  if ((result.writing?.score ?? 0) < 68)
    cautions.push({
      title: "Long documents",
      detail:
        "Large documents may pause when an early edit forces later text to rewrap.",
    });
  if ((result.spreadsheets?.score ?? 0) < 68)
    cautions.push({
      title: "Large spreadsheets",
      detail:
        "Formula recalculation, large sorts, and pasted ranges may need extra time.",
    });
  if (["None", "Basic", "Everyday", "Busy"].includes(multitaskingTier)) {
    cautions.push({
      title: "Too many active tasks",
      detail:
        multitaskingTier === "Busy"
          ? "Keep one main job in front and only a few light tasks running behind it."
          : "Focus on one main job and avoid overlapping demanding applications.",
    });
  }
  if ((result.graphics?.score ?? 0) < 68) {
    cautions.push({
      title:
        result.browserSupport?.level === "experimental"
          ? "Visual effects in this browser"
          : "Animation-heavy pages",
      detail:
        result.browserSupport?.level === "experimental"
          ? "Dense motion may stutter in this browser even when ordinary office and browsing work performs better."
          : "Dense motion and highly animated sites may stutter, especially during other work.",
    });
  }
  if (
    result.memory?.available &&
    (result.memory?.score ?? 0) < 68
  ) {
    cautions.push({
      title: "Catch-up pauses under pressure",
      detail:
        "The browser slowed as more active information was kept in use. Closing finished tabs and applications should help it stay steady.",
    });
  }
  if (
    result.memory?.available &&
    ["Constrained browser reserve", "Modest browser reserve"].includes(
      result.memory?.reserveLabel,
    )
  ) {
    cautions.push({
      title: "Keep the active workload smaller",
      detail:
        result.memory.reserveLabel === "Constrained browser reserve"
          ? "Use one main job at a time and close finished tabs. Larger documents, busy web apps, and several active tasks are more likely to cause catch-up pauses."
          : "Everyday work should be practical, but several busy tabs or large web documents may slow down sooner than they would on a computer with more reserve.",
    });
  }
  if (
    result.storage?.available &&
    (result.storage?.score ?? 0) < 58
  ) {
    cautions.push({
      title: "Saving and reopening",
      detail:
        "Persistent browser saves took long enough to be noticeable. Large offline web apps may pause while committing changes.",
    });
  }
  if (
    result.storage?.available &&
    (result.storage?.coldLargeFlushMs ?? 0) >= 750 &&
    (result.storage?.coldLargeFlushMs ?? 0) >=
      Math.max(1, result.storage?.largeFlushMs ?? 0) * 1.4
  ) {
    cautions.push({
      title: "The first large save may take longer",
      detail:
        "The first large offline save paused longer than the repeat saves. This can match a computer that usually feels fine but occasionally needs time to catch up.",
    });
  }
  if (
    result.storage?.available &&
    (result.storage?.largeFlushMs ?? 0) >= 250
  ) {
    cautions.push({
      title:
        result.storage.largeFlushMs >= 500
          ? "Large saves can cause a clear pause"
          : "Large saves may briefly pause",
      detail:
        result.storage.largeFlushMs >= 500
          ? "Small files should be fine, but saving or updating a large offline file can visibly interrupt the computer before it catches up."
          : "Small saves remained responsive, but a larger offline file took noticeably longer to finish.",
    });
  }
  if (result.video?.available !== false) {
    cautions.push({
      title: "Streaming codecs vary",
      detail:
        "Streaming sites using VP9 or AV1 may perform differently from this H.264 test.",
    });
  }

  const guide = {
    headline: gradeHeadline(result.grade),
    reserve,
    consistency,
    runQuality: {
      label: runQualityLabel(result.confidence),
      confidence: result.confidence,
    },
    summary:
      ["Occasional pauses", "Noticeable hitches", "Frequent interruptions"].includes(
        result.responsiveness?.label,
      )
        ? "The computer completes useful everyday work, but intermittent pauses may make it feel slower than its average performance suggests."
        : result.memory?.reserveLabel === "Constrained browser reserve"
          ? "Useful for smaller everyday jobs, but large web documents and several active tasks may cause noticeable slowdowns."
        : (result.storage?.largeFlushMs ?? 0) >= 500
          ? "A good fit for smaller everyday jobs, but large saves and heavier offline work may cause noticeable pauses."
        : result.grade.startsWith("C")
        ? "Useful for focused office and browser work when larger files and overlapping jobs are kept under control."
        : "A practical fit for the everyday work shown below, with clear limits where the computer begins to slow.",
    browsingLabel,
    officeLabel,
    capabilityCards,
    everydayLabel,
    writingLabel,
    spreadsheetLabel,
    multitaskingLabel,
    videoLabel,
    setup:
      multitaskingTier === "Busy"
        ? "One main task plus a few light background tasks"
        : multitaskingTier === "Demanding"
          ? "Several active tasks, with the heaviest apps used carefully"
          : multitaskingTier === "Extreme"
            ? "Several demanding browser tasks at once"
            : "One main task at a time",
    bestFor,
    cautions,
    largeSaveLabel:
      !result.storage?.available
        ? "Not verified"
        : (result.storage?.largeFlushMs ?? 0) >= 1000
          ? "Slow"
          : (result.storage?.largeFlushMs ?? 0) >= 500
            ? "Noticeable pause"
            : (result.storage?.largeFlushMs ?? 0) >= 250
              ? "Brief pause"
              : "Responsive",
  };
  guide.performanceProfile = buildPerformanceProfile(result, guide);
  guide.variation = resultVariation(result);
  guide.topSummary = topSummaryFor(result, reserve, consistency);
  return guide;
}
