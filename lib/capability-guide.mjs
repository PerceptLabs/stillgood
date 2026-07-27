const everydayNames = {
  None: "Not verified",
  Basic: "Light everyday use",
  Everyday: "Everyday use",
  Busy: "Busy everyday use",
  Demanding: "Heavy use",
  Extreme: "Very heavy use",
  Headroom: "Very heavy use",
  Limit: "Very heavy use",
};

const multitaskingNames = {
  None: "One task at a time",
  Basic: "One task at a time",
  Everyday: "One main task",
  Busy: "A few light tasks",
  Demanding: "Several active tasks",
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
    ? ["headroom", "limit"].includes(measured.id)
      ? "Extreme"
      : measured.id[0].toUpperCase() + measured.id.slice(1)
    : tierIdFromLabel(category?.highestComfortable, kind);
}

const officeNames = {
  email: {
    None: "Simple email only",
    Basic: "Email basics",
    Everyday: "Everyday email",
    Busy: "Busy inboxes",
    Demanding: "Heavy webmail",
    Extreme: "Heavy webmail",
  },
  writing: {
    None: "Short notes only",
    Basic: "Notes and short documents",
    Everyday: "Everyday documents",
    Busy: "Long documents",
    Demanding: "Complex long documents",
    Extreme: "Complex long documents",
  },
  spreadsheets: {
    None: "Small tables only",
    Basic: "Small spreadsheets",
    Everyday: "Everyday spreadsheets",
    Busy: "Larger spreadsheets",
    Demanding: "Very large spreadsheets",
    Extreme: "Very large spreadsheets",
  },
};

export function friendlyOfficeLevel(category, kind) {
  return officeNames[kind]?.[comfortableTierId(category, kind)] ?? "Not verified";
}

function gradeHeadline(grade, formFactor) {
  if (formFactor === "mobile") {
    if (grade === "A+" || grade === "A") return "A strong mobile browser";
    if (grade.startsWith("B")) return "A useful mobile browser";
    return "Best for lighter mobile browsing";
  }
  if (grade === "A+") return "Ready for modern browser work";
  if (grade === "A") return "A fast everyday computer";
  if (grade === "B+") return "A comfortable second-life computer";
  if (grade === "B") return "A useful everyday computer";
  if (grade === "C+" || grade === "C") return "A capable light-duty computer";
  if (grade === "D") return "Best for one clear job";
  return "Better suited to a simple appliance role";
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
    ["Noticeable hitches", "Frequent interruptions"].includes(
      result.responsiveness?.label,
    )
  ) {
    cautions.push({
      title: "Occasional catch-up pauses",
      detail:
        result.responsiveness.label === "Frequent interruptions"
          ? "The computer repeatedly paused before showing completed actions. Even light work may sometimes feel inconsistent."
          : "Most work completed, but some actions took noticeably longer to appear than others.",
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
      title: "Animation-heavy pages",
      detail:
        "Dense motion and highly animated sites may stutter, especially during other work.",
    });
  }
  if (result.video?.available !== false) {
    cautions.push({
      title: "Streaming codecs vary",
      detail:
        "Streaming sites using VP9 or AV1 may perform differently from this H.264 test.",
    });
  }

  return {
    headline: gradeHeadline(result.grade, result.formFactor),
    summary:
      ["Noticeable hitches", "Frequent interruptions"].includes(
        result.responsiveness?.label,
      )
        ? "The computer completes useful everyday work, but intermittent pauses may make it feel slower than its average performance suggests."
        : result.grade.startsWith("C")
        ? "Useful for focused office and browser work when larger files and overlapping jobs are kept under control."
        : "A practical fit for the everyday work shown below, with clear limits where the computer begins to slow.",
    browsingLabel,
    officeLabel,
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
            ? "Heavy browser multitasking"
            : "One main task at a time",
    bestFor,
    cautions,
  };
}
