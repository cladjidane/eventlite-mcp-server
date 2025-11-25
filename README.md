# EventLite MCP Server

Serveur MCP (Model Context Protocol) pour [EventLite](https://github.com/cladjidane/cc-events) — permet à Claude de gérer vos événements et inscriptions en langage naturel.

## Installation

### Avec Claude Desktop

Ajoutez cette configuration dans votre fichier `claude_desktop_config.json` :

**macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows** : `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "eventlite": {
      "command": "npx",
      "args": ["github:cladjidane/eventlite-mcp-server"],
      "env": {
        "EVENTLITE_API_URL": "https://eventlite.heavenlight.fr",
        "EVENTLITE_API_KEY": "evl_xxxxxxxxxxxxx"
      }
    }
  }
}
```

### Avec Claude Code

```bash
claude mcp add eventlite -- npx github:cladjidane/eventlite-mcp-server
```

Puis configurez les variables d'environnement.

## Configuration

| Variable | Description |
|----------|-------------|
| `EVENTLITE_API_URL` | `https://eventlite.heavenlight.fr` (instance de production) |
| `EVENTLITE_API_KEY` | Clé API générée depuis le dashboard (format: `evl_xxx`) |

### Générer une API Key

1. Connectez-vous sur [eventlite.heavenlight.fr](https://eventlite.heavenlight.fr)
2. Allez dans **Paramètres → Clés API**
3. Créez une nouvelle clé (ex: "MCP Server")
4. Copiez le token (format: `evl_xxxxxxxxxxxxx`)

## Outils disponibles

### Événements

| Outil | Description |
|-------|-------------|
| `list_events` | Lister les événements (filtrer par statut) |
| `get_event` | Détails d'un événement par ID ou slug |
| `create_event` | Créer un événement |
| `update_event` | Modifier un événement |
| `delete_event` | Supprimer un événement |

### Inscriptions

| Outil | Description |
|-------|-------------|
| `list_registrations` | Lister les inscriptions d'un événement |
| `register_attendee` | Inscrire un participant |
| `unregister_attendee` | Annuler une inscription |

### Notifications

| Outil | Description |
|-------|-------------|
| `send_notification` | Envoyer un email aux participants |

## Exemples d'utilisation

Une fois configuré, vous pouvez simplement parler à Claude :

- *"Crée un meetup IA le 15 mars à 19h au WeWork Paris, max 50 personnes"*
- *"Inscris alice@test.com au workshop React"*
- *"Combien de personnes sont inscrites au meetup ?"*
- *"Envoie un rappel aux inscrits confirmés"*
- *"Publie l'événement workshop-react"*

## Développement local

```bash
# Cloner le repo
git clone https://github.com/cladjidane/eventlite-mcp-server.git
cd eventlite-mcp-server

# Installer les dépendances
npm install

# Build
npm run build

# Tester localement
EVENTLITE_API_URL=http://localhost:3000 EVENTLITE_API_KEY=xxx node dist/index.js
```

## Licence

MIT
