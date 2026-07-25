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

function webUse(tier) {
  if (tier === "Basic") {
    return {
      title: "Web and email",
      detail:
        "Email, reading, shopping, and simple sites. Keep to a few ordinary tabs.",
    };
  }
  if (tier === "Everyday") {
    return {
      title: "Everyday browsing",
      detail:
        "Email, shopping, reading, and routine web apps with a modest number of tabs.",
    };
  }
  if (tier === "Busy") {
    return {
      title: "Active web use",
      detail: "Several ordinary tabs and richer sites should remain comfortable.",
    };
  }
  if (tier === "Demanding" || tier === "Extreme") {
    return {
      title: "Demanding web apps",
      detail: "Complex browser apps and many active pages should remain responsive.",
    };
  }
  return {
    title: "Simple websites",
    detail: "Use one uncomplicated page at a time.",
  };
}

export function buildCapabilityGuide(result) {
  const everydayTier = result.everyday?.highestComfortable ?? "None";
  const multitaskingTier =
    result.multitasking?.highestComfortable ?? "None";
  const everydayLabel = friendlyEverydayLevel(everydayTier);
  const multitaskingLabel = friendlyMultitaskingLevel(multitaskingTier);
  const videoLabel = friendlyVideoLevel(result.video);
  const bestFor = [webUse(everydayTier)];

  if ((result.documents?.score ?? 0) >= 58) {
    bestFor.unshift({
      title: "Writing and documents",
      detail:
        (result.documents?.score ?? 0) >= 84
          ? "Notes, letters, reports, PDFs, and light formatting are a strong fit."
          : "Short documents, notes, and ordinary PDFs should be practical.",
    });
    bestFor.push({
      title: "Basic spreadsheets",
      detail:
        (result.documents?.score ?? 0) >= 84
          ? "Everyday lists, budgets, sorting, and simple formulas should be a good fit."
          : "Small lists, budgets, and uncomplicated tables should be usable.",
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
  if (["None", "Basic", "Everyday"].includes(everydayTier)) {
    cautions.push({
      title: "Heavy web apps",
      detail:
        "Open demanding sites one at a time and close tabs when you finish with them.",
    });
  }
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
      everydayTier === "Basic"
        ? "Good for writing, basic spreadsheets, email, PDFs, and browsing with a few ordinary tabs."
        : result.grade.startsWith("C")
          ? "Good for focused everyday work when heavier browser apps are kept under control."
          : "A practical fit for the ordinary browser and document work shown below.",
    everydayLabel,
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
