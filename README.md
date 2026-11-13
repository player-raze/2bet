# 2bet Casino Landing Page

A responsive Nuxt 3 casino interface demo built with Vue 3, TypeScript, Tailwind CSS, and Lucide icons.

## Setup

```bash
npm install
npm run dev
```

The dev launcher gives Node and the Nitro SSR worker a 6 GB heap limit to avoid
out-of-memory failures during development. An existing heap limit in
`NODE_OPTIONS` takes precedence. Pass Nuxt options through as usual, for example
`npm run dev -- --port 3001`.

Type-check and create a production build:

```bash
npm run typecheck
npm run build
```

## Blogs and Bloggerist

The public blog list is `/blogs`; categories use `/blogs/<category>` and articles
use `/blog/<blog-slug>`. Pagination keeps the category path, for example
`/blogs/guides?page=2`. Published posts, categories and article content come from
the existing Bloggerist blog APIs. Drafts and future scheduled posts remain
hidden. Empty storage displays an empty list.

`npm run dev` also starts the bundled `public/bloggerist` application through PHP
on `http://127.0.0.1:8082` (or an available port if 8082 is occupied), and prints the
admin URL: `/admin/blogs.php` on that PHP origin. The process stops with Nuxt. To run
PHP separately, use `npm run bloggerist` and set `NUXT_BLOGGERIST_URL` to its printed
origin when starting Nuxt. PHP with PDO SQLite and DOM extensions is required;
without it, Nuxt still starts and the blogs page reports that content is unavailable.

Use the existing Bloggerist administrator credentials. Configure them through
Bloggerist's `admin/.env` or environment (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`,
and `ADMIN_JWT_SECRET`); this integration does not create accounts or passwords.
Local SQLite/runtime storage is `data/bloggerist`, outside the public source
folder; an explicit `APP_STORAGE_DIR` takes precedence. Existing Bloggerist source
files are not modified. Local PHP uses its own origin for `SITE_BASE_URL` unless
explicitly configured.

For production, serve Bloggerist as a separate PHP site with its folder as the
document root, enforce its `.htaccess` restrictions (or Nginx equivalents), and
set Nuxt's `NUXT_BLOGGERIST_URL` to that PHP origin. Configure Bloggerist's
`SITE_BASE_URL` to the same origin so uploads resolve correctly. Nuxt excludes
the Bloggerist source folder from public assets: PHP source, storage, configuration
and repository files must never be published as downloadable static assets.

## Artwork note

No reference screenshot or source image files were present in the workspace. All banner and game artwork is local, replaceable CSS/SVG-style illustration rendered by the Vue components. It does not depend on third-party image URLs. Replace the visual layers in `PromoBanners.vue`, `GameCard.vue`, `OriginalGames.vue`, and `LiveCasinoGrid.vue` when final licensed artwork is available.

All game launches, account actions, promotions, recent wins, payment labels, and social controls are explicitly presented as interface demos; there is no authentication, wagering, payment, or game-launch backend.

# Create new project 
Git clone (Lanie's cheat code)
```
git clone git@player-raze:gphi-dev/bybet-mock.git {project-name}
```

```
cd {project-name}
```

```
git remote rename origin upstream
```

```
git remote add origin git@github.com:player-raze/{project-name}.git
```

```
git branch -M main
```

create repository in github first

```
git push -u origin main
```

Verify

```
git remote -v
```
