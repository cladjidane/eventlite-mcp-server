# EventLite MCP Server

Serveur MCP (Model Context Protocol) pour [EventLite](https://github.com/cladjidane/cc-events) — permet à Claude de gérer vos événements et inscriptions en langage naturel.

## Installation

### Prérequis

Un compte EventLite avec une clé API.

### Générer une API Key

1. Connectez-vous sur [eventlite.context-collective.org](https://eventlite.context-collective.org)
2. Allez dans **Paramètres → Clés API**
3. Créez une nouvelle clé (ex: "MCP Server")
4. Copiez le token (format: `evl_xxxxxxxxxxxxx`) — il n'est affiché qu'une seule fois !

---

### Option 1 : Binaire standalone (recommandé)

**Aucune installation requise** — téléchargez simplement l'exécutable pour votre système.

1. Téléchargez le binaire depuis [GitHub Releases](https://github.com/cladjidane/eventlite-mcp-server/releases) :
   - **macOS Apple Silicon** : `eventlite-mcp-darwin-arm64`
   - **macOS Intel** : `eventlite-mcp-darwin-x64`
   - **Windows** : `eventlite-mcp-windows-x64.exe`
   - **Linux** : `eventlite-mcp-linux-x64`

2. Placez-le dans un dossier de votre choix (ex: `~/eventlite-mcp/`)

3. **macOS/Linux** : Rendez-le exécutable
   ```bash
   chmod +x ~/eventlite-mcp/eventlite-mcp-darwin-arm64
   ```

4. Ajoutez dans votre fichier de configuration Claude Desktop :

   **macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`
   **Windows** : `%APPDATA%\Claude\claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "eventlite": {
         "command": "/Users/VOTRE_NOM/eventlite-mcp/eventlite-mcp-darwin-arm64",
         "env": {
           "EVENTLITE_API_URL": "https://eventlite.context-collective.org",
           "EVENTLITE_API_KEY": "evl_xxxxxxxxxxxxx"
         }
       }
     }
   }
   ```

   > Remplacez le chemin par l'emplacement réel du binaire sur votre machine.

5. Redémarrez Claude Desktop.

---

### Option 2 : Via npm (nécessite Node.js)

Si vous avez Node.js v18+ installé :

```bash
npm install -g github:cladjidane/eventlite-mcp-server
```

Configuration Claude Desktop :

```json
{
  "mcpServers": {
    "eventlite": {
      "command": "eventlite-mcp",
      "env": {
        "EVENTLITE_API_URL": "https://eventlite.context-collective.org",
        "EVENTLITE_API_KEY": "evl_xxxxxxxxxxxxx"
      }
    }
  }
}
```

---

## Configuration

| Variable | Description |
|----------|-------------|
| `EVENTLITE_API_URL` | `https://eventlite.context-collective.org` |
| `EVENTLITE_API_KEY` | Clé API générée depuis le dashboard (format: `evl_xxx`) |

## Outils disponibles

### Événements

| Outil | Description |
|-------|-------------|
| `list_events` | Lister les événements (filtrer par statut) |
| `get_event` | Détails d'un événement par ID ou slug |
| `create_event` | Créer un événement (avec `coverImage` optionnel) |
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

### Upload

| Outil | Description |
|-------|-------------|
| `upload_image` | Uploader une image depuis une URL pour l'utiliser comme couverture |

## Exemples d'utilisation

Une fois configuré, vous pouvez simplement parler à Claude :

- *"Crée un meetup IA le 15 mars à 19h au WeWork Paris, max 50 personnes"*
- *"Inscris alice@test.com au workshop React"*
- *"Combien de personnes sont inscrites au meetup ?"*
- *"Envoie un rappel aux inscrits confirmés"*
- *"Publie l'événement workshop-react"*
- *"Ajoute cette image comme couverture de l'événement : https://example.com/image.jpg"*

## Dépannage

### Le serveur ne démarre pas

- Vérifiez que le binaire est exécutable (`chmod +x` sur macOS/Linux)
- Vérifiez que la clé API est valide
- Consultez les logs Claude Desktop pour voir les erreurs

### Erreur "Unauthorized"

- Vérifiez que `EVENTLITE_API_KEY` est correctement configuré
- Générez une nouvelle clé API si nécessaire

### Les outils n'apparaissent pas dans Claude

- Redémarrez complètement Claude Desktop
- Vérifiez la syntaxe JSON de votre fichier de configuration
- Vérifiez que le chemin vers le binaire est correct

## Développement

```bash
# Cloner le repo
git clone https://github.com/cladjidane/eventlite-mcp-server.git
cd eventlite-mcp-server

# Installer les dépendances
npm install

# Build TypeScript
npm run build

# Tester localement
EVENTLITE_API_URL=http://localhost:3333 EVENTLITE_API_KEY=evl_xxx node dist/index.js

# Compiler les binaires (nécessite Bun)
bun run build:binary
```

## Licence

MIT
