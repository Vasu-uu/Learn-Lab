/* Flask course lessons (Markdown) */
(function () {
  const T = '```';
  const demo = (name, opts) => '::demo ' + name + (opts ? ' ' + JSON.stringify(opts) : '');

  /* ============================ 1 ============================ */
  CV.addChapter({
    n: 1, part: 1, minutes: 15,
    title: 'How the Web Works, and Where Flask Fits',
    sub: 'HTTP requests and responses, methods, status codes, headers, WSGI, and what a micro-framework gives you.',
    md: `
## HTTP in one picture
A browser (the ==client==) sends an HTTP **request**: a method, a path, headers and an optional body. A server replies with a **response**: a status code, headers and a body (HTML, JSON, an image…). HTTP is **stateless**: each request stands alone, so anything that must persist (a login) travels in cookies or tokens.

${demo('fl-lifecycle')}

## Methods
| Method | Meaning | Safe | Idempotent |
|---|---|---|---|
| GET | read a resource | yes | yes |
| POST | create / submit data | no | no |
| PUT | replace a resource | no | yes |
| PATCH | partially update | no | not necessarily |
| DELETE | remove | no | yes |
| HEAD / OPTIONS | headers only / allowed methods | yes | yes |

==Safe== means no server-side change; ==idempotent== means repeating the request has the same effect as doing it once.

## Status codes
${demo('picker', { meta: { title: 'Status code explorer', desc: 'Click a code to see what it means and when Flask produces it.' }, items: [['200 OK', 'Default for a returned value. return "hi" → 200.'], ['201 Created', 'After creating a resource: return obj, 201 (often with a Location header).'], ['204 No Content', 'Success with no body, e.g. after DELETE: return "", 204.'], ['301 / 308 Permanent redirect', 'Flask sends 308 when a route ends with "/" and you request it without the slash.'], ['302 / 303 Redirect', 'redirect(url_for("x")) sends 302 by default; 303 is "see other" after POST.'], ['400 Bad Request', 'Malformed input; request.get_json() on invalid JSON raises it; abort(400).'], ['401 Unauthorized', 'Not authenticated (missing or bad credentials).'], ['403 Forbidden', 'Authenticated but not allowed: abort(403).'], ['404 Not Found', 'No route matches, or get_or_404 found nothing.'], ['405 Method Not Allowed', 'The path exists but not for this method; Flask adds an Allow header.'], ['409 / 422', 'Conflict (duplicate) / validation failed for well-formed data.'], ['500 Internal Server Error', 'An unhandled exception in your code (in production; debug mode shows a traceback).']] })}

## WSGI: the contract under Flask
==WSGI== (PEP 3333) is the standard interface between Python web servers and frameworks: the server calls \`app(environ, start_response)\` for every request. Flask builds on **Werkzeug** (routing, request/response objects, the dev server) and **Jinja2** (templates). Any WSGI server (Gunicorn, uWSGI, Waitress) can run any WSGI app.

## Flask vs the alternatives
| | Flask | Django | FastAPI |
|---|---|---|---|
| Style | micro-framework: small core + extensions | batteries included (ORM, admin, auth) | async-first API framework |
| Interface | WSGI (async views supported) | WSGI/ASGI | ASGI |
| Best for | small-to-large apps where you choose components; APIs; learning | content sites, admin-heavy apps | high-performance typed JSON APIs |

> [!key] Flask decides very little for you. It gives routing, request/response handling, templates and sessions; everything else (database, forms, auth) is a library you pick. That flexibility is the point, and also the responsibility.
`,
    checks: [
      ['What does "stateless" mean for HTTP?', 'Each request is independent; the server keeps no memory between requests, so state travels in cookies, tokens or the database.'],
      ['Which HTTP methods are idempotent?', 'GET, PUT, DELETE, HEAD, OPTIONS (POST is not; PATCH not necessarily).'],
      ['What is WSGI?', 'The Python standard interface between web servers and applications: the server calls app(environ, start_response) per request.'],
    ],
    quiz: [
      { q: 'A path exists but you sent the wrong method. Flask returns…', o: ['400', '404', '405', '500'], a: 2 },
      { q: 'Which libraries does Flask build on?', o: ['Django and Celery', 'Werkzeug and Jinja2', 'Starlette and Pydantic', 'Tornado'], a: 1 },
      { q: 'Repeating a request has the same effect as sending it once. That property is…', o: ['Safe', 'Idempotent', 'Stateless', 'Cacheable'], a: 1 },
    ],
  });

  /* ============================ 2 ============================ */
  CV.addChapter({
    n: 2, part: 1, minutes: 15,
    title: 'Your First App and Routing',
    sub: 'The Flask object, the dev server, routes and methods, variable rules and converters, url_for and trailing slashes.',
    md: `
## Hello, Flask
${T}python
# app.py
from flask import Flask

app = Flask(__name__)

@app.route("/")
def index():
    return "<h1>Hello, Flask!</h1>"
${T}

${T}bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install flask
flask --app app run --debug          # http://127.0.0.1:5000, auto-reload + debugger
${T}

\`__name__\` tells Flask where to find templates and static files. \`--debug\` enables the reloader and the interactive debugger (never in production: it allows code execution).

## Routes and methods
${T}python
@app.route("/login", methods=["GET", "POST"])
def login(): ...

@app.get("/items")          # shortcut for methods=["GET"]
def list_items(): ...

@app.post("/items")
def create_item(): ...
${T}

## Variable rules and converters
${T}python
@app.get("/users/<int:user_id>")
def show_user(user_id):            # user_id is already an int
    return f"User {user_id}"

@app.get("/files/<path:filename>")  # path accepts slashes
def download(filename): ...
${T}

| Converter | Matches |
|---|---|
| \`string\` (default) | any text without a slash |
| \`int\` | positive integers |
| \`float\` | positive floats like 9.99 |
| \`path\` | like string but accepts slashes |
| \`uuid\` | UUID strings |

${demo('fl-router')}

## Trailing slashes
A rule ending in \`/\` (\`/projects/\`) behaves like a folder: requesting \`/projects\` redirects to \`/projects/\`. A rule without the slash (\`/about\`) returns 404 for \`/about/\`. Pick one style and stay consistent.

## Build URLs with url_for
Never hard-code paths. \`url_for(endpoint, **values)\` builds them from the view name, escapes values, and keeps working when routes change.

${T}python
from flask import url_for
url_for("show_user", user_id=7)          # '/users/7'
url_for("list_items", page=2)            # '/items?page=2'  (unknown args → query string)
url_for("static", filename="style.css")  # '/static/style.css'
${T}
`,
    checks: [
      ['What does <int:user_id> do?', 'Matches only digits and passes the value to the view as an int named user_id.'],
      ['Why use url_for instead of writing paths?', 'It builds URLs from endpoint names, escapes values, adds query strings, and keeps links correct if routes change.'],
      ['What happens when you request /projects for a rule defined as /projects/?', 'Flask redirects (308) to /projects/.'],
    ],
    quiz: [
      { q: 'Command to run the dev server with reload and debugger?', o: ['python app.py --prod', 'flask --app app run --debug', 'gunicorn app', 'flask serve'], a: 1 },
      { q: '/users/abc against /users/<int:id> gives…', o: ['id="abc"', 'A 404', 'A 500', 'id=0'], a: 1 },
      { q: 'url_for("search", q="cats") for a route /search returns…', o: ['/search/cats', '/search?q=cats', '/search#cats', 'an error'], a: 1 },
      { q: 'Why must --debug never be used in production?', o: ['It is slow', 'The interactive debugger allows arbitrary code execution', 'It disables templates', 'It logs too much'], a: 1 },
    ],
  });

  /* ============================ 3 ============================ */
  CV.addChapter({
    n: 3, part: 1, minutes: 16,
    title: 'Requests and Responses',
    sub: 'The request object, returning strings, dicts and tuples, Response objects, redirects, abort and error handlers.',
    md: `
## Reading the request
\`from flask import request\` gives a ==context-local== object for the current request.

${demo('fl-request')}

| Attribute | Contains |
|---|---|
| \`request.method\`, \`request.path\`, \`request.url\` | basics |
| \`request.args\` | query string (\`?q=x\`) as a MultiDict; \`request.args.get("page", 1, type=int)\` |
| \`request.form\` | form fields from POST bodies |
| \`request.get_json()\` / \`request.json\` | parsed JSON body |
| \`request.files\` | uploaded files (\`FileStorage\`, use \`.save()\`) |
| \`request.headers\`, \`request.cookies\` | headers and cookies |

> [!warn] \`request.form["x"]\` raises a 400 Bad Request if the key is missing. Use \`request.form.get("x")\` when the field is optional.

## What a view can return
${T}python
return "plain text or HTML"                       # 200, text/html
return {"id": 1, "ok": True}                      # dict/list → JSON (jsonify)
return {"error": "not found"}, 404                # (body, status)
return "created", 201, {"Location": "/items/9"}  # (body, status, headers)
return render_template("page.html", user=user)    # HTML from a template
return redirect(url_for("index"))                 # 302 redirect
return send_file("report.pdf", as_attachment=True)
${T}

For full control build a response: \`resp = make_response(render_template(...)); resp.set_cookie("theme", "dark"); return resp\`.

## Stopping early and handling errors
${T}python
from flask import abort

@app.get("/admin")
def admin():
    if not current_user_is_admin():
        abort(403)                      # raises an HTTPException
    return "secret"

@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404

@app.errorhandler(Exception)            # last-resort handler (log it!)
def unhandled(e):
    app.logger.exception(e)
    return {"error": "internal error"}, 500
${T}

## File uploads safely
${T}python
from werkzeug.utils import secure_filename
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024     # reject bodies > 16 MB (413)

@app.post("/upload")
def upload():
    f = request.files.get("photo")
    if not f or not f.filename.lower().endswith((".png", ".jpg")):
        abort(400)
    f.save(UPLOAD_DIR / secure_filename(f.filename))
    return redirect(url_for("gallery"))
${T}
`,
    checks: [
      ['How do you read ?page=2 as an integer with a default?', 'request.args.get("page", 1, type=int).'],
      ['What does returning a dict from a view do?', 'Flask serialises it to JSON with Content-Type application/json and status 200.'],
      ['What does abort(403) do?', 'Raises an HTTPException that stops the view and produces a 403 response (customisable with an errorhandler).'],
    ],
    quiz: [
      { q: 'return {"error": "x"}, 422 sends…', o: ['200 with JSON', '422 with JSON body', 'A redirect', 'An exception'], a: 1 },
      { q: 'request.form["email"] with no email field…', o: ['Returns None', 'Returns ""', 'Raises 400 Bad Request', 'Returns []'], a: 2 },
      { q: 'Why call secure_filename on uploads?', o: ['To compress them', 'To strip path tricks like ../../etc/passwd from the name', 'To scan for viruses', 'To rename to UUIDs'], a: 1 },
    ],
  });

  /* ============================ 4 ============================ */
  CV.addChapter({
    n: 4, part: 2, minutes: 18,
    title: 'Templates with Jinja2',
    sub: 'render_template, expressions and filters, loops and conditions, inheritance, macros, and autoescaping.',
    md: `
## Rendering templates
Templates live in \`templates/\`. \`render_template("page.html", **context)\` fills them with your data. Inside templates you also get \`request\`, \`session\`, \`g\`, \`url_for\` and \`get_flashed_messages\`.

${demo('fl-jinja')}

## Syntax
| Syntax | Meaning |
|---|---|
| \`{{ expr }}\` | print a value (autoescaped) |
| \`{% for x in items %}…{% else %}…{% endfor %}\` | loop with an empty fallback; \`loop.index\`, \`loop.first\`, \`loop.last\` |
| \`{% if a %}…{% elif b %}…{% else %}…{% endif %}\` | conditions |
| \`{% set x = … %}\` | assign |
| \`{{ name\\|title }}\` | filters: \`upper\`, \`default\`, \`length\`, \`join\`, \`round\`, \`truncate\`, \`safe\`… |
| \`{# comment #}\` | not rendered |

## Template inheritance
A base layout defines ==blocks==; pages extend it and fill them in.

${T}html
<!-- templates/base.html -->
<!doctype html>
<html>
<head>
  <title>{% block title %}My site{% endblock %}</title>
  <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
</head>
<body>
  <nav><a href="{{ url_for('index') }}">Home</a></nav>
  {% for msg in get_flashed_messages() %}<p class="flash">{{ msg }}</p>{% endfor %}
  {% block content %}{% endblock %}
</body>
</html>
${T}

${T}html
<!-- templates/user.html -->
{% extends "base.html" %}
{% block title %}{{ user.name }}{% endblock %}
{% block content %}
  <h1>{{ user.name }}</h1>
  {% include "_badges.html" %}
{% endblock %}
${T}

## Macros: reusable snippets
${T}html
{% macro field(name, label, type="text") %}
  <label>{{ label }} <input name="{{ name }}" type="{{ type }}"></label>
{% endmacro %}
{{ field("email", "Email", "email") }}
${T}

## Autoescaping and XSS
Flask autoescapes \`.html\` templates: \`<\` becomes \`&lt;\`, so user content cannot inject scripts (==cross-site scripting==). Only mark content \`|safe\` (or use \`Markup\`) when **you** produced it and know it is clean. Try the "Autoescaping" preset above.

> [!tip] Keep logic out of templates. Compute in the view, pass ready-to-display values, and use filters only for formatting.
`,
    checks: [
      ['What does {% extends "base.html" %} plus {% block content %} achieve?', 'Template inheritance: the page reuses the base layout and fills in only its named blocks.'],
      ['Why is |safe dangerous on user input?', 'It disables autoescaping, so injected HTML/JavaScript would run in other users\' browsers (XSS).'],
      ['Which loop variable tells you the 1-based position?', 'loop.index (loop.index0 is 0-based).'],
    ],
    quiz: [
      { q: 'Where does render_template look for files by default?', o: ['static/', 'templates/', 'views/', 'the project root'], a: 1 },
      { q: '{{ name|default("Guest") }} prints Guest when…', o: ['name is "Guest"', 'name is undefined', 'always', 'name is empty list'], a: 1 },
      { q: 'A comment "<b>hi</b>" printed with {{ comment }} in an .html template appears as…', o: ['bold hi', 'the literal text <b>hi</b>', 'nothing', 'an error'], a: 1 },
    ],
  });

  /* ============================ 5 ============================ */
  CV.addChapter({
    n: 5, part: 2, minutes: 15,
    title: 'Static Files, Forms and Validation',
    sub: 'Serving CSS/JS, HTML forms, the POST/Redirect/GET pattern, flash messages, Flask-WTF and CSRF protection.',
    md: `
## Static files
Files in \`static/\` are served at \`/static/...\`. Link them with \`url_for("static", filename="css/app.css")\`. In production, let nginx or a CDN serve them.

## A form, the plain way
${T}python
@app.route("/contact", methods=["GET", "POST"])
def contact():
    errors = {}
    if request.method == "POST":
        email = request.form.get("email", "").strip()
        if "@" not in email:
            errors["email"] = "Enter a valid email"
        if not errors:
            save_message(email, request.form.get("message", ""))
            flash("Thanks! We will reply soon.")
            return redirect(url_for("contact"))      # PRG
    return render_template("contact.html", errors=errors)
${T}

## POST / Redirect / GET
After a successful POST, **redirect** instead of rendering. Otherwise the browser's refresh re-sends the POST (duplicate orders, double payments).

${demo('fl-prg')}

## Flash messages
\`flash("text", "category")\` stores a one-time message in the session; the next page reads it with \`get_flashed_messages(with_categories=True)\` (see the base template in lesson 4).

## Flask-WTF: forms with validation and CSRF
${T}python
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField
from wtforms.validators import DataRequired, Email, Length

class ContactForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    message = TextAreaField("Message", validators=[Length(min=10, max=2000)])
    submit = SubmitField("Send")

@app.route("/contact", methods=["GET", "POST"])
def contact():
    form = ContactForm()
    if form.validate_on_submit():          # POST + valid + CSRF token ok
        save_message(form.email.data, form.message.data)
        flash("Sent!")
        return redirect(url_for("contact"))
    return render_template("contact.html", form=form)
${T}

${T}html
<form method="post">
  {{ form.hidden_tag() }}                 {# includes the CSRF token #}
  {{ form.email.label }} {{ form.email() }}
  {% for e in form.email.errors %}<span class="err">{{ e }}</span>{% endfor %}
  {{ form.message() }} {{ form.submit() }}
</form>
${T}

> [!warn] ==CSRF== (cross-site request forgery): another site makes your logged-in browser submit a form to your app. A secret per-session token in every form, checked on submit, blocks it. Flask-WTF does this; for plain forms use \`flask_wtf.csrf.CSRFProtect(app)\`.
`,
    checks: [
      ['Why redirect after a successful POST?', 'So refreshing the page repeats a harmless GET instead of re-submitting the POST (POST/Redirect/GET).'],
      ['What does form.validate_on_submit() check?', 'That the request is a submission (POST), all validators pass, and the CSRF token is valid.'],
      ['What attack does a CSRF token prevent?', 'A malicious site making the user\'s browser submit authenticated requests to your app.'],
    ],
    quiz: [
      { q: 'Where do flash messages live between requests?', o: ['In the URL', 'In the session', 'In the database', 'In a global variable'], a: 1 },
      { q: 'Which renders the hidden CSRF field in a Flask-WTF form?', o: ['form.csrf()', 'form.hidden_tag()', 'csrf_token', 'form.secure()'], a: 1 },
      { q: 'Static files are served from…', o: ['/assets', '/static', '/public', '/files'], a: 1 },
    ],
  });

  /* ============================ 6 ============================ */
  CV.addChapter({
    n: 6, part: 2, minutes: 18,
    title: 'Sessions, Cookies and Authentication',
    sub: 'Signed cookie sessions, SECRET_KEY, password hashing, login with Flask-Login, and protecting routes.',
    md: `
## Cookies and the session
A ==cookie== is a small value the browser sends back on every request to your site. Flask's \`session\` stores a dict **inside a signed cookie**: users can read it, but any change breaks the signature and Flask discards it.

${demo('fl-cookie')}

${T}python
app.config["SECRET_KEY"] = os.environ["SECRET_KEY"]   # long, random, secret
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SECURE=True, SESSION_COOKIE_SAMESITE="Lax")

session["user_id"] = user.id          # log in
session.pop("user_id", None)          # log out
session.permanent = True              # lasts PERMANENT_SESSION_LIFETIME (default 31 days)
${T}

> [!warn] Never put secrets in the session: it is signed, not encrypted. Generate the key with \`python -c "import secrets; print(secrets.token_hex(32))"\` and keep it out of git. For large or private server-side sessions use Flask-Session (Redis, database).

## Storing passwords
${demo('fl-hash')}

${T}python
from werkzeug.security import generate_password_hash, check_password_hash

user.password_hash = generate_password_hash(password)   # Werkzeug 3 defaults to scrypt
check_password_hash(user.password_hash, attempt)        # True / False
${T}

## Login with Flask-Login
${T}python
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user

login_manager = LoginManager(app)
login_manager.login_view = "login"           # where @login_required sends anonymous users

class User(UserMixin, db.Model): ...         # provides is_authenticated, get_id(), …

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

@app.post("/login")
def login():
    user = db.session.scalar(db.select(User).filter_by(email=request.form["email"]))
    if user and check_password_hash(user.password_hash, request.form["password"]):
        login_user(user, remember=True)
        return redirect(request.args.get("next") or url_for("dashboard"))
    flash("Invalid credentials")
    return redirect(url_for("login"))

@app.get("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html", user=current_user)
${T}

## Writing your own decorator
${T}python
from functools import wraps

def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            abort(403)
        return view(*args, **kwargs)
    return wrapped
${T}

> [!tip] Validate the \`next\` parameter (only allow relative URLs on your own site) to avoid open-redirect attacks.
`,
    checks: [
      ['Can a user read their Flask session cookie? Can they change it?', 'They can read it (it is only base64-encoded) but cannot change it without the SECRET_KEY; a tampered cookie fails signature checks and is ignored.'],
      ['Why is a salt used in password hashes?', 'So identical passwords produce different hashes, defeating precomputed (rainbow) tables and hiding duplicates.'],
      ['What does @login_required do for an anonymous user?', 'Redirects them to login_manager.login_view (with a next parameter) instead of running the view.'],
    ],
    quiz: [
      { q: 'What must never go in the default Flask session?', o: ['user_id', 'A theme preference', 'A credit-card number or API secret', 'A cart item count'], a: 2 },
      { q: 'Which flag stops JavaScript from reading the session cookie?', o: ['Secure', 'HttpOnly', 'SameSite', 'Max-Age'], a: 1 },
      { q: 'Correct way to verify a password?', o: ['hash(attempt) == stored', 'check_password_hash(stored, attempt)', 'stored == attempt', 'decrypt(stored) == attempt'], a: 1 },
      { q: 'Why use functools.wraps in a decorator?', o: ['Speed', 'Keep the original function name so Flask endpoints stay unique', 'Security', 'Required by Python'], a: 1 },
    ],
  });

  /* ============================ 7 ============================ */
  CV.addChapter({
    n: 7, part: 3, minutes: 20,
    title: 'Databases with SQLAlchemy',
    sub: 'Flask-SQLAlchemy models, the 2.0 query style, relationships, the N+1 problem, transactions and migrations.',
    md: `
## Setup and a model
${T}python
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey

class Base(DeclarativeBase): pass
db = SQLAlchemy(model_class=Base)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"   # or postgresql://…
db.init_app(app)

class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(120), unique=True)
    posts: Mapped[list["Post"]] = relationship(back_populates="author")

class Post(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    author: Mapped["User"] = relationship(back_populates="posts")

with app.app_context():
    db.create_all()            # quick start; use migrations in real projects
${T}

## CRUD
${T}python
# create
u = User(name="Asha", email="asha@ex.com")
db.session.add(u); db.session.commit()

# read
user = db.get_or_404(User, 7)
users = db.session.execute(db.select(User).where(User.age > 30).order_by(User.name)).scalars().all()
page = db.paginate(db.select(Post).order_by(Post.id.desc()), page=2, per_page=20)

# update
user.name = "Asha R"; db.session.commit()

# delete
db.session.delete(user); db.session.commit()
${T}

${demo('fl-orm')}

## The N+1 query problem
Looping over users and touching \`user.posts\` lazily issues **one query per user**. Switch to eager loading with \`.options(selectinload(User.posts))\` (or \`joinedload\` for many-to-one) to load everything in one or two queries. Toggle it in the demo above.

## Transactions
The session is a ==unit of work==: changes are pending until \`commit()\`. If something fails, \`db.session.rollback()\`. Flask-SQLAlchemy removes the session at the end of each request.

> [!warn] Never build SQL with f-strings from user input (SQL injection). The ORM and \`text("… WHERE id = :id")\` with bound parameters escape values for you.

## Migrations
Schema changes over time are handled by Alembic through **Flask-Migrate**:
${T}bash
flask db init                      # once
flask db migrate -m "add age to user"
flask db upgrade                   # apply; flask db downgrade to revert
${T}
`,
    checks: [
      ['What is the N+1 problem?', 'Loading N parents then lazily loading each one\'s children costs 1 + N queries; fix with selectinload/joinedload.'],
      ['When are changes written to the database?', 'When db.session.commit() is called; until then they are pending in the session.'],
      ['Why use Flask-Migrate instead of db.create_all() later in a project?', 'create_all only creates missing tables; migrations alter existing schemas (add columns, etc.) in versioned, reversible steps.'],
    ],
    quiz: [
      { q: 'Fetch a row by primary key or return 404?', o: ['User.find(7)', 'db.get_or_404(User, 7)', 'db.select(7)', 'User[7]'], a: 1 },
      { q: 'Which avoids N+1 for a one-to-many collection?', o: ['lazy loading', 'selectinload', 'db.create_all', 'commit()'], a: 1 },
      { q: 'An exception happens after several db.session.add calls. You should…', o: ['commit anyway', 'db.session.rollback()', 'restart the server', 'nothing'], a: 1 },
    ],
  });

  /* ============================ 8 ============================ */
  CV.addChapter({
    n: 8, part: 3, minutes: 17,
    title: 'Structuring Larger Apps',
    sub: 'Application factories, blueprints, configuration, extensions, and the application and request contexts.',
    md: `
## The application factory
Instead of a global \`app\`, a function builds and returns it. This enables multiple configurations (testing, production) and avoids circular imports.

${T}python
# myapp/__init__.py
from flask import Flask
from .extensions import db, migrate, login_manager

def create_app(config="myapp.config.Production"):
    app = Flask(__name__)
    app.config.from_object(config)
    app.config.from_prefixed_env()             # FLASK_SECRET_KEY → SECRET_KEY

    db.init_app(app); migrate.init_app(app, db); login_manager.init_app(app)

    from .auth import bp as auth_bp
    from .api import bp as api_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp, url_prefix="/api")
    return app
${T}

${T}text
myapp/
├── __init__.py        # create_app
├── extensions.py      # db = SQLAlchemy(), login_manager = LoginManager() (not bound yet)
├── config.py          # class Config / Development / Testing / Production
├── models.py
├── auth/              # blueprint: routes.py, forms.py, templates/auth/
├── api/               # blueprint for JSON endpoints
├── templates/  static/
tests/
${T}

Run it with \`flask --app "myapp:create_app()" run --debug\`.

## Blueprints
A ==blueprint== is a group of routes, templates and static files registered on an app, optionally under a URL prefix.

${T}python
# myapp/auth/__init__.py
from flask import Blueprint
bp = Blueprint("auth", __name__, template_folder="templates")

@bp.route("/login", methods=["GET", "POST"])
def login(): ...

# elsewhere: url_for("auth.login")  ← endpoint = "blueprint.view"
${T}

## Contexts: why request works without being passed
Flask uses context locals so code can use \`request\`, \`session\`, \`current_app\` and \`g\` without passing them around. They only work while a context is active.

${demo('fl-context')}

- **Application context**: \`current_app\`, \`g\` (per-request scratch space, e.g. a DB connection). Push it manually in scripts with \`with app.app_context():\`.
- **Request context**: \`request\`, \`session\`. Pushed for every request; in tests use \`app.test_request_context()\`.

## Configuration
${T}python
class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///dev.db")

class Testing(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False
${T}
`,
    checks: [
      ['Why use an application factory?', 'To create apps with different configs (tests, production), initialise extensions cleanly with init_app, and avoid circular imports.'],
      ['What is the endpoint name of a view called login in blueprint "auth"?', '"auth.login", so url_for("auth.login").'],
      ['What error do you get using current_app in a plain script, and the fix?', '"Working outside of application context"; wrap the code in with app.app_context():.'],
    ],
    quiz: [
      { q: 'Extensions in a factory app are typically connected with…', o: ['ext = Ext(app) at import time', 'ext.init_app(app) inside create_app', 'global app', 'app.extend(ext)'], a: 1 },
      { q: 'g is best used for…', o: ['Storing data across requests', 'Per-request scratch data like the current DB connection', 'Configuration', 'Static files'], a: 1 },
      { q: 'register_blueprint(bp, url_prefix="/api") makes bp\'s "/items" route available at…', o: ['/items', '/api/items', '/bp/items', '/items/api'], a: 1 },
    ],
  });

  /* ============================ 9 ============================ */
  CV.addChapter({
    n: 9, part: 3, minutes: 18,
    title: 'Building REST APIs',
    sub: 'Resource design, status codes, validation, pagination, errors as JSON, CORS and token authentication.',
    md: `
## Design resources, not actions
| Request | Meaning | Success |
|---|---|---|
| \`GET /api/todos\` | list (filter with \`?done=true&page=2\`) | 200 |
| \`POST /api/todos\` | create | 201 + Location |
| \`GET /api/todos/7\` | read one | 200 |
| \`PATCH /api/todos/7\` | partial update | 200 |
| \`PUT /api/todos/7\` | replace | 200 |
| \`DELETE /api/todos/7\` | remove | 204 |

${demo('fl-rest')}

## Validate input
Never trust JSON. Validate types and required fields, and return **400/422** with a helpful message. Libraries: **marshmallow**, **pydantic**, or Flask extensions like **flask-smorest** / **APIFlask** that also generate OpenAPI docs.

${T}python
from pydantic import BaseModel, Field, ValidationError

class TodoIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    done: bool = False

@bp.post("/todos")
def create_todo():
    try:
        data = TodoIn.model_validate(request.get_json())
    except ValidationError as e:
        return {"errors": e.errors()}, 422
    todo = Todo(**data.model_dump()); db.session.add(todo); db.session.commit()
    return todo.to_dict(), 201, {"Location": url_for(".get_todo", todo_id=todo.id)}
${T}

## Errors as JSON
${T}python
from werkzeug.exceptions import HTTPException

@bp.errorhandler(HTTPException)
def json_error(e):
    return {"error": e.name, "message": e.description}, e.code
${T}

## Pagination
${T}python
page = db.paginate(db.select(Todo), page=request.args.get("page", 1, type=int), per_page=20)
return {"items": [t.to_dict() for t in page.items], "page": page.page, "pages": page.pages, "total": page.total}
${T}

## Authentication for APIs
Browsers use cookies; API clients usually send a token: \`Authorization: Bearer <token>\`. Options: signed tokens with **flask-jwt-extended** (JWT), opaque API keys stored hashed in the database, or OAuth2 via an identity provider.

## CORS
A front end on another origin (e.g. \`localhost:3000\`) can only call your API if you send CORS headers. Use **flask-cors** and allow only the origins you trust: \`CORS(app, origins=["https://myfrontend.com"])\`.

> [!note] Need async I/O, automatic validation from type hints and OpenAPI out of the box? That is FastAPI's sweet spot. Flask can do all of it with extensions and is perfectly fine for most APIs.
`,
    checks: [
      ['What status code and header should a successful create return?', '201 Created with a Location header pointing to the new resource.'],
      ['How do API clients usually authenticate?', 'With a token in the Authorization header (Bearer JWT or API key) rather than browser cookies.'],
      ['What is CORS for?', 'It lets browsers call your API from another origin, but only origins you explicitly allow.'],
    ],
    quiz: [
      { q: 'DELETE /api/todos/7 succeeded with nothing to return. Status?', o: ['200 with {}', '204 No Content', '201', '202'], a: 1 },
      { q: 'JSON is well-formed but "title" is missing. Best status?', o: ['500', '404', '400 or 422', '200'], a: 2 },
      { q: 'Which is NOT RESTful naming?', o: ['GET /api/users', 'POST /api/users', 'POST /api/createUser', 'DELETE /api/users/3'], a: 2 },
    ],
  });

  /* ============================ 10 ============================ */
  CV.addChapter({
    n: 10, part: 4, minutes: 12,
    title: 'Hooks, Error Handling and Logging',
    sub: 'before_request, after_request, teardown, error handlers, custom error pages and logging.',
    md: `
## Request hooks
${demo('fl-hooks')}

| Hook | Runs | Typical use |
|---|---|---|
| \`@app.before_request\` | before every view | load the user, enforce auth, rate limits |
| \`@app.after_request\` | after a response is created (not on unhandled errors in debug) | security headers, CORS, timing |
| \`@app.teardown_request\` | always, even on errors | cleanup |
| \`@app.teardown_appcontext\` | when the app context ends | close DB sessions |
| \`@bp.before_request\` | only for that blueprint | per-area auth |

## Error pages
Register handlers per status code or exception class; blueprints can have their own. Return HTML for browsers and JSON for API blueprints.

## Logging
${T}python
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

@app.get("/pay")
def pay():
    app.logger.info("payment started user=%s", current_user.id)
    try:
        charge()
    except PaymentError:
        app.logger.exception("payment failed")    # includes the traceback
        abort(502)
${T}

> [!tip] In production send logs to stdout and let the platform collect them; add an error tracker (e.g. Sentry) so unhandled exceptions alert you.
`,
    checks: [
      ['What happens if a before_request function returns a value?', 'That value becomes the response and the view is not called.'],
      ['Which hook always runs, even when the view raised an exception?', 'teardown_request (and teardown_appcontext).'],
    ],
    quiz: [
      { q: 'Adding a security header to every response belongs in…', o: ['before_request', 'after_request', 'errorhandler', 'the template'], a: 1 },
      { q: 'app.logger.exception(...) also records…', o: ['the request body', 'the traceback', 'the database', 'nothing extra'], a: 1 },
    ],
  });

  /* ============================ 11 ============================ */
  CV.addChapter({
    n: 11, part: 4, minutes: 14,
    title: 'Testing Flask Apps',
    sub: 'pytest fixtures with the app factory, the test client, testing JSON APIs, auth and the database.',
    md: `
## Fixtures
${T}python
# tests/conftest.py
import pytest
from myapp import create_app
from myapp.extensions import db

@pytest.fixture
def app():
    app = create_app("myapp.config.Testing")      # in-memory SQLite, CSRF off
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()                   # for flask CLI commands
${T}

## Testing views and APIs
${T}python
def test_index(client):
    r = client.get("/")
    assert r.status_code == 200
    assert b"Welcome" in r.data

def test_create_todo(client):
    r = client.post("/api/todos", json={"title": "Write tests"})
    assert r.status_code == 201
    assert r.get_json()["title"] == "Write tests"
    assert client.get(r.headers["Location"]).status_code == 200

def test_requires_title(client):
    assert client.post("/api/todos", json={}).status_code in (400, 422)

def test_login_flow(client):
    client.post("/register", data={"email": "a@b.c", "password": "pw12345!"})
    r = client.post("/login", data={"email": "a@b.c", "password": "pw12345!"}, follow_redirects=True)
    assert b"Dashboard" in r.data
${T}

## What to test
::demo checklist {"id":"fl-tests","label":"Covered","meta":{"title":"Test coverage checklist","desc":"Aim to cover these for every feature."},"items":[["Happy path","valid input returns the right status and data"],["Validation errors","missing or bad fields return 400/422 with messages"],["Auth","anonymous users are redirected (302) or rejected (401/403)"],["Not found","unknown ids return 404"],["Side effects","the database row was created/updated/deleted"],["Redirects","POST views redirect (PRG) and follow_redirects lands on the right page"],["Templates","key text appears; user content is escaped"]]}

> [!tip] Run with coverage: \`pytest --cov=myapp\`. Keep tests fast with an in-memory database and the factory's Testing config.
`,
    checks: [
      ['Why does the app factory make testing easier?', 'Each test can build a fresh app with a Testing config (in-memory DB, CSRF off) instead of sharing a global app.'],
      ['How do you send JSON with the test client?', 'client.post(url, json={...}); read it back with response.get_json().'],
    ],
    quiz: [
      { q: 'Which follows redirects in the test client?', o: ['allow_redirects=True', 'follow_redirects=True', 'redirect=True', 'it always does'], a: 1 },
      { q: 'response.data is…', o: ['a dict', 'bytes', 'str', 'a Response'], a: 1 },
    ],
  });

  /* ============================ 12 ============================ */
  CV.addChapter({
    n: 12, part: 4, minutes: 18,
    title: 'Security and Deployment',
    sub: 'Production servers, workers and threads, reverse proxies, Docker, environment config and a security checklist.',
    md: `
## Never use the dev server in production
\`flask run\` is single-process, not hardened, and (with \`--debug\`) exposes a code-executing debugger. Use a production WSGI server:

${T}bash
pip install gunicorn            # Linux/macOS (waitress on Windows)
gunicorn -w 4 -b 0.0.0.0:8000 "myapp:create_app()"
gunicorn -w 4 --threads 4 -k gthread "myapp:create_app()"   # I/O-heavy apps
${T}

${demo('fl-workers')}

## A typical production stack
${T}text
browser ──HTTPS──▶ nginx (TLS, static files, gzip, rate limit)
                     └──▶ gunicorn (N workers) ──▶ Flask app ──▶ PostgreSQL / Redis
${T}

Behind a proxy, wrap the app so it trusts forwarded headers: \`app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)\` (from \`werkzeug.middleware.proxy_fix\`).

## Docker
${T}dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "myapp:create_app()"]
${T}

Platforms like Render, Railway, Fly.io, Google Cloud Run or a VPS run this image. Configure everything through environment variables (\`SECRET_KEY\`, \`DATABASE_URL\`), and run \`flask db upgrade\` on deploy.

## Security checklist
::demo checklist {"id":"fl-security","label":"Secured","meta":{"title":"Production security checklist","desc":"Go through this before every launch."},"items":[["Debug off","never run --debug or DEBUG=True in production"],["Strong SECRET_KEY from the environment","random 32+ bytes, not in git"],["HTTPS everywhere","SESSION_COOKIE_SECURE=True, HSTS header"],["Cookies hardened","HttpOnly, SameSite=Lax/Strict"],["CSRF protection on forms","Flask-WTF / CSRFProtect"],["No SQL injection","ORM or bound parameters; never f-string SQL"],["No XSS","keep autoescaping; never |safe user input; set a Content-Security-Policy"],["Passwords hashed","generate_password_hash (scrypt/pbkdf2), never plain or MD5"],["Uploads restricted","MAX_CONTENT_LENGTH, allowed extensions, secure_filename, store outside static"],["Auth on every sensitive route","login_required / role checks; validate next= redirects"],["Rate limiting","Flask-Limiter on login and APIs"],["Dependencies updated","pip-audit / Dependabot"],["Errors monitored","logging to stdout + an error tracker"]]}

## Async and background work
Flask supports \`async def\` views (install \`flask[async]\`), but each request still occupies a worker. Long jobs (emails, video processing) belong in a task queue such as **Celery** or **RQ** with Redis; the view enqueues and returns immediately.
`,
    checks: [
      ['Why not deploy with flask run?', 'The dev server is not built for production load or security, and debug mode exposes an interactive debugger that can execute code.'],
      ['Rule of thumb for Gunicorn sync workers?', 'About 2 × CPU cores + 1; add threads (gthread) for I/O-bound apps.'],
      ['Where should long-running tasks run?', 'In a background task queue (Celery/RQ) so requests return quickly.'],
    ],
    quiz: [
      { q: '4 sync workers, each request takes 500 ms. Max throughput ≈', o: ['2 req/s', '8 req/s', '40 req/s', 'unlimited'], a: 1, e: '4 × (1000 / 500) = 8 requests per second.' },
      { q: 'What does nginx typically do in front of Gunicorn?', o: ['Run Python code', 'Terminate TLS, serve static files, buffer and proxy requests', 'Replace the database', 'Compile templates'], a: 1 },
      { q: 'Which is a security mistake?', o: ['SECRET_KEY from an env var', 'DEBUG=True in production', 'SESSION_COOKIE_SECURE=True', 'Using the ORM'], a: 1 },
    ],
  });

  /* ============================ Reference ============================ */
  CV.REF['fl-api'] = {
    head: ['Code', 'What it does'], mono: [0],
    rows: [
      ['app = Flask(__name__)', 'create the application'], ['flask --app app run --debug', 'dev server with reload + debugger'],
      ['@app.route(path, methods=[...]) / @app.get / @app.post', 'register a view'], ['<int:id> <path:p> <uuid:u>', 'URL converters'],
      ['url_for("endpoint", **values)', 'build URLs (query string for extra args)'], ['request.args / form / get_json() / files', 'read input'],
      ['return dict | (body, status, headers)', 'JSON and custom status/headers'], ['render_template("x.html", **ctx)', 'render Jinja2'],
      ['redirect(url_for(...)) / abort(404)', 'redirect / stop with an HTTP error'], ['@app.errorhandler(404)', 'custom error responses'],
      ['make_response(...) / resp.set_cookie()', 'full control over the response'], ['session["k"] = v', 'signed-cookie session (needs SECRET_KEY)'],
      ['flash(msg) / get_flashed_messages()', 'one-time messages'], ['generate_password_hash / check_password_hash', 'password storage'],
      ['@login_required, login_user, current_user', 'Flask-Login'], ['db.session.execute(db.select(M).where(...)).scalars()', 'SQLAlchemy 2.0 query'],
      ['db.get_or_404(M, id) / db.paginate(select)', 'fetch or 404 / pagination'], ['flask db migrate / upgrade', 'Flask-Migrate (Alembic)'],
      ['Blueprint("name", __name__) / register_blueprint(bp, url_prefix=)', 'modular apps'], ['def create_app(): …', 'application factory'],
      ['with app.app_context():', 'use current_app/db in scripts'], ['@app.before_request / after_request / teardown_appcontext', 'request hooks'],
      ['app.test_client() / client.post(url, json=...)', 'testing'], ['gunicorn -w 4 "pkg:create_app()"', 'production server'],
      ['ProxyFix(app.wsgi_app, x_for=1, x_proto=1)', 'run correctly behind a reverse proxy'],
    ],
  };
  CV.GLOSSARIES.flask = [
    ['WSGI', 'standard interface between Python web servers and applications'], ['Werkzeug', 'the WSGI toolkit under Flask: routing, request/response, dev server'],
    ['Jinja2', 'the template engine used by Flask'], ['Route / URL rule', 'a pattern mapping a URL to a view function'], ['Endpoint', 'the name of a view used by url_for'],
    ['Converter', 'type in a URL rule such as int or path'], ['View function', 'function that handles a request and returns a response'],
    ['Context local', 'proxy like request or current_app that points to the active request/app'], ['Application context', 'makes current_app and g available'],
    ['Request context', 'makes request and session available'], ['g', 'per-request storage on the app context'], ['Blueprint', 'a reusable group of routes, templates and static files'],
    ['Application factory', 'function that creates and configures the app'], ['Session', 'per-user data stored in a signed cookie'], ['SECRET_KEY', 'key used to sign sessions and tokens'],
    ['CSRF', 'cross-site request forgery; blocked with per-session form tokens'], ['XSS', 'cross-site scripting; blocked by autoescaping'],
    ['PRG', 'POST/Redirect/GET pattern to avoid resubmission'], ['ORM', 'object-relational mapper such as SQLAlchemy'], ['N+1 problem', 'one query per related row; fix with eager loading'],
    ['Migration', 'versioned schema change (Alembic / Flask-Migrate)'], ['Idempotent', 'repeating the request has the same effect as once'],
    ['Gunicorn', 'production WSGI server with multiple workers'], ['Reverse proxy', 'server like nginx in front of the app handling TLS and static files'],
  ];
  CV.DECKS.flask = [
    ['Core', [
      ['Explain what happens when a request hits a Flask app.', 'The WSGI server calls the app; Flask pushes app and request contexts, matches the URL to a view, runs before_request hooks, the view, converts the return value to a Response, runs after_request, then teardown.'],
      ['What are context locals and why does Flask use them?', 'Proxies like request and current_app that point at the active request/app, so code can use them without passing objects around; they need an active context.'],
      ['How does the Flask session work?', 'A dict serialised into a cookie and signed with SECRET_KEY; readable by the client, tamper-proof, not encrypted.'],
      ['What is an application factory and why use blueprints?', 'A function that builds and configures the app (testing, configs, no circular imports); blueprints group related routes and templates into modules.'],
    ]],
    ['Data & APIs', [
      ['How do you avoid the N+1 query problem?', 'Use eager loading (selectinload/joinedload) instead of lazy loading inside loops.'],
      ['Which status codes for create, delete, validation error, not found?', '201 (+Location), 204, 400/422, 404.'],
      ['How do you secure an API?', 'Token auth (JWT/API key) over HTTPS, validation, rate limiting, CORS restricted to known origins.'],
    ]],
    ['Production', [
      ['How do you deploy Flask?', 'Gunicorn/uWSGI/Waitress with several workers behind nginx or a platform load balancer, config from env vars, migrations on deploy, logs to stdout.'],
      ['Name five Flask security practices.', 'Debug off, strong secret key, CSRF tokens, autoescaping/no |safe on user input, hashed passwords, parameterised SQL, secure cookies, rate limiting.'],
      ['Sync workers vs threads?', 'Each sync worker serves one request at a time; threads (gthread) let a worker overlap I/O-bound requests.'],
    ]],
  ];

  CV.addExtra({ slug: 'cheatsheet', part: 5, icon: 'Σ', title: 'Cheat Sheet', sub: 'The Flask API and common patterns on one searchable page.',
    sections: [{ id: 'api', title: 'API cheat sheet', html: CV.h.w('ref-table', { key: 'fl-api', meta: { title: 'Flask API', desc: 'Type to filter, e.g. "url", "session", "test".' } }) }] });
  CV.addExtra({ slug: 'glossary', part: 5, icon: 'Aa', title: 'Glossary', sub: 'Flask and web vocabulary, searchable.',
    sections: [{ id: 'terms', title: 'Terms', html: CV.h.w('glossary', { key: 'flask' }) }] });
  CV.addExtra({ slug: 'interview', part: 5, icon: '?', title: 'Interview Questions', sub: 'Flashcards on core concepts, data and APIs, and production.',
    sections: [{ id: 'cards', title: 'Flashcards', html: CV.h.w('flashcards', { deck: 'flask' }) }] });
})();
