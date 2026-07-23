# UX and Content Specification

## 1. Experience goal

The app should feel like a friendly diagnostic station, not a gaming benchmark or a punishment test. The user should always know:

- what is happening;
- why the action is relevant;
- how long the current module is likely to feel, without countdown anxiety;
- how to stop safely;
- what the result means in everyday language.

## 2. Voice and tone

- Plainspoken
- Respectful of old equipment
- Neutral, not nostalgic or mocking
- Transparent about uncertainty
- Encouraging without exaggeration

Avoid:

- “potato computer”;
- “obsolete” based only on age;
- “future-proof”;
- “your CPU failed” when only the browser was measured;
- unexplained acronyms on primary screens.

## 3. Information architecture

### Primary routes

- `/` — landing
- `/prepare` — preflight and test selection
- `/test/:module` — active benchmark module
- `/result/:localId` — result report
- `/history` — local run history
- `/methodology` — public methodology
- `/privacy` — privacy and data behavior
- `/about` — product purpose and limitations

Do not load result charts or benchmark assets on the landing route unless needed.

## 4. Landing page

### Hero

**Headline:**  
Is this computer still good for everyday use?

**Supporting line:**  
Run a short, practical test for browsing, documents, video, and multitasking. Get a plain-language result—not just a mystery number.

**Primary action:**  
Test this computer

**Secondary action:**  
See how it works

### Trust strip

- No account
- No ads during testing
- Runs locally
- Open methodology
- About 4 or 8 minutes

### Explainer

**What this measures**  
How responsive this browser feels during common tasks.

**What it cannot see**  
System temperature, total RAM use, battery health, or performance in every application.

## 5. Prepare screen

### Test choices

#### Quick Check

- about 4 minutes;
- responsiveness;
- documents;
- multitasking;
- basic result.

#### Full Test

- about 8 minutes;
- all Quick Check modules;
- motion smoothness;
- video;
- browser storage;
- complete role badges.

### Conditions

Ask with simple controls:

**Power**
- Plugged in
- On battery
- I’m not sure

**Current setup**
- Normal everyday setup
- Clean comparison run

A “clean comparison run” means the user intentionally closed unrelated applications. It does not alter the score; it is metadata.

### Preflight outcomes

Use three states:

- Ready
- Ready with limitations
- Fix before testing

Examples:

> **Ready with limitations**  
> This browser cannot report exact dropped video frames. Video will use a lower-confidence fallback.

> **Fix before testing**  
> The benchmark tab is not visible. Return to this tab to continue.

## 6. Active test shell

Persistent elements:

- product name;
- module name;
- overall progress by module, not a continuously ticking timer;
- Stop test button;
- concise instruction;
- accessibility control to reduce or skip motion before a motion module;
- no navigation menu that invites accidental exit.

### Stop behavior

On Stop:

> Stop the test? Completed modules will be saved, but the result will be partial.

Buttons:

- Continue test
- Stop and view partial result

## 7. Module content

## 7.1 Everyday response

**Intro:**  
You’ll use a small practice inbox. We’re measuring how quickly the screen responds—not how quickly you type.

Prompts:

- Open the message from River Street Library.
- Search for `repair fair`.
- Sort the inbox by sender.
- Type: `The refurbished laptops are ready for pickup.`
- Check the three completed tasks.

Never grade typing speed or spelling. Detect the expected supplied string only to know when the interaction is complete.

## 7.2 Documents

**Intro:**  
This checks reading, searching, sorting, editing, and saving a document-like workload.

Prompts:

- Find the section called Device Intake.
- Search for `battery inspection`.
- Sort the inventory table by year.
- Add the sentence shown below.
- Save the draft, then reopen it.

## 7.3 Multitasking

**Intro:**  
For a few seconds, the app will do background work while you keep using it. This shows whether the computer stays responsive when tasks overlap.

**Before pressure:**  
Background work starts when you press Begin. You can stop at any time.

**During pressure:**  
Keep typing and switching panels normally. The test ends automatically.

**Emergency state:**  
This device is having trouble staying responsive. The pressure test was stopped early.

Do not display a shaming failure animation.

## 7.4 Smoothness

**Intro:**  
This short scene checks whether ordinary motion and scrolling stay smooth.

Offer:

- Run motion test
- Skip motion test

If `prefers-reduced-motion` is active:

> Your system requests reduced motion. This test is optional and will not start unless you choose it.

## 7.5 Video

**Intro:**  
This plays a short local test clip. Internet speed is not included once the clip is ready.

Display the tested tier and codec in details, not as the main focus.

## 7.6 Browser storage

**Intro:**  
This briefly writes and reads temporary data inside the browser. Test data is deleted afterward.

Buttons:

- Run storage test
- Skip

## 8. Result page hierarchy

### First screenful

1. Grade and label
2. One-sentence interpretation
3. Best-use role badges
4. Main limitation
5. Confidence

Example:

> **B — Useful**  
> This computer is comfortable for everyday web and document work, but heavy multitasking is its main limit.

### Category cards

Each card includes:

- plain-language category;
- 0–100 score;
- Comfortable / Usable / Limited / Struggling label;
- one observable metric summary;
- Details disclosure.

Example:

> **Everyday response — 74, Useful**  
> Most interactions appeared within 220 ms. A few slower moments reached 410 ms.

### “Good fit for” section

Show role badges as positive recommendations.

### “Use with care” section

Show concrete limitations:

- Keep to one main task
- Prefer 720p video
- Large document searches may pause
- Results varied between rounds

### “Try next” section

Limit to the three most relevant suggestions.

### Technical details

Collapsed by default:

- raw metrics;
- browser context;
- benchmark version;
- power state;
- viewport;
- supported APIs;
- interruption log;
- category calculations.

## 9. Grade content

### A — Comfortable

> This device handles the tested everyday workload with little noticeable waiting.

### B — Useful

> This device remains practical for everyday use. You may notice limits during heavier overlap or media work.

### C — Light-duty

> This device is worthwhile for lighter tasks when you keep the workload focused.

### D — Single-purpose

> This device works best when assigned one clear job at a time.

### E — Struggling

> The tested browser workload caused delays that would interfere with ordinary use. A narrower offline role may still be possible.

## 10. Comparison view

Allow two local results to be compared only when:

- benchmark profile versions match, or a warning is shown;
- browser family is the same, or a warning is shown;
- tested power conditions are visible.

Display:

- overall score difference;
- category differences;
- confidence changes;
- browser or setup changes;
- “meaningful change” only when difference exceeds repeat-run tolerance.

Do not use celebratory language for differences smaller than expected variance.

## 11. Printable and copyable summary

### Copyable format

```text
StillGood v1 — B (Useful), 76/100
Web and Email Ready · Office Ready · Thin-Client Ready
Main limit: heavier multitasking
Video: comfortable at 720p
Confidence: High
Browser: Firefox, Linux
```

### Printed report

One page preferred. Include a QR code only in a later hosted-sharing feature; never embed a tracking URL by default.

## 12. Error language

### Asset failed

> A test file did not load correctly, so this module was not scored. Check the connection once, then try the module again.

### Tab hidden

> The browser pauses some work in background tabs. This round was stopped so the result stays fair.

### High variability

> The rounds did not agree closely enough for a confident result. Background activity or changing power conditions may be involved.

### Unsupported browser

> This browser can run a limited version of the test, but some measurements will use fallbacks. Your result will show lower confidence.
