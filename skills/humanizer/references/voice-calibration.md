# Mode C — voice calibration

Use when the user provides a writing sample (their own previous work) alongside the passage to humanize. The goal is to match *their* voice, not the generic "natural" voice from Mode A.

## When this fires

The user says any of:

- "Humanize this. Here's a sample of my writing for voice matching: [sample]"
- "Use my style from [file path] as a reference."
- "Match the tone of this email I wrote: [sample]"
- "Rewrite this to sound like me. Here's how I usually write: [sample]"

If only a passage is provided and no sample, fall back to Mode A.

## Procedure

### 1. Read the sample first. Profile it.

Don't skim. Read it twice. Note:

| Dimension | What to look for |
|---|---|
| **Sentence length** | Short and punchy? Long and flowing? Mixed? What's the median? |
| **Word-choice register** | Casual ("stuff", "things")? Academic ("constructs", "elements")? Between? |
| **Paragraph openings** | Jump straight into the point? Set context first? Open with a question? |
| **Punctuation habits** | Dashes? Parentheticals? Semicolons? Em-dashes (they may use them; the *bug* is AI overuse, not human use)? |
| **Recurring phrases / verbal tics** | "Look", "honestly", "basically", "to be fair" — find their 2–3 verbal signatures |
| **Transitions** | Explicit connectors ("However", "On the other hand")? Or do they just start the next point? |
| **Opinions vs neutral** | Do they have a point of view? Hedge? Commit? |
| **First-person usage** | Do they use "I"? Often, sparingly, never? |
| **Specificity** | Do they name people, numbers, places? Or speak in abstractions? |

Write the profile out before you draft. Even three lines. The profile is the brief.

### 2. Humanize against that profile

Don't just remove AI patterns. Replace them with patterns from the sample.

- If they write short sentences, don't produce long ones.
- If they use "stuff" and "things," don't upgrade to "elements" and "components."
- If they never use semicolons, you don't either.
- If they hedge ("kind of", "sort of", "I think"), let your rewrite hedge.
- If they commit ("This is wrong", "That doesn't work"), commit.
- If they use a verbal tic ("look," "honestly,"), use one. Not on every sentence — just where it fits.

### 3. Deliver as Mode A + call out the calibration

Output format:

```
**Voice profile (from your sample):**
- Sentence length: [observation]
- Register: [observation]
- Tics: [observation]
- Opinion stance: [observation]
- [other notable]

**Draft rewrite:**
[draft]

**What makes the below so obviously AI generated?**
- [bullets]

**Final rewrite:**
[final]

**Changes made:**
- [change]
- [sample-matched choice: e.g. "Kept 'to be honest' as a sentence-opener — matches your two uses in the sample"]
```

## Worked example

**Sample provided:**
> Look, I've been doing this for fifteen years and most of what people teach about productivity is nonsense. The actual answer is boring. You sit down and you do the work. You don't optimise your morning routine. You don't buy another notebook. You just do the thing.

**Profile:**
- Sentence length: short, mostly 6–14 words. One long-ish sentence per 4–5 short ones.
- Register: casual ("nonsense", "the thing"), no jargon.
- Tics: opens with "Look,". Repeats "You don't X. You don't Y. You just Z." pattern.
- Opinions: heavy. No hedging.
- First person: "I've been doing this..." — uses I when it earns it.
- Specificity: "fifteen years," "another notebook" — concrete, slightly dismissive.

**Passage to humanize:**
> In today's rapidly evolving productivity landscape, individuals seeking to optimize their workflows must navigate an overwhelming array of methodologies. From bullet journaling to time-blocking, the proliferation of techniques can paradoxically hinder productivity itself. The key insight is that consistency, not novelty, drives results.

**Draft rewrite (Mode A — generic natural):**
> Most productivity advice is contradictory. Bullet journals, time-blocking, the Pomodoro technique — there are too many systems. Consistency matters more than which one you pick.

**Final rewrite (Mode C — voice-matched):**
> Look, there are about fifty productivity methods now and they all contradict each other. Bullet journals. Time-blocking. Pomodoros. Pick one. Stick with it. That's the whole trick.

**Why the voice match:**
- Opened with "Look," (matches the sample's opener).
- Short sentences (matches the sample's median length).
- "That's the whole trick" — dismissive register matching "the actual answer is boring."
- No "key insight," no "navigate," no jargon — register matches the sample.
- Used the sample's `You X. You Y. You Z.` rhythm as `Pick one. Stick with it.`

## Failure mode to avoid

The most common Mode C miss: producing a "natural" rewrite (Mode A output) and calling it voice-matched. If the rewrite could have come from anyone, the calibration failed. The rewrite should be *unmistakably* the sample author's voice — even if that means using sentence fragments, semicolons, em-dashes (if the user uses them), or other patterns that Mode A would normally flag.

The patterns library is a guide, not a law. Mode C calibration overrides it where the user's own voice contradicts the generic rule.
