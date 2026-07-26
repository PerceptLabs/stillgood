const everydayNames = {
  None: "Not verified",
  Basic: "Everyday basics",
  Everyday: "Routine web use",
  Busy: "Busy browser use",
  Demanding: "Demanding web apps",
  Extreme: "Very heavy web use",
};

const multitaskingNames = {
  None: "One task at a time",
  Basic: "One task at a time",
  Everyday: "One main task",
  Busy: "A few light tasks",
  Demanding: "Several active tasks",
  Extreme: "Heavy browser multitasking",
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
  return `H.264 ${tier}`;
}

function gradeHeadline(grade, formFactor) {
  if (formFactor === "mobile") {
    if (grade === "A+" || grade === "A") return "A strong mobile browser";
    if (grade.startsWith("B")) return "A useful mobile browser";
    return "Best for lighter mobile browsing";
  }
  if (grade === "A+") return "Ready for modern browser work";
  if (grade === "A") return "A comfortable everyday computer";
  if (grade === "B+") return "A strong second-life computer";
  if (grade === "B") return "A useful everyday computer";
  if (grade === "C+" || grade === "C") return "A capable light-duty computer";
  if (grade === "D") return "Best for one clear job";
  return "Better suited to a simple appliance role";
}

export function buildCapabilityGuide(result) {
  const emailTier = result.email?.highestComfortable ?? "None";
  const writingTier = result.writing?.highestComfortable ?? "None";
  const spreadsheetTier = result.spreadsheets?.highestComfortable ?? "None";
  const multitaskingTier =
    result.multitasking?.highestComfortable ?? "None";
  const everydayLabel =
    emailTier === "None" ? "Simple email only" : emailTier;
  const writingLabel =
    writingTier === "None" ? "Short notes only" : writingTier;
  const spreadsheetLabel =
    spreadsheetTier === "None" ? "Small tables only" : spreadsheetTier;
  const multitaskingLabel = friendlyMultitaskingLevel(multitaskingTier);
  const videoLabel = friendlyVideoLevel(result.video);
  const bestFor = [];

  if ((result.email?.score ?? 0) >= 58) {
    bestFor.push({
      title: "Email and webmail",
      detail: `${everydayLabel} was comfortable in search, long-thread, newsletter, bulk-action, and composing tests.`,
    });
  }
  if ((result.writing?.score ?? 0) >= 58) {
    bestFor.push({
      title: "Writing and documents",
      detail: `${writingLabel} remained comfortable while editing, rewrapping, formatting, and reopening.`,
    });
  }
  if ((result.spreadsheets?.score ?? 0) >= 58) {
    bestFor.push({
      title: "Spreadsheets",
      detail: `${spreadsheetLabel} remained comfortable during recalculation, sorting, filtering, pasting, and scrolling.`,
    });
  }

  if (result.video?.available !== false && videoLabel !== "Not comfortable") {
    bestFor.push({
      title: "Video playback",
      detail: `${videoLabel} completed comfortably in the local playback test.`,
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
      result.grade.startsWith("C")
        ? "Useful for focused office and browser work when larger files and overlapping jobs are kept under control."
        : "A practical fit for the measured email, writing, spreadsheet, media, and multitasking workloads below.",
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
