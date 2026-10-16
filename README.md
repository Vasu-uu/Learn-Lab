# LearnLab

A personal, interactive learning platform that runs entirely in the browser.
Courses are plain folders; LearnLab turns them into a dashboard, syllabus, lessons with
live demos, quizzes, spaced-repetition review and notes. No build step, no backend, no install.

**Courses**

| Course | Lessons | Live demos |
|---|---|---|
| Computer Vision: From Basics to Advanced | 18 + cheat sheets, glossary, interview questions | 100+ |

## Run it

Clone and open `index.html` in a browser, or serve the folder (recommended):

```bash
git clone https://github.com/Vasu-uu/Learn-Lab.git
cd Learn-Lab
python -m http.server 5173
```

Then open http://localhost:5173.

## Features

- **Dashboard**: day streak, XP, lessons done, review cards due, "continue where you left off", study-activity heatmap
- **Course pages**: syllabus by part with per-lesson progress and reading status
- **Lessons**
  - interactive demos (sliders, drag-and-drop, step-through animations) built with Canvas
  - formulas, callouts, tables and copyable code
  - reading tracker in the table of contents
  - "Check yourself" flip cards and a scored quiz with explanations
  - notes drawer (`N`), previous / next lesson (`←` `→`)
  - use your own photo in the image demos (stays on your device)
- **Review**: spaced repetition built from every lesson's self-check questions (`Space` to flip, `1`–`4` to grade)
- **Notes**: every note in one searchable page, exportable as Markdown
- **Search** across all courses (`Ctrl K` or `/`)
- **Design**: monochrome black & white with light and dark modes, responsive down to phone width

All progress, notes and review cards are stored in your browser's `localStorage`.

## Add a course

The in-app **Add a course** page has the full guide. In short:

1. Copy `courses/_template` to `courses/<your-course>`.
2. Edit `course.js` (id, title, parts, file list).
3. Write lessons in Markdown inside `lessons.js` (`## Heading` starts a section).
4. Add `'<your-course>'` to `courses/courses.js` and reload.

Lesson Markdown supports `### headings`, **bold**, *italic*, `==highlighted terms==`, lists, tables,
fenced code, `$$ formulas $$`, `> [!key|tip|warn|note]` callouts and `::demo name` to embed any
interactive widget.

## Project structure

```
index.html                     app shell
css/style.css                  design system (monochrome, light + dark)
js/core.js                     course registry, Markdown renderer, canvas and plotting helpers
js/app.js                      loader, router, dashboard, lessons, review, notes, search
courses/courses.js             list of course folders to load
courses/_template/             starter course to copy
courses/computer-vision/
  course.js                    course metadata and file list
  content/part1-5.js           lessons, self-checks and quizzes
  widgets/*.js                 interactive demos
```

## Tech

Vanilla HTML, CSS and JavaScript. Fonts from Google Fonts (falls back to system fonts offline).
