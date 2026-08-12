# Winter Arc

Une cellule de 4 à 5 personnes. Un hiver. Des objectifs chiffrés tenus ou non,
visibles de tous, chaque jour.

React + Vite + TypeScript + Tailwind, données partagées via Supabase.

## Développement local

```bash
npm install
cp .env.example .env.local   # renseigne VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev
```

## Backend (Supabase)

1. Crée un projet gratuit sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécute le contenu de [`supabase/schema.sql`](supabase/schema.sql)
   pour créer la table `groups` et activer le temps réel.
3. Dans **Project Settings > API**, récupère l'**URL** du projet et la clé
   **anon public** — ce sont `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.

## Déploiement (GitHub Pages)

Le workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) build
et publie automatiquement sur GitHub Pages à chaque push sur `main`.

À configurer une fois, dans les paramètres du repo GitHub :

1. **Settings > Pages** → Source = **GitHub Actions**.
2. **Settings > Secrets and variables > Actions** → ajoute deux secrets :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Pousse sur `main` (ou relance le workflow manuellement) — le site est
   ensuite servi sur `https://<owner>.github.io/winterarc/`.
