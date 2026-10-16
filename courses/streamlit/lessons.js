/* Streamlit course lessons (Markdown) */
(function () {
  const T = '```';

  /* ============================ 1 ============================ */
  CV.addChapter({
    n: 1, part: 1, minutes: 12,
    title: 'What is Streamlit?',
    sub: 'A Python script becomes a web app. The one idea you must understand: the whole script reruns on every interaction.',
    md: `
## The idea
==Streamlit== is an open-source Python framework for building data and machine-learning apps without writing HTML, CSS or JavaScript. You write an ordinary script; every \`st.*\` call adds something to the page.

${T}python
# app.py
import streamlit as st

st.title("Hello, Streamlit")
name = st.text_input("Your name")
st.write("Hi", name)
${T}

${T}bash
pip install streamlit
streamlit run app.py          # opens http://localhost:8501
streamlit hello               # built-in demo gallery
${T}

Saving the file while the app is open shows a "Source file changed" prompt; choose **Always rerun** for live reload.

## The rerun model
This is the single most important concept in Streamlit:

1. The server runs your script **from top to bottom**.
2. Each \`st.*\` call sends an element to the browser.
3. When the user touches a widget, the **whole script runs again**, top to bottom, with the widget now returning its new value.
4. Streamlit diffs the new output against the page and updates only what changed.

::demo st-rerun

> [!key] There are no event handlers to wire up. Widgets are just function calls that return values, and interaction = rerun. Everything else in this course (session state, caching, forms, fragments) exists to make that model fast and stateful.

## Consequences of rerunning
- **Variables reset** every run. \`count = 0\` really is zero on every rerun (see lesson 5).
- **Slow code runs again** every time, unless you cache it (lesson 7).
- \`st.button\` returns \`True\` only on the rerun caused by the click.
- Order matters: elements appear in the order the calls execute.

## Where Streamlit fits
| Tool | Best for | Trade-off |
|---|---|---|
| Streamlit | data apps, dashboards, ML demos, internal tools | opinionated layout; rerun model |
| Gradio | quick ML model demos | less general layout |
| Dash (Plotly) | callback-based analytical dashboards | more boilerplate |
| Flask / FastAPI | full web apps and APIs | you build the front end |

## Under the hood
A \`streamlit run\` process starts a Tornado web server. Each browser tab opens a WebSocket ==session==. Your script executes on the server in a thread per session; elements are sent to a React front end as protobuf messages. That is why every user gets their own state, and why heavy shared work should be cached.
`,
    checks: [
      ['What happens when a user moves a slider?', 'The whole script reruns from top to bottom, and st.slider returns the new value on that run.'],
      ['Why does st.button seem to "forget" it was clicked?', 'It returns True only for the rerun the click triggered; the next interaction causes a new rerun where it returns False.'],
      ['How do you start a Streamlit app?', 'streamlit run app.py (serves on port 8501 by default).'],
    ],
    quiz: [
      { q: 'A user changes a selectbox. Which code runs?', o: ['Only the selectbox line', 'Only code after the selectbox', 'The entire script, top to bottom', 'Nothing until a button is pressed'], a: 2 },
      { q: 'Which statement about Streamlit is true?', o: ['You must write a React front end', 'Widgets are function calls that return values', 'Each widget needs an on_click callback', 'State persists in normal variables'], a: 1 },
      { q: 'Two browser tabs open the same app. They…', o: ['Share all variables', 'Each get their own session', 'Block each other', 'Must use the same widget values'], a: 1 },
    ],
  });

  /* ============================ 2 ============================ */
  CV.addChapter({
    n: 2, part: 1, minutes: 14,
    title: 'Showing Text, Data and Media',
    sub: 'st.write and "magic", markdown, dataframes, metrics, JSON, code, alerts, progress and media.',
    md: `
## st.write: the Swiss army knife
\`st.write(*args)\` inspects each argument and renders it appropriately: strings as Markdown, DataFrames as interactive tables, dicts as JSON, figures as charts, exceptions as error boxes.

==Magic==: a bare expression on its own line is written automatically.

${T}python
import streamlit as st
import pandas as pd

df = pd.DataFrame({"city": ["Pune", "Delhi"], "sales": [120, 95]})
"## Sales"        # magic: rendered as Markdown
df                # magic: rendered as a dataframe
st.write("Total:", df.sales.sum())
${T}

## The element gallery
::demo st-elements

## Text elements
| Call | Use |
|---|---|
| \`st.title\`, \`st.header\`, \`st.subheader\` | headings (they get anchor links) |
| \`st.markdown(text)\` | GitHub-flavoured Markdown, emoji shortcodes, colours like \`:blue[text]\` |
| \`st.caption\`, \`st.text\`, \`st.code\`, \`st.latex\` | small text, fixed-width text, highlighted code, LaTeX |
| \`st.divider()\` | a horizontal rule |

## Data elements
- \`st.dataframe(df)\`: interactive grid (sort, search, resize, download). Use \`column_config\` to show progress bars, links, images or formatted numbers.
- \`st.data_editor(df)\`: an editable grid that **returns** the edited DataFrame; set \`num_rows="dynamic"\` to add/delete rows.
- \`st.table(df)\`: a static table.
- \`st.metric(label, value, delta)\`: KPI tiles.
- \`st.json(obj)\`: collapsible JSON.

${T}python
st.dataframe(
    df,
    column_config={
        "sales": st.column_config.ProgressColumn("Sales", min_value=0, max_value=200),
        "url": st.column_config.LinkColumn("Website"),
    },
    hide_index=True,
)
edited = st.data_editor(df, num_rows="dynamic")
${T}

## Status, progress and media
- Alerts: \`st.success\`, \`st.info\`, \`st.warning\`, \`st.error\`, \`st.exception(e)\`; toasts: \`st.toast("Saved")\`.
- Progress: \`st.progress(value, text)\`, \`with st.spinner("…"):\`, \`with st.status("…") as s:\` for multi-step tasks.
- Media: \`st.image\`, \`st.audio\`, \`st.video\`; images accept URLs, files, NumPy arrays and PIL images.

> [!tip] Placeholders: \`slot = st.empty()\` reserves a spot you can overwrite later with \`slot.write(...)\` or clear with \`slot.empty()\`. Handy for live counters and progress text.
`,
    checks: [
      ['What is Streamlit "magic"?', 'A bare expression on its own line (a variable, string, DataFrame) is automatically passed to st.write.'],
      ['Difference between st.dataframe and st.data_editor?', 'st.dataframe displays an interactive read-only grid; st.data_editor lets the user edit cells and returns the edited data.'],
      ['How do you update the same spot on the page repeatedly?', 'Create a placeholder with st.empty() and write into it.'],
    ],
    quiz: [
      { q: 'Which call shows a KPI with a change indicator?', o: ['st.table', 'st.metric', 'st.json', 'st.caption'], a: 1 },
      { q: 'You want users to edit rows of a DataFrame and get the result back. Use…', o: ['st.table', 'st.dataframe', 'st.data_editor', 'st.write'], a: 2 },
      { q: 'st.write(my_dict) renders…', o: ['Plain text', 'Collapsible JSON', 'A chart', 'An error'], a: 1 },
    ],
  });

  /* ============================ 3 ============================ */
  CV.addChapter({
    n: 3, part: 1, minutes: 15,
    title: 'Widgets: Taking Input',
    sub: 'Buttons, sliders, text, selects, dates, files and more; their return values, keys and defaults.',
    md: `
## Widgets are functions
Each widget draws an input and **returns its current value** on this run.

::demo st-widgets

## The main widgets
| Widget | Returns |
|---|---|
| \`st.button\`, \`st.download_button\`, \`st.link_button\` | \`True\` on the click rerun (link button navigates) |
| \`st.checkbox\`, \`st.toggle\` | \`bool\` |
| \`st.radio\`, \`st.selectbox\`, \`st.select_slider\` | one option |
| \`st.multiselect\`, \`st.pills\`, \`st.segmented_control\` | list (or one option) |
| \`st.slider\` | number, or a tuple for a range: \`st.slider("Range", 0, 100, (20, 80))\` |
| \`st.number_input\`, \`st.text_input\`, \`st.text_area\` | number / str |
| \`st.date_input\`, \`st.time_input\` | \`datetime.date\` / \`datetime.time\` |
| \`st.file_uploader\` | \`UploadedFile\` (file-like) or \`None\` |
| \`st.camera_input\`, \`st.color_picker\` | image file / hex string |
| \`st.chat_input\` | submitted text or \`None\` |

## Identity, keys and defaults
Streamlit identifies a widget by its type plus its parameters (label, options, …). Two identical widgets collide with \`DuplicateWidgetID\`, so give them a \`key\`:

${T}python
a = st.button("Delete", key="del_a")
b = st.button("Delete", key="del_b")
${T}

Changing a widget's label or options creates a **new** widget, which resets its value. A \`key\` also exposes the value as \`st.session_state[key]\`.

> [!warn] Do not set both a \`value=\` default and \`st.session_state[key]\` for the same widget. Initialise state first and let the widget read it.

## Working with uploads
${T}python
f = st.file_uploader("CSV file", type=["csv"])
if f is not None:
    df = pd.read_csv(f)          # UploadedFile behaves like an open file
    st.dataframe(df)
    st.download_button("Download cleaned", df.to_csv(index=False), "clean.csv")
${T}

Default upload limit is 200 MB (\`server.maxUploadSize\`). Files live in memory for the session; nothing is written to disk unless you do it.

## Disabling and help
Most widgets accept \`disabled=\`, \`help="tooltip"\`, \`label_visibility="collapsed"\` and \`placeholder=\`.
`,
    checks: [
      ['What does st.slider("Range", 0, 100, (20, 80)) return?', 'A tuple (low, high), because the default value is a tuple.'],
      ['Why would you pass key= to a widget?', 'To give it a unique identity (avoid DuplicateWidgetID) and to access its value through st.session_state[key].'],
      ['What does st.file_uploader return before a file is chosen?', 'None.'],
    ],
    quiz: [
      { q: 'Two st.button("Save") calls in one script cause…', o: ['Nothing', 'DuplicateWidgetID error', 'Both return True', 'The second is hidden'], a: 1 },
      { q: 'st.multiselect returns a…', o: ['str', 'bool', 'list', 'dict'], a: 2 },
      { q: 'Changing a selectbox\'s list of options at runtime…', o: ['Keeps its value', 'Creates a new widget and resets its value', 'Raises an error', 'Freezes the app'], a: 1 },
    ],
  });

  /* ============================ 4 ============================ */
  CV.addChapter({
    n: 4, part: 2, minutes: 12,
    title: 'Layout and Containers',
    sub: 'Sidebar, columns, tabs, expanders, containers, popovers and dialogs.',
    md: `
## Build a layout
::demo st-layout

## Layout primitives
- \`st.sidebar\`: a collapsible left panel. Call elements on it: \`st.sidebar.selectbox(...)\` or \`with st.sidebar:\`.
- \`st.columns(spec)\`: side-by-side columns; \`spec\` is a count or relative widths like \`[2, 1]\`. Options: \`gap="small" | "medium" | "large"\`, \`vertical_alignment\`.
- \`st.tabs(["A", "B"])\`: all tabs' code runs every time; only the selected tab is shown.
- \`st.expander("Label")\`: collapsible section.
- \`st.container(border=True, height=300)\`: groups elements; with \`height\` it scrolls.
- \`st.popover("Settings")\`: a button that opens a floating panel.
- \`st.empty()\`: a single-element placeholder.

${T}python
with st.sidebar:
    region = st.selectbox("Region", ["All", "North", "South"])

left, right = st.columns([2, 1], gap="large")
with left:
    st.line_chart(df)
with right:
    st.metric("Users", 1200, "+8%")

tab1, tab2 = st.tabs(["Chart", "Data"])
tab1.bar_chart(df)
tab2.dataframe(df)
${T}

> [!note] Out-of-order writing: you can create containers first and fill them later. \`top = st.container()\` at the start, then \`top.write(...)\` at the end of the script renders at the top.

## Dialogs
${T}python
@st.dialog("Confirm delete")
def confirm(item):
    st.write(f"Delete {item}?")
    if st.button("Yes"):
        delete(item)
        st.rerun()

if st.button("Delete row"):
    confirm("row 3")
${T}

## Page configuration
Call \`st.set_page_config(page_title=..., page_icon=..., layout="wide", initial_sidebar_state="expanded")\` once, near the top. \`layout="wide"\` uses the full browser width.
`,
    checks: [
      ['How do you make the first of two columns twice as wide?', 'st.columns([2, 1]).'],
      ['Does code inside an unselected st.tabs tab run?', 'Yes. All tabs execute on every rerun; only the selected one is displayed.'],
      ['How can content written at the end of a script appear at the top?', 'Create a container or placeholder at the top first, then write into it later.'],
    ],
    quiz: [
      { q: 'Which makes the app use the full browser width?', o: ['st.columns(1)', 'st.set_page_config(layout="wide")', 'st.container(width=100)', 'st.sidebar.wide()'], a: 1 },
      { q: 'A scrollable fixed-height box is…', o: ['st.expander', 'st.container(height=300)', 'st.popover', 'st.tabs'], a: 1 },
      { q: '@st.dialog creates…', o: ['A new page', 'A modal whose body reruns on its own', 'A sidebar', 'A toast'], a: 1 },
    ],
  });

  /* ============================ 5 ============================ */
  CV.addChapter({
    n: 5, part: 2, minutes: 16,
    title: 'Session State, Callbacks and Forms',
    sub: 'Remember values across reruns, react to changes with callbacks, and batch input with forms.',
    md: `
## Why variables reset
Because the script reruns, normal variables are recreated every time.

::demo st-state

## st.session_state
A dictionary-like object that survives reruns for **one browser session** (one tab). Use attribute or key syntax.

${T}python
if "todos" not in st.session_state:          # initialise once
    st.session_state.todos = []

new = st.text_input("New task", key="new_task")
if st.button("Add") and new:
    st.session_state.todos.append(new)

for t in st.session_state.todos:
    st.checkbox(t, key=f"todo_{t}")
${T}

Widgets with a \`key\` store their value in session state automatically: \`st.session_state.new_task\` holds the text input's value.

## Callbacks
\`on_click\` / \`on_change\` run a function **before** the next script run, with \`args\`/\`kwargs\`. Use them to update state so the rerun already sees the change.

${T}python
def add_todo():
    st.session_state.todos.append(st.session_state.new_task)
    st.session_state.new_task = ""           # clear the input safely inside a callback

st.text_input("New task", key="new_task")
st.button("Add", on_click=add_todo)
${T}

> [!warn] You cannot assign to a widget's session-state key after that widget has been created in the current run (StreamlitAPIException). Change it in a callback, or before the widget line.

## Forms: one rerun for many inputs
Inside \`st.form\`, widget changes do not trigger reruns; everything is sent together when the submit button is pressed.

::demo st-forms

${T}python
with st.form("signup", clear_on_submit=True):
    email = st.text_input("Email")
    plan = st.radio("Plan", ["Free", "Pro"])
    ok = st.form_submit_button("Create account")
if ok:
    create(email, plan)
${T}

Rules: every form needs a \`st.form_submit_button\`; regular \`st.button\` is not allowed inside a form; only the submit button can have a callback.

## Rerun on demand
\`st.rerun()\` stops the current run and starts a new one immediately, useful after changing state that earlier elements depend on. \`st.stop()\` ends the current run early (e.g. when a required input is missing).
`,
    checks: [
      ['What is the scope of st.session_state?', 'One browser session (one tab of one user); it survives reruns but is not shared between users.'],
      ['When does an on_click callback run?', 'Before the script reruns, so the new run already sees the state it changed.'],
      ['What is special about widgets inside st.form?', 'Changing them does not rerun the app; all values are submitted together with the form submit button.'],
    ],
    quiz: [
      { q: 'Correct way to initialise a counter once?', o: ['st.session_state.count = 0 at the top', 'if "count" not in st.session_state: st.session_state.count = 0', 'count = 0', 'global count'], a: 1 },
      { q: 'Which is NOT allowed inside st.form?', o: ['st.text_input', 'st.form_submit_button', 'st.button', 'st.selectbox'], a: 2 },
      { q: 'You need to clear a text input after a button press. Best approach?', o: ['Set its key in session_state after the widget line', 'Set it inside the button\'s on_click callback', 'Use st.stop()', 'Reload the page'], a: 1 },
      { q: 'st.stop() does what?', o: ['Shuts down the server', 'Ends the current script run early', 'Clears session state', 'Pauses all users'], a: 1 },
    ],
  });

  /* ============================ 6 ============================ */
  CV.addChapter({
    n: 6, part: 3, minutes: 12,
    title: 'Charts and Visualisation',
    sub: 'Built-in charts, maps, and Altair, Plotly, Matplotlib or PyDeck when you need control.',
    md: `
## Built-in charts
::demo st-charts

\`st.line_chart\`, \`st.area_chart\`, \`st.bar_chart\` and \`st.scatter_chart\` take a DataFrame (wide or long). Choose columns with \`x=\`, \`y=\`, \`color=\`, \`size=\`. They are built on Vega-Lite and are interactive (zoom, tooltip).

${T}python
st.line_chart(df, x="date", y=["revenue", "cost"])
st.bar_chart(df, x="region", y="sales", color="product", horizontal=True)
st.map(df[["lat", "lon"]])                   # dots on a map
${T}

## Full control with libraries
| Library | Call | Notes |
|---|---|---|
| Altair / Vega-Lite | \`st.altair_chart(chart, use_container_width=True)\` | declarative, theme-aware |
| Plotly | \`st.plotly_chart(fig)\` | rich interactivity; supports selections with \`on_select="rerun"\` |
| Matplotlib / Seaborn | \`st.pyplot(fig)\` | static image; always pass the figure |
| PyDeck | \`st.pydeck_chart(deck)\` | 3D and large geospatial layers |
| Graphviz | \`st.graphviz_chart(dot)\` | diagrams |

> [!tip] Interactive selection: \`event = st.plotly_chart(fig, on_select="rerun")\` (and the same for Altair and \`st.dataframe\`) reruns the app with the selected points in \`event.selection\`, so a chart can act as a filter.

## A filtered dashboard pattern
${T}python
region = st.sidebar.multiselect("Region", df.region.unique(), default=df.region.unique())
view = df[df.region.isin(region)]
c1, c2, c3 = st.columns(3)
c1.metric("Orders", len(view))
c2.metric("Revenue", f"{view.revenue.sum():,.0f}")
c3.metric("Avg basket", f"{view.revenue.mean():.1f}")
st.line_chart(view, x="date", y="revenue")
${T}
`,
    checks: [
      ['Which call renders a Matplotlib figure?', 'st.pyplot(fig).'],
      ['How can a chart selection filter the rest of the app?', 'Use on_select="rerun" on st.plotly_chart / st.altair_chart / st.dataframe and read the returned selection.'],
    ],
    quiz: [
      { q: 'st.map expects columns named…', o: ['x and y', 'lat and lon (or latitude/longitude)', 'a and b', 'geo'], a: 1 },
      { q: 'Built-in st.line_chart is rendered with…', o: ['Matplotlib', 'Vega-Lite', 'D3 directly', 'Canvas images'], a: 1 },
    ],
  });

  /* ============================ 7 ============================ */
  CV.addChapter({
    n: 7, part: 3, minutes: 16,
    title: 'Caching',
    sub: 'st.cache_data for data, st.cache_resource for models and connections: how hashing, TTL and mutation work.',
    md: `
## Why cache?
Every rerun executes every line. Loading a 200 MB CSV or a neural network on each slider move makes an app unusable. Caching memoises a function: Streamlit hashes the function's code and arguments; if it has seen them before, it returns the stored result.

::demo st-cache

## Two decorators
| | \`@st.cache_data\` | \`@st.cache_resource\` |
|---|---|---|
| For | serialisable data: DataFrames, lists, API responses, query results | global resources: ML models, DB connections, clients |
| Returns | a **copy** each call (safe to mutate) | the **same object** shared by all sessions |
| Storage | pickled | in memory, not copied |
| Thread safety | not a concern | your object must be thread-safe |

${T}python
@st.cache_data(ttl="1h", max_entries=100, show_spinner="Loading data…")
def load(path: str) -> pd.DataFrame:
    return pd.read_csv(path)

@st.cache_resource
def get_model():
    return torch.load("model.pt", map_location="cpu")

df = load("sales.csv")
model = get_model()
${T}

## The rules of hashing
- The cache key includes **all arguments** and the function's source code. Changing the code invalidates the cache.
- Arguments must be hashable by Streamlit; prefix a parameter with an underscore (\`_conn\`) to exclude it from hashing.
- Global variables read inside the function are **not** part of the key, so pass them as arguments.
- \`ttl\` expires entries; \`max_entries\` bounds memory; \`load.clear()\` or \`st.cache_data.clear()\` empties it.

> [!warn] Never return a mutable object from \`cache_resource\` and then modify it per user. Every session shares it, so one user's change leaks to everyone.

## Session vs cache
\`st.session_state\` is **per user**; caches are **global** (shared by all users and sessions on the server). Put per-user data in session state, shared expensive work in caches.
`,
    checks: [
      ['When should you use st.cache_resource instead of st.cache_data?', 'For objects that should be created once and shared, such as ML models and database connections; cache_data is for serialisable data that is copied on each call.'],
      ['How do you exclude an argument from the cache key?', 'Prefix the parameter name with an underscore, e.g. _conn.'],
      ['What is the difference in scope between session_state and caches?', 'session_state is per user session; caches are global across all users.'],
    ],
    quiz: [
      { q: 'You load a 2 GB PyTorch model. Which decorator?', o: ['@st.cache_data', '@st.cache_resource', '@st.fragment', 'none'], a: 1 },
      { q: 'A cached function reads a global variable THRESHOLD. You change THRESHOLD. The cache…', o: ['Invalidates automatically', 'Returns stale results; pass it as an argument instead', 'Raises an error', 'Clears itself'], a: 1 },
      { q: 'cache_data returns…', o: ['The same object every time', 'A fresh copy of the cached value', 'A generator', 'None on a hit'], a: 1 },
      { q: 'What expires cached entries after 10 minutes?', o: ['max_entries=10', 'ttl=600', 'persist=True', 'show_spinner=False'], a: 1 },
    ],
  });

  /* ============================ 8 ============================ */
  CV.addChapter({
    n: 8, part: 3, minutes: 11,
    title: 'Fragments and Partial Reruns',
    sub: 'Rerun only part of a page, refresh on a timer, and keep big apps responsive.',
    md: `
## The problem
A dashboard with a heavy table and a small live chart reruns everything when the chart's slider moves.

## @st.fragment
A function decorated with \`@st.fragment\` becomes an independently rerunnable piece. When a widget **inside** it changes, only the fragment reruns.

::demo st-fragment

${T}python
@st.fragment(run_every="10s")
def live_prices():
    st.metric("BTC", fetch_price())

live_prices()
${T}

## Rules
- A fragment can read variables from the outer script, but writing elements outside its own container from inside is not allowed.
- Call \`st.rerun(scope="fragment")\` to rerun just the fragment, or \`st.rerun()\` for the whole app.
- Interacting with a widget **outside** the fragment still reruns everything (including the fragment).
- Dialogs (\`@st.dialog\`) are fragments.

> [!tip] Combine fragments with caching: cache the expensive data, use fragments for the interactive bits. Most "my app is slow" problems disappear.
`,
    checks: [
      ['What reruns when a widget inside an @st.fragment changes?', 'Only that fragment function.'],
      ['How do you refresh a fragment every 5 seconds?', '@st.fragment(run_every="5s").'],
    ],
    quiz: [
      { q: 'A widget outside any fragment changes. What reruns?', o: ['Nothing', 'Only fragments', 'The whole script', 'Only that widget'], a: 2 },
      { q: 'st.rerun(scope="fragment") reruns…', o: ['The whole app', 'The fragment it is called from', 'All fragments', 'Nothing'], a: 1 },
    ],
  });

  /* ============================ 9 ============================ */
  CV.addChapter({
    n: 9, part: 4, minutes: 13,
    title: 'Multipage Apps and Navigation',
    sub: 'Pages with st.navigation or the pages/ folder, links, query parameters and shared state.',
    md: `
## Two ways to add pages
::demo st-multipage

**st.navigation (recommended)**: the entry file is a router. You define \`st.Page\` objects (from files or functions), group them in sections, and decide dynamically which pages a user sees, for example after login.

${T}python
import streamlit as st

pages = {
    "Analytics": [st.Page("dashboard.py", title="Dashboard", icon="📊", default=True),
                  st.Page("reports.py", title="Reports")],
    "Account":   [st.Page("settings.py", title="Settings", icon="⚙️")],
}
if st.session_state.get("is_admin"):
    pages["Admin"] = [st.Page("admin.py", title="Admin")]

pg = st.navigation(pages, position="sidebar")
st.set_page_config(page_title="My app", layout="wide")
pg.run()
${T}

**pages/ folder**: files in \`pages/\` next to the entry script become pages automatically; numeric prefixes set the order.

## Moving between pages
- \`st.page_link("reports.py", label="Reports", icon="📄")\` renders a link.
- \`st.switch_page("reports.py")\` navigates programmatically.
- \`st.session_state\` is shared across pages in the same session, so use it to pass data.

## Query parameters
\`st.query_params\` is a dict-like view of the URL query string, great for shareable, bookmarkable state.

${T}python
city = st.query_params.get("city", "Pune")
choice = st.selectbox("City", ["Pune", "Delhi"], index=["Pune", "Delhi"].index(city))
st.query_params["city"] = choice      # URL becomes ?city=Delhi
${T}
`,
    checks: [
      ['How do you show an Admin page only to admins?', 'Build the page list dynamically and pass it to st.navigation only when the user is an admin.'],
      ['How do pages share data?', 'Through st.session_state, which is shared across pages within a session (and query params for shareable state).'],
    ],
    quiz: [
      { q: 'Which navigates to another page from code?', o: ['st.page_link', 'st.switch_page', 'st.rerun', 'st.query_params'], a: 1 },
      { q: 'With st.navigation, the entry script…', o: ['Is ignored', 'Acts as a router that runs the selected page', 'Must be in pages/', 'Cannot set config'], a: 1 },
    ],
  });

  /* ============================ 10 ============================ */
  CV.addChapter({
    n: 10, part: 4, minutes: 15,
    title: 'Chat Apps, Data Connections and Configuration',
    sub: 'Build an LLM chat UI, connect to databases with st.connection, manage secrets and theme your app.',
    md: `
## Chat elements
::demo st-chat

- \`st.chat_message("user" | "assistant")\` is a container with an avatar.
- \`st.chat_input()\` is pinned to the bottom and returns the submitted text once.
- \`st.write_stream(generator)\` renders tokens as they arrive and returns the full string.

${T}python
from openai import OpenAI          # any streaming LLM client works the same way
client = OpenAI(api_key=st.secrets["OPENAI_API_KEY"])

def stream(messages):
    for chunk in client.chat.completions.create(model="gpt-4o-mini", messages=messages, stream=True):
        yield chunk.choices[0].delta.content or ""
${T}

## Secrets
Put credentials in \`.streamlit/secrets.toml\` (never commit it) and read them via \`st.secrets\`:

${T}toml
# .streamlit/secrets.toml
OPENAI_API_KEY = "sk-..."

[connections.sales_db]
url = "postgresql://user:pass@host:5432/sales"
${T}

## Connections
\`st.connection\` creates a cached connection with built-in query caching:

${T}python
conn = st.connection("sales_db", type="sql")          # uses SQLAlchemy
df = conn.query("SELECT * FROM orders WHERE region = :r", params={"r": region}, ttl=600)
${T}

Other built-in types include Snowflake; community packages add Google Sheets, Supabase, and more.

## Configuration and theming
\`.streamlit/config.toml\` controls the server and theme:

${T}toml
[server]
maxUploadSize = 500
headless = true

[theme]
base = "dark"
primaryColor = "#ffffff"
font = "sans serif"
${T}

Run \`streamlit config show\` to see every option.
`,
    checks: [
      ['Where should API keys go in a Streamlit project?', 'In .streamlit/secrets.toml (git-ignored) or the host\'s secrets manager, read through st.secrets.'],
      ['What does st.write_stream return?', 'The full concatenated text after streaming finishes.'],
    ],
    quiz: [
      { q: 'Which file sets the app theme?', o: ['secrets.toml', 'config.toml', 'requirements.txt', 'app.py only'], a: 1 },
      { q: 'conn.query(..., ttl=600) means…', o: ['Timeout after 600 s', 'Cache the query result for 10 minutes', 'Retry 600 times', 'Limit 600 rows'], a: 1 },
    ],
  });

  /* ============================ 11 ============================ */
  CV.addChapter({
    n: 11, part: 4, minutes: 14,
    title: 'Testing, Structure and Deployment',
    sub: 'Test apps with AppTest, organise code for growth, and ship to Community Cloud or Docker.',
    md: `
## Testing with AppTest
\`streamlit.testing.v1.AppTest\` runs your script headlessly so pytest can interact with widgets.

${T}python
from streamlit.testing.v1 import AppTest

def test_tip():
    at = AppTest.from_file("app.py").run()
    at.number_input[0].set_value(100).run()
    at.slider[0].set_value(10).run()
    assert at.metric[0].value == "$10.00"
    assert not at.exception
${T}

## Project structure that scales
${T}text
my_app/
├── app.py                 # router: st.navigation, page config
├── pages/                 # one file per page (UI only)
├── core/                  # pure Python logic, easy to unit-test
│   ├── data.py            # cached loaders
│   └── models.py
├── tests/
├── .streamlit/config.toml
├── .streamlit/secrets.toml  # git-ignored
└── requirements.txt
${T}

Keep business logic out of the UI files: pages call functions from \`core/\`.

## Deploying
**Streamlit Community Cloud (free)**: push to a public or private GitHub repo with \`requirements.txt\`, sign in at share.streamlit.io, pick the repo and entry file, paste secrets into the app settings.

**Docker / any host**:
${T}dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8501
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
${T}

Behind a reverse proxy (nginx), enable WebSocket upgrades, because Streamlit needs a persistent WebSocket.

::demo checklist {"id":"st-deploy","label":"Ready to ship","meta":{"title":"Pre-deployment checklist","desc":"Tick these off before you share your app."},"items":[["requirements.txt pins versions","streamlit, pandas, … with == or ~= so builds are reproducible"],["Secrets out of the repo","use st.secrets; add .streamlit/secrets.toml to .gitignore"],["Expensive work cached","data with cache_data, models with cache_resource"],["No per-user data in caches","user data lives in st.session_state"],["Inputs validated","file types, sizes and required fields checked; st.stop() early"],["Errors handled","try/except around network and file I/O with st.error messages"],["Page config set","title, icon, layout=wide where useful"],["Tested","AppTest covers the main flows; no exceptions"],["Resource limits considered","Community Cloud has limited RAM; downsample big data"]]}

## Performance and security tips
- Cache, use fragments, and avoid re-reading files in loops.
- Downsample before charting very large data.
- Treat all user input as untrusted: never \`eval\` it or build SQL with string formatting; use parameters.
- Add authentication for private apps (Community Cloud viewer allow-lists, \`st.login\` with an OIDC provider in recent versions, or a reverse proxy).
`,
    checks: [
      ['How do you test a Streamlit app with pytest?', 'Use AppTest.from_file(...).run(), interact with widgets (set_value(...).run()) and assert on elements and exceptions.'],
      ['What does a reverse proxy need for Streamlit to work?', 'WebSocket support (upgrade headers), because the app communicates over a persistent WebSocket.'],
    ],
    quiz: [
      { q: 'Which file must exist for Community Cloud to install dependencies?', o: ['setup.py', 'requirements.txt (or pyproject/environment file)', 'Dockerfile', 'config.toml'], a: 1 },
      { q: 'Best place for business logic?', o: ['Inside each page file', 'In plain Python modules imported by pages', 'In config.toml', 'In secrets.toml'], a: 1 },
      { q: 'Default Streamlit port?', o: ['5000', '8000', '8501', '3000'], a: 2 },
    ],
  });

  /* ============================ Reference ============================ */
  CV.REF['st-api'] = {
    head: ['Call', 'What it does'], mono: [0],
    rows: [
      ['st.write(x) / magic', 'render anything: text, DataFrame, dict, figure'], ['st.title / header / subheader', 'headings'], ['st.markdown(md)', 'Markdown with colours and emoji'],
      ['st.dataframe(df) / st.data_editor(df)', 'interactive grid / editable grid that returns data'], ['st.metric(label, value, delta)', 'KPI tile'],
      ['st.button / st.download_button', 'True on click rerun / download data'], ['st.slider / st.number_input / st.text_input', 'numeric and text input'],
      ['st.selectbox / st.multiselect / st.radio', 'choose one or many'], ['st.file_uploader(type=[...])', 'upload; returns UploadedFile or None'],
      ['st.sidebar / st.columns / st.tabs', 'layout'], ['st.expander / st.container / st.popover / st.empty', 'containers and placeholders'],
      ['st.session_state', 'per-session state across reruns'], ['on_click= / on_change=', 'callbacks run before the rerun'],
      ['st.form / st.form_submit_button', 'batch inputs into one rerun'], ['st.rerun() / st.stop()', 'rerun now / end the run early'],
      ['@st.cache_data(ttl=)', 'cache serialisable data (copied)'], ['@st.cache_resource', 'cache shared resources (models, connections)'],
      ['@st.fragment(run_every=)', 'partial rerun, optional timer'], ['@st.dialog(title)', 'modal dialog'],
      ['st.navigation / st.Page / st.switch_page / st.page_link', 'multipage apps'], ['st.query_params', 'read/write URL query string'],
      ['st.chat_message / st.chat_input / st.write_stream', 'chat UIs and streaming'], ['st.secrets / st.connection', 'credentials and data connections'],
      ['st.line_chart / bar_chart / area_chart / scatter_chart / map', 'built-in charts'], ['st.plotly_chart / altair_chart / pyplot', 'library charts'],
      ['st.set_page_config(...)', 'title, icon, layout'], ['AppTest.from_file(...)', 'headless testing'],
    ],
  };
  CV.GLOSSARIES.streamlit = [
    ['Rerun', 'executing the whole script again from top to bottom after an interaction'], ['Session', 'one browser tab connected to the app over a WebSocket, with its own state'],
    ['Session state', 'dictionary that persists values across reruns for one session'], ['Widget key', 'unique identifier for a widget; also its session_state key'],
    ['Callback', 'function passed to on_click/on_change that runs before the next rerun'], ['Form', 'container that batches widget changes until submit'],
    ['Magic', 'automatic st.write of bare expressions'], ['Placeholder', 'st.empty() slot that can be overwritten'],
    ['cache_data', 'memoises data-returning functions; returns copies'], ['cache_resource', 'memoises shared resources; returns the same object'],
    ['TTL', 'time-to-live after which a cache entry expires'], ['Fragment', 'function that can rerun independently of the full script'],
    ['Dialog', 'modal created with @st.dialog'], ['st.navigation', 'router that defines pages and runs the selected one'],
    ['Query params', 'URL key/value pairs exposed as st.query_params'], ['Secrets', 'credentials stored in secrets.toml and read via st.secrets'],
    ['AppTest', 'testing API that runs apps headlessly'], ['Community Cloud', 'free hosting for Streamlit apps from GitHub'],
  ];
  CV.DECKS.streamlit = [
    ['Core model', [
      ['Explain the Streamlit execution model.', 'The script runs top to bottom; any widget interaction reruns the whole script with updated widget values, and the front end is diffed and updated.'],
      ['How do you keep a value between reruns?', 'Store it in st.session_state (initialise once with an if-not-in check).'],
      ['Why is my app slow and how do you fix it?', 'Expensive work reruns on every interaction; cache it (cache_data/cache_resource), use forms to batch input and fragments for partial reruns.'],
      ['cache_data vs cache_resource?', 'cache_data for serialisable data, returns copies; cache_resource for shared objects like models and connections, returns the same instance.'],
    ]],
    ['Building apps', [
      ['How do callbacks differ from checking a button\'s return value?', 'Callbacks run before the rerun, so state changes are visible on that run; checking the return value happens during the run.'],
      ['How do you build a multipage app with role-based pages?', 'Use st.navigation with a dynamically built list of st.Page objects.'],
      ['How do you make app state shareable via URL?', 'Read and write st.query_params.'],
      ['How do you test a Streamlit app?', 'AppTest from streamlit.testing.v1 with pytest: run, set widget values, assert outputs.'],
      ['How do you deploy?', 'Push to GitHub with requirements.txt and deploy on Community Cloud, or containerise with Docker behind a WebSocket-capable proxy.'],
    ]],
  ];

  CV.addExtra({ slug: 'cheatsheet', part: 5, icon: 'Σ', title: 'Cheat Sheet', sub: 'Every important Streamlit call on one searchable page.',
    sections: [{ id: 'api', title: 'API cheat sheet', html: CV.h.w('ref-table', { key: 'st-api', meta: { title: 'Streamlit API', desc: 'Type to filter, e.g. "cache", "layout", "page".' } }) }] });
  CV.addExtra({ slug: 'glossary', part: 5, icon: 'Aa', title: 'Glossary', sub: 'Streamlit vocabulary, searchable.',
    sections: [{ id: 'terms', title: 'Terms', html: CV.h.w('glossary', { key: 'streamlit' }) }] });
  CV.addExtra({ slug: 'interview', part: 5, icon: '?', title: 'Interview Questions', sub: 'Flashcards on the core model and building real apps.',
    sections: [{ id: 'cards', title: 'Flashcards', html: CV.h.w('flashcards', { deck: 'streamlit' }) }] });
})();
