# Content Admin

## Telegram publishing setup with GitHub Actions

The app stores content and schedules in Firestore. GitHub Actions runs the Telegram worker every five minutes, so the bot token is never included in the browser bundle and Firebase Functions billing is not required.

Prerequisites:

- A GitHub repository containing this project
- A Firebase service account with Firestore access
- The bot is an administrator of the target Telegram channel

Create a Firebase service-account key from **Firebase Console > Project settings > Service accounts > Generate new private key**. Keep the downloaded JSON private.

In the GitHub repository, open **Settings > Secrets and variables > Actions > New repository secret** and add:

```text
FIREBASE_SERVICE_ACCOUNT   (the complete service-account JSON)
TELEGRAM_BOT_TOKEN        (the newly generated BotFather token)
TELEGRAM_CHAT_ID           (for example, -1001234567890)
```

Never commit the JSON key or put the bot token in a Vite environment variable.

The workflow is [telegram-scheduler.yml](.github/workflows/telegram-scheduler.yml). It runs every five minutes and can also be started manually from the **Actions** tab.

For local Firebase Functions deployment, the older Functions path still exists, but it is not needed for GitHub Actions scheduling:

```powershell
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set TELEGRAM_CHAT_ID
```

Deploy the functions:

```powershell
Push-Location functions
npm install
Pop-Location
firebase deploy --only functions
```

With GitHub Actions:

1. Approve a content item.
2. Schedule it for a future time, or use `Publish Now`.
3. `Publish Now` queues the item for immediate processing.
4. GitHub Actions checks every five minutes for due scheduled items.
5. Successful deliveries become `PUBLISHED` and store `telegramMessageId` and `publishedAt`.
6. Failed deliveries remain in their current status and store `telegramPublishError`.

The GitHub Actions worker source is in `functions/src/runScheduled.ts`.

### Fixing Vercel image uploads

Firebase Storage needs a bucket CORS policy for browser uploads from Vercel. The policy is in [storage.cors.json](storage.cors.json). Run this command in Google Cloud Shell or on a machine with the Google Cloud CLI installed:

```bash
gcloud storage buckets update gs://content-admin-46278.firebasestorage.app --cors-file=storage.cors.json
```

If the bucket name shown in Firebase Console is different, use that exact bucket name after `gs://`. After updating CORS, wait a few minutes, refresh the Vercel app, and retry the upload. Firebase Storage Rules must also allow the current user to write to `images/`.

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
