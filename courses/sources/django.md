# Django Zero to Hero: Enterprise CMS + REST APIs

**Target project:** editorial CMS with registration, article drafts, approver workflow, organization-aware permissions and an analytics view. Starter demo is under `../projects/django_cms/`. We use SQLite locally to keep labs light; PostgreSQL, Redis and infrastructure are production design extensions, not already-deployed components.

## 01 · What is Django? Framework ka big picture

Framework is ready-made architecture for common web work. Flask starts small and lets you choose components. Django includes ORM, authentication, admin, migrations, templates and security defaults. MTV stands for Model (data), Template (view rendering), View (request handling): Django's terminology is not identical to classical MVC, but roles are comparable.

```text
Browser → URL router → View → Model/ORM → DB
                         ↓
                    Template HTML
```

**Lab:** List responsibilities of URL, view, model, template and admin. Explain who checks permissions. The framework doesn't eliminate application-specific security work.

## 02 · Python and virtualenv prerequisites

Install Python 3, create a venv, choose dependency versions deliberately. Use `pip freeze` only after you understand what is installed. Pin dependencies for reproducible deployments and track security updates.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install 'Django>=5.2,<6'
python -m django --version
```

**Lab:** Run `django-admin startproject school .`; inspect `manage.py`, `settings.py`, `urls.py`, `asgi.py`, `wsgi.py`. `runserver` is for development, not public production serving.

## 03 · Project and app separation

Django *project* is the full site configuration; an *app* is one focused subsystem. e.g. `accounts`, `articles`, `analytics`. Overly fragmented apps create coupling; a monolith with clear modules is fine. `INSTALLED_APPS` activates app models/templates. Check `ALLOWED_HOSTS`, deployment settings and `SECRET_KEY` from environment.

```text
enterprise_cms/
  manage.py
  core/settings.py
  core/urls.py
  articles/models.py
  articles/views.py
  articles/admin.py
  articles/tests.py
  templates/
```

**Lab:** Create an app named `articles`; add to `INSTALLED_APPS` and connect `path('articles/',include('articles.urls'))`.

## 04 · Views, URLs and templates

URL patterns dispatch to function/class-based views. Views must handle both valid and invalid input. Templates render HTML with escaping enabled; never trust raw rich-text output. Use named URLs with `reverse()` and `{% url %}` so refactors don't break hardcoded paths.

```python
from django.http import HttpResponse
from django.urls import path

def hello(request):
    return HttpResponse("Namaste from Django")
urlpatterns = [path("hello/", hello, name="hello")]
```

**Lab:** Build Home and About. Use base template with `{% block content %}` and reusable navigation. Test keyboard and mobile viewport.

## 05 · Models, migrations, primary keys and relations

Models define shape; migrations version schema changes. `Article.author` uses foreign key so database can maintain integrity. Django's SQL engine supports transactions; use them for multi-write operations that must succeed/fail together.

```python
class Article(models.Model):
    title = models.CharField(max_length=180)
    body = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT)
    status = models.CharField(max_length=16,default="draft")
```

```bash
python manage.py makemigrations
python manage.py migrate
```

**Lab:** Create three articles in `python manage.py shell`; filter `status='draft'`. Explain why changing a model without migration fails.

## 06 · Django ORM, QuerySets and performance

QuerySet is a lazy database query description. `filter`, `exclude`, `order_by`, `annotate` compose SQL. `select_related` for single-valued joins and `prefetch_related` for many-to-many reduce N+1. Index on common filters but verify with database query plans.

```python
Article.objects.filter(status="published").select_related("author").order_by("-created_at")[:20]
```

**Lab:** Compare SQL query count on list view with vs without `select_related`. Avoid pulling entire dataset into Python for sums that SQL can calculate.

## 07 · Forms, validation and CSRF

`ModelForm` maps model fields into form validation, but authorization is separate. Validate input at boundary and enforce invariants at model/database layer. Django's CSRF middleware helps browser form submissions; include `{% csrf_token %}`. Escaped text prevents simple HTML injection, but rich text/upload policies require extra design.

```html
<form method="post">{% csrf_token %}
  {{ form.as_p }}
  <button type="submit">Save draft</button>
</form>
```

**Lab:** Add form errors for empty title; test forged POST without CSRF as a client configured to enforce checks. Learn why `GET` should not mutate state.

## 08 · Authentication, groups and object permissions

Django provides users, sessions, password hashing, permissions. `@login_required` confirms logged-in status but not editing rights. Ensure post owner or assigned editor can edit an article. With multiple organizations, check tenant membership and scope every query to that tenant.

```python
from django.core.exceptions import PermissionDenied
if article.author_id != request.user.id and not request.user.has_perm("articles.change_article"):
    raise PermissionDenied
