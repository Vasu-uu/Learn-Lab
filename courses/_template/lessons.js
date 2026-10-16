/*
  Lessons for the template course. Each CV.addChapter call is one lesson.
  Write the body in Markdown: every "## Heading" becomes a section.
  Supported: ### sub-headings, **bold**, *italic*, ==term==, `code`, lists, | tables |,
  ```fenced code```, $$ formula $$, > [!key|tip|warn|note] callouts, ::demo widget-name
*/

CV.addChapter({
  n: 1, part: 1, minutes: 8,
  title: 'Your first lesson',
  sub: 'A one-line summary shown under the title and in the syllabus.',
  md: `
## Why this matters
Start with the big idea in two or three sentences. Highlight a ==key term== the first time it appears.

> [!key] One sentence the reader should remember if they forget everything else.

## The core idea
Explain step by step:

1. First step.
2. Second step, with **emphasis** where it helps.
3. Third step.

$$ y = w · x + b $$

| Symbol | Meaning |
|---|---|
| w | weight (slope) |
| b | bias (intercept) |

### Try it
Any demo in the platform can be dropped in by name:

::demo grad-descent

## In code
\`\`\`python
import numpy as np
w, b = np.polyfit(x, y, deg=1)
\`\`\`

> [!tip] Keep sections short. The reading tracker ticks each one off as you finish it.
`,
  checks: [
    ['A question to answer from memory?', 'The answer, in one or two sentences.'],
  ],
  quiz: [
    { q: 'A multiple-choice question?', o: ['Option A', 'Option B (correct)', 'Option C'], a: 1, e: 'Why B is right.' },
  ],
});
