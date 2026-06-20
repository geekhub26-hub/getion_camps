# 🏕️ Camp Manager — Backend API

API REST Node.js + Express + Prisma pour la gestion de camp d'adolescents.

## Stack

- **Runtime** : Node.js + TypeScript
- **Framework** : Express 4
- **ORM** : Prisma 5
- **Base de données** : PostgreSQL
- **Auth** : JWT (access token 7j + refresh token 30j)
- **Sécurité** : Helmet, CORS, Rate limiting

---

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Copier et configurer les variables d'environnement
cp .env.example .env
# → Éditer .env avec vos vraies valeurs

# 3. Créer la base de données PostgreSQL
createdb camp_manager

# 4. Exécuter la migration initiale
npx prisma migrate dev --name init

# 5. Générer le client Prisma
npx prisma generate

# 6. Insérer les données de test
npm run seed

# 7. Démarrer en développement
npm run dev
```

---

## Structure du projet

```
src/
├── config/
│   └── prisma.ts          # Singleton Prisma Client
├── controllers/
│   ├── auth.controller.ts        # Login, register, refresh, me
│   ├── camp.controller.ts        # CRUD camps + stats
│   └── participant.controller.ts # CRUD participants
├── middlewares/
│   ├── auth.middleware.ts   # Vérification JWT + RBAC
│   └── error.middleware.ts  # Gestionnaire d'erreurs global
├── routes/
│   ├── auth.routes.ts
│   ├── camp.routes.ts
│   └── participant.routes.ts
├── types/
│   └── index.ts             # Types TypeScript partagés
├── utils/
│   ├── jwt.ts               # Génération/vérification tokens
│   └── response.ts          # Helpers réponses API standard
└── index.ts                 # Point d'entrée + config Express
```

---

## Routes disponibles

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter |
| POST | `/api/auth/refresh` | Renouveler le token |
| GET  | `/api/auth/me` | Profil utilisateur connecté |
| PUT  | `/api/auth/password` | Changer le mot de passe |

### Camps
| Méthode | Route | Rôle requis |
|---------|-------|-------------|
| GET    | `/api/camps` | Tous |
| POST   | `/api/camps` | Admin |
| GET    | `/api/camps/:id` | Tous |
| PUT    | `/api/camps/:id` | Admin |
| DELETE | `/api/camps/:id` | Admin |
| GET    | `/api/camps/:id/stats` | Staff |
| GET    | `/api/camps/:id/participants` | Staff |
| POST   | `/api/camps/:id/participants` | Staff |

### Participants
| Méthode | Route | Rôle requis |
|---------|-------|-------------|
| GET    | `/api/participants/:id` | Staff |
| PUT    | `/api/participants/:id` | Staff |
| DELETE | `/api/participants/:id` | Admin |
| PUT    | `/api/participants/:id/statut` | Admin |

---

## Format de réponse

Toutes les réponses suivent ce format :

```json
{
  "success": true,
  "message": "Camps récupérés",
  "data": [...],
  "meta": {
    "total": 42,
    "page": 1,
    "perPage": 10,
    "totalPages": 5
  }
}
```

---

## Comptes de test (après seed)

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@camp.cm | Admin1234! | SUPER_ADMIN |
| brigitte@camp.cm | Animateur1! | ADMIN |
| jeanpaul@camp.cm | Animateur1! | ANIMATEUR |
| sophie@camp.cm | Animateur1! | ANIMATEUR |

---

## Prochaines étapes

- [ ] Controllers : Activités, Paiements, Documents, Messages
- [ ] Service email (Nodemailer)
- [ ] Upload de fichiers (Multer)
- [ ] Cron job pour les snapshots de statistiques
- [ ] Frontend React (Vite + Tailwind)