```

**Lab:** Create two users, one editor; verify author cannot edit another user's draft and anonymous visitor cannot access author dashboard. **Enterprise:** design OIDC SSO and central role mapping before deployment.

## 09 · Django Admin and editorial workflow

Admin is powerful internal staff interface, not a substitute for custom client-facing UI. Restrict it to staff, apply search/filter fields, permissions and audit logging. Editorial lifecycle: draft → submitted → approved → published → archived. Rules should reside in service/model layer, not only a disabled button.

```text
Author → Draft → Review Queue → Editor Approval → Public Article
                                  ↘ Reject → Author revision
```

**Lab:** Add a status filter to ArticleAdmin. Test publishing attempt from a non-editor (must fail server-side).

## 10 · Static/media files, uploads and storage

Static assets are app-controlled CSS/JS. Media uploads are untrusted data. Restrict extension, MIME type, max size, and where files are served; never execute uploaded code. For scale, use object storage with private access, signed URLs and malware inspection as appropriate.

```python
STATIC_URL = "static/"
MEDIA_URL = "media/"  # dev only; separate secure serving in production
```

**Lab:** Sketch a safe flow for author profile picture upload. Identify size limits, storage permissions, filename normalization and abuse controls.

## 11 · Django REST Framework and versioned APIs

DRF serializers define validation and wire format, viewsets handle HTTP operations, permission classes control access. Pagination is essential for lists, throttling supplements (but doesn't replace) perimeter controls, and filtersets must respect tenant scope.

```python
from rest_framework import serializers
class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = ["id","title","status","created_at"]
        read_only_fields = ["id","created_at"]
```

**Lab:** Design `GET /api/v1/articles/`, `POST /api/v1/articles/`, `PATCH /api/v1/articles/<id>/`. Define 400, 401, 403, 404 in API contract. No API endpoint should expose another tenant's drafts.

## 12 · Automated tests, factories and coverage

Django `TestCase` provides isolated DB transactions. Test business rules (unauthorized edit blocked), not just URL 200. Add tests for validation, wrong-tenant lookups, workflow transitions, migrations and queries. CI should run format, unit/integration tests, dependency audit and migration checks.

```python
from django.test import TestCase
from django.urls import reverse
class HomepageTests(TestCase):
    def test_home_loads(self):
        result = self.client.get(reverse("home"))
        self.assertEqual(result.status_code,200)
```

**Lab:** Run `python manage.py test`, then intentionally break a permission and watch the regression test fail. Production datasets should not be copied into local dev tests.

## 13 · Security settings and background work

`DEBUG=False` is mandatory publicly, but not sufficient: valid `ALLOWED_HOSTS`, HTTPS, HSTS after validating certificate/proxy setup, secure cookies, CSRF trusted origins, CSP, rate-limits, secret storage and dependency reviews. Long-running actions belong in workers; Celery + Redis is a common architecture.

```text
Nginx HTTPS → Gunicorn/Django → Postgres
                       ↓
                  Redis Queue → Worker
                       ↓
                 Monitoring & Alerts
```

**Lab:** Record what data each component handles. No passwords or session tokens in logs. Test that production refuses invalid Host headers.

## 14 · Performance, caching and reliability

Measure before optimization: p95 latency, database query count, cache hit rate, error rate. Django caching supports various backends; cache keys must include user/organization/permission context where response differs. Add indexes after observing slow queries. Load tests need representative data and safe staging environment.

**Lab:** Define SLO e.g. 99.9% successful read requests measured monthly, and specify how failures are counted. Create a dashboard for 5xx rate, DB pool saturation, task queue age and backups.

## 15 · Container deployment and enterprise acceptance

Local `runserver` and SQLite demonstrate functionality. Production likely: immutable image, environment configuration, Gunicorn/ASGI worker selection, Postgres migrations, object storage, Redis, secrets manager, TLS proxy, audit, metrics, backups and restore drills. Database migration is a release step with rollback plan, not something to blindly run from every container.

```bash
# local starter, from the project folder
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py test
python manage.py runserver 127.0.0.1:8000
```

**Enterprise checklist:** object-level authorization; tenant isolation; audit events; accessibility; tests; CI; migrations; backup restore; incident playbook; dependency scanning; performance SLO; rate limiting; privacy and retention policies.

**Interview defense:** MTV vs MVC, QuerySet laziness, `select_related` vs `prefetch_related`, CSRF, authentication vs authorization, WSGI vs ASGI, migrations, admin risks, DRF serializer permissions, cache invalidation.
