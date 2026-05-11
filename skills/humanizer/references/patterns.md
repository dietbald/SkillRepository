# Pattern catalogue

29 patterns adapted from [blader/humanizer](https://github.com/blader/humanizer) (MIT), based on [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), plus 5 brand-tic additions from the R18 site audit (patterns 30–34).

Scan the input against each. Mark every hit before drafting the rewrite.

---

## CONTENT PATTERNS

### 1. Undue emphasis on significance, legacy, and broader trends

**Watch:** stands/serves as, is a testament/reminder, vital/significant/crucial/pivotal/key role/moment, underscores/highlights its importance/significance, reflects broader, symbolizing its ongoing/enduring/lasting, contributing to the, setting the stage for, marking/shaping the, represents/marks a shift, key turning point, evolving landscape, focal point, indelible mark, deeply rooted.

**Problem:** AI puffs up importance by adding statements about how arbitrary aspects represent or contribute to a broader topic.

**Before:**
> The Statistical Institute of Catalonia was officially established in 1989, marking a pivotal moment in the evolution of regional statistics in Spain. This initiative was part of a broader movement across Spain to decentralize administrative functions and enhance regional governance.

**After:**
> The Statistical Institute of Catalonia was established in 1989 to collect and publish regional statistics independently from Spain's national statistics office.

---

### 2. Undue emphasis on notability and media coverage

**Watch:** independent coverage, local/regional/national media outlets, written by a leading expert, active social media presence.

**Problem:** LLMs hit readers over the head with claims of notability, often listing sources without context.

**Before:**
> Her views have been cited in The New York Times, BBC, Financial Times, and The Hindu. She maintains an active social media presence with over 500,000 followers.

**After:**
> In a 2024 New York Times interview, she argued that AI regulation should focus on outcomes rather than methods.

---

### 3. Superficial analyses with -ing endings

**Watch:** highlighting/underscoring/emphasizing..., ensuring..., reflecting/symbolizing..., contributing to..., cultivating/fostering..., encompassing..., showcasing...

**Problem:** AI tacks present-participle phrases onto sentences to add fake depth.

**Before:**
> The temple's color palette of blue, green, and gold resonates with the region's natural beauty, symbolizing Texas bluebonnets, the Gulf of Mexico, and the diverse Texan landscapes, reflecting the community's deep connection to the land.

**After:**
> The temple uses blue, green, and gold colors. The architect said these were chosen to reference local bluebonnets and the Gulf coast.

---

### 4. Promotional and advertisement-like language

**Watch:** boasts a, vibrant, rich (figurative), profound, enhancing its, showcasing, exemplifies, commitment to, natural beauty, nestled, in the heart of, groundbreaking (figurative), renowned, breathtaking, must-visit, stunning.

**Problem:** LLMs struggle to keep a neutral tone, especially for "cultural heritage" topics.

**Before:**
> Nestled within the breathtaking region of Gonder in Ethiopia, Alamata Raya Kobo stands as a vibrant town with a rich cultural heritage and stunning natural beauty.

**After:**
> Alamata Raya Kobo is a town in the Gonder region of Ethiopia, known for its weekly market and 18th-century church.

---

### 5. Vague attributions and weasel words

**Watch:** Industry reports, Observers have cited, Experts argue, Some critics argue, several sources/publications (when few are cited).

**Problem:** AI attributes opinions to vague authorities without specific sources.

**Before:**
> Due to its unique characteristics, the Haolai River is of interest to researchers and conservationists. Experts believe it plays a crucial role in the regional ecosystem.

**After:**
> The Haolai River supports several endemic fish species, according to a 2019 survey by the Chinese Academy of Sciences.

---

### 6. Outline-like "Challenges and Future Prospects" sections

**Watch:** Despite its... faces several challenges..., Despite these challenges, Challenges and Legacy, Future Outlook.

**Problem:** AI defaults to formulaic "Challenges" sections.

**Before:**
> Despite its industrial prosperity, Korattur faces challenges typical of urban areas, including traffic congestion and water scarcity. Despite these challenges, with its strategic location and ongoing initiatives, Korattur continues to thrive.

**After:**
> Traffic congestion increased after 2015 when three new IT parks opened. The municipal corporation began a stormwater drainage project in 2022 to address recurring floods.

---

## LANGUAGE AND GRAMMAR PATTERNS

### 7. Overused "AI vocabulary" words

**High-frequency AI words:** actually, additionally, align with, crucial, delve, emphasizing, enduring, enhance, fostering, garner, highlight (verb), interplay, intricate/intricacies, key (adjective), landscape (abstract noun), pivotal, showcase, tapestry (abstract noun), testament, underscore (verb), valuable, vibrant.

**Problem:** These words appear far more frequently in post-2023 text. They often co-occur.

**Before:**
> Additionally, a distinctive feature of Somali cuisine is the incorporation of camel meat. An enduring testament to Italian colonial influence is the widespread adoption of pasta in the local culinary landscape, showcasing how these dishes have integrated into the traditional diet.

**After:**
> Somali cuisine also includes camel meat, which is considered a delicacy. Pasta dishes, introduced during Italian colonization, remain common, especially in the south.

---

### 8. Copula avoidance (avoiding "is" / "are")

**Watch:** serves as / stands as / marks / represents [a], boasts / features / offers [a].

**Problem:** LLMs substitute elaborate constructions for simple copulas.

**Before:**
> Gallery 825 serves as LAAA's exhibition space for contemporary art. The gallery features four separate spaces and boasts over 3,000 square feet.

**After:**
> Gallery 825 is LAAA's exhibition space for contemporary art. The gallery has four rooms totaling 3,000 square feet.

---

### 9. Negative parallelisms and tailing negations

**Problem:** Constructions like "Not only...but..." or "It's not just about..., it's..." are overused. So are clipped tailing-negation fragments like "no guessing" or "no wasted motion" tacked onto a sentence instead of written as a real clause.

**Before:**
> It's not just about the beat riding under the vocals; it's part of the aggression and atmosphere. It's not merely a song, it's a statement.

**After:**
> The heavy beat adds to the aggressive tone.

**Before (tailing negation):**
> The options come from the selected item, no guessing.

**After:**
> The options come from the selected item without forcing the user to guess.

---

### 10. Rule of three overuse

**Problem:** LLMs force ideas into groups of three to appear comprehensive.

**Before:**
> The event features keynote sessions, panel discussions, and networking opportunities. Attendees can expect innovation, inspiration, and industry insights.

**After:**
> The event includes talks and panels. There's also time for informal networking between sessions.

---

### 11. Elegant variation (synonym cycling)

**Problem:** AI repetition-penalty code causes excessive synonym substitution.

**Before:**
> The protagonist faces many challenges. The main character must overcome obstacles. The central figure eventually triumphs. The hero returns home.

**After:**
> The protagonist faces many challenges but eventually triumphs and returns home.

---

### 12. False ranges

**Problem:** LLMs use "from X to Y" constructions where X and Y aren't on a meaningful scale.

**Before:**
> Our journey through the universe has taken us from the singularity of the Big Bang to the grand cosmic web, from the birth and death of stars to the enigmatic dance of dark matter.

**After:**
> The book covers the Big Bang, star formation, and current theories about dark matter.

---

### 13. Passive voice and subjectless fragments

**Problem:** LLMs hide the actor or drop the subject entirely ("No configuration file needed", "The results are preserved automatically").

**Before:**
> No configuration file needed. The results are preserved automatically.

**After:**
> You do not need a configuration file. The system preserves the results automatically.

---

## STYLE PATTERNS

### 14. Em-dash overuse

**Problem:** LLMs use em-dashes (—) more than humans, mimicking "punchy" sales writing. Most can be rewritten more cleanly with commas, periods, or parentheses.

**Before:**
> The term is primarily promoted by Dutch institutions—not by the people themselves. You don't say "Netherlands, Europe" as an address—yet this mislabeling continues—even in official documents.

**After:**
> The term is primarily promoted by Dutch institutions, not by the people themselves. You don't say "Netherlands, Europe" as an address, yet this mislabeling continues in official documents.

---

### 15. Overuse of boldface

**Problem:** AI emphasises phrases in boldface mechanically.

**Before:**
> It blends **OKRs (Objectives and Key Results)**, **KPIs (Key Performance Indicators)**, and visual strategy tools such as the **Business Model Canvas (BMC)** and **Balanced Scorecard (BSC)**.

**After:**
> It blends OKRs, KPIs, and visual strategy tools like the Business Model Canvas and Balanced Scorecard.

---

### 16. Inline-header vertical lists

**Problem:** AI outputs lists where items start with bolded headers followed by colons.

**Before:**
> - **User Experience:** The user experience has been significantly improved with a new interface.
> - **Performance:** Performance has been enhanced through optimized algorithms.
> - **Security:** Security has been strengthened with end-to-end encryption.

**After:**
> The update improves the interface, speeds up load times through optimized algorithms, and adds end-to-end encryption.

---

### 17. Title case in headings

**Problem:** AI capitalises all main words in headings.

**Before:**
> ## Strategic Negotiations And Global Partnerships

**After:**
> ## Strategic negotiations and global partnerships

---

### 18. Emojis

**Problem:** AI decorates headings or bullet points with emojis.

**Before:**
> 🚀 **Launch Phase:** The product launches in Q3
> 💡 **Key Insight:** Users prefer simplicity
> ✅ **Next Steps:** Schedule follow-up meeting

**After:**
> The product launches in Q3. User research showed a preference for simplicity. Next step: schedule a follow-up meeting.

---

### 19. Curly quotation marks

**Problem:** ChatGPT uses curly quotes ("...") instead of straight quotes ("...").

**Before:**
> He said "the project is on track" but others disagreed.

**After:**
> He said "the project is on track" but others disagreed.

---

## COMMUNICATION PATTERNS

### 20. Collaborative communication artifacts

**Watch:** I hope this helps, Of course!, Certainly!, You're absolutely right!, Would you like..., let me know, here is a...

**Problem:** Text meant as chatbot correspondence gets pasted as content.

**Before:**
> Here is an overview of the French Revolution. I hope this helps! Let me know if you'd like me to expand on any section.

**After:**
> The French Revolution began in 1789 when financial crisis and food shortages led to widespread unrest.

---

### 21. Knowledge-cutoff disclaimers

**Watch:** as of [date], Up to my last training update, While specific details are limited/scarce..., based on available information...

**Problem:** AI disclaimers about incomplete information get left in text.

**Before:**
> While specific details about the company's founding are not extensively documented in readily available sources, it appears to have been established sometime in the 1990s.

**After:**
> The company was founded in 1994, according to its registration documents.

---

### 22. Sycophantic / servile tone

**Problem:** Overly positive, people-pleasing language.

**Before:**
> Great question! You're absolutely right that this is a complex topic. That's an excellent point about the economic factors.

**After:**
> The economic factors you mentioned are relevant here.

---

## FILLER AND HEDGING

### 23. Filler phrases

| Before | After |
|---|---|
| In order to achieve this goal | To achieve this |
| Due to the fact that it was raining | Because it was raining |
| At this point in time | Now |
| In the event that you need help | If you need help |
| The system has the ability to process | The system can process |
| It is important to note that the data shows | The data shows |

---

### 24. Excessive hedging

**Problem:** Over-qualifying statements.

**Before:**
> It could potentially possibly be argued that the policy might have some effect on outcomes.

**After:**
> The policy may affect outcomes.

---

### 25. Generic positive conclusions

**Problem:** Vague upbeat endings.

**Before:**
> The future looks bright for the company. Exciting times lie ahead as they continue their journey toward excellence. This represents a major step in the right direction.

**After:**
> The company plans to open two more locations next year.

---

### 26. Hyphenated word-pair overuse

**Watch:** third-party, cross-functional, client-facing, data-driven, decision-making, well-known, high-quality, real-time, long-term, end-to-end.

**Problem:** AI hyphenates common word pairs with perfect consistency. Humans rarely hyphenate these uniformly; when they do, it's inconsistent. Less common or technical compounds are fine to hyphenate.

**Before:**
> The cross-functional team delivered a high-quality, data-driven report on our client-facing tools. Their decision-making process was well-known for being thorough and detail-oriented.

**After:**
> The cross functional team delivered a high quality, data driven report on our client facing tools. Their decision making process was known for being thorough and detail oriented.

---

### 27. Persuasive authority tropes

**Watch:** The real question is, at its core, in reality, what really matters, fundamentally, the deeper issue, the heart of the matter.

**Problem:** LLMs use these to pretend they are cutting through noise to some deeper truth, when the sentence that follows usually just restates an ordinary point with extra ceremony.

**Before:**
> The real question is whether teams can adapt. At its core, what really matters is organizational readiness.

**After:**
> The question is whether teams can adapt. That mostly depends on whether the organization is ready to change its habits.

---

### 28. Signposting and announcements

**Watch:** Let's dive in, let's explore, let's break this down, here's what you need to know, now let's look at, without further ado.

**Problem:** LLMs announce what they are about to do instead of doing it.

**Before:**
> Let's dive into how caching works in Next.js. Here's what you need to know.

**After:**
> Next.js caches data at multiple layers, including request memoization, the data cache, and the router cache.

---

### 29. Fragmented headers

**Sign:** A heading followed by a one-line paragraph that simply restates the heading before the real content begins.

**Problem:** LLMs add a generic sentence after a heading as a rhetorical warm-up. It usually adds nothing and pads the prose.

**Before:**
> ## Performance
>
> Speed matters.
>
> When users hit a slow page, they leave.

**After:**
> ## Performance
>
> When users hit a slow page, they leave.

---

# Brand-tic additions (R18 site audit)

These patterns survive single-paragraph review but accumulate across a multi-page artefact. Run these checks in Mode B (corpus audit), not just Mode A.

### 30. Accumulated parallel construction (multi-page)

**Sign:** Every section header on a service page follows the same shape (`[Noun]. [Noun]. [Noun].`). Every bolded subheading in a blog post starts with the same verb form. A four-value brand frame where every value's body is itself a tricolon (12 perfectly-shaped bullets in one section).

**Problem:** Single-page review accepts parallel construction as on-brand rhythm. Site-wide, the rhythm becomes a tic that broadcasts "AI-drafted at scale."

**How to check:** Count tricolons per 1,000 words across the corpus. Flag pages above 5/1,000 for de-symmetrising. Vary one section's rhythm so the parallel construction reads as choice, not default.

---

### 31. Perfect octocolons (the eight-step framework)

**Sign:** A blog post or doc lays out 8 numbered steps, each opening with an imperative verb (Document, Identify, Build, Delegate, Create, Install, Develop, Test). All eight slots filled. All eight verbs distinct. All eight steps the same shape.

**Problem:** This is the single loudest AI fingerprint in longform. A practitioner writing from experience would have 5 or 6 steps with one of them being a setup remark, not a step. Reality has awkward joints; AI smooths them.

**Fix:** Collapse 8 → 5 or 6. Merge steps that are the same point (e.g. "Build systems before hiring" + "Delegate outcomes not tasks" usually collapse). Let one item be a non-imperative aside.

---

### 32. Same rhetorical move twice in one piece

**Sign:** A blog post titled *"It is not a motivation problem. It is a structural one."* opens with that line and reuses the same "Not X. It is Y." cadence in its mid-article subhead.

**Problem:** Single-pass review reads each instance as effective. A human would notice they wrote the move twice and break one.

**How to check:** Highlight every "Not X. Y." or "It is not A. It is B." in the document. If there are more than 2 in a 1,500-word piece, the cadence has become a crutch. Rewrite one.

---

### 33. Methodology-label drift across pages

**Sign:** A four-phase methodology label (`Diagnose · Design · Deliver · Sustain`) appears on home, about, and approach. A five-phase variant (`Diagnose · Document · Build · Transition · Operate/Transfer`) appears on a service page. A different five-phase variant appears on another service page.

**Problem:** A reader visiting more than one page notices the methodology shape-shifting. Either the brand has one methodology with service-specific phases (label it consistently), or service-specific methodologies (label them clearly as such). Decide and propagate.

**How to check:** Search the corpus for every methodology-label string. Tabulate. Align.

---

### 34. Book-citation roll-call as evidence stand-in

**Sign:** A "scale your business" blog post references Gerber, Martell, Michalowicz, and Warrillow — the four canonical reading-list authors. All in one piece.

**Problem:** AI default for any "scale your business" prompt is to assemble the canonical reading list. A real consultant cites one of those four per article (the one they actually rely on), not all four. Proprietary case data does the rest of the work.

**Fix:** Pick the one author whose model you're actually applying. Cut the others. Replace their cameos with case data from the firm's own engagements.

---

## How to use this catalogue

- **Mode A (single passage):** Scan against 1–29. Patterns 30–34 rarely fire on one passage.
- **Mode B (corpus / site audit):** Scan against 1–34. Patterns 30–34 are the ones that survive single-page review and need the corpus view to catch.
- **Mode C (voice-match):** Scan against 1–29, then prefer the user's existing patterns where they conflict with "generic natural" alternatives.

Not every match is a fix. Some patterns are on-brand for a particular voice (e.g. tricolons in a brand that uses periods as a device). The job is to notice the pattern, then decide — not to mass-rewrite.
