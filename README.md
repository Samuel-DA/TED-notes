# TED Space

TED Space is a private two-person React Native app for staying connected every day. It combines shared check-ins, moods, love notes, prayer and scripture, daily questions, chat, todos, and real-time games.

## Current scope

The current release is intentionally designed for one couple. Firestore documents use pair membership throughout, so the data model can support more couples later, but a public launch requires the server-side work listed under **Public-launch gates**.

## Main features

- Email registration, login, password recovery, and persistent sessions
- Secure high-entropy partner invitations with atomic pair joining
- Daily couple check-in and connection streak
- Shared moods, notes, prayer confirmations, scripture, and daily questions
- Shared todos
- Real-time chat with replies, reactions, read receipts, and push notifications
- Guess the Meaning, Know Me, This or That, and Conversation Cards games
- Shared game scoreboard
- Face ID, Touch ID, fingerprint, or device-passcode protection on supported devices

## Technology

- Expo SDK 54 and React Native
- Expo Router
- TypeScript
- Firebase Authentication and Cloud Firestore
- Expo Notifications and EAS Update

## Local setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Confirm the project is healthy:

   ```sh
   npm run check
   ```

3. Start the development server:

   ```sh
   npx expo start
   ```

The Firebase web configuration and Android `google-services.json` identify the Firebase project; they are not server credentials. Access control is enforced by `firestore.rules`.

## Firestore deployment

Authenticate the Firebase CLI against the intended Firebase project, verify the selected project, and deploy the versioned rules:

```sh
firebase use ted-notes
firebase deploy --only firestore:rules
```

Do not assume local rule changes protect production until this deployment succeeds.

## Data layout

```text
users/{uid}
pairs/{pairId}
  messages/{messageId}
  todos/{todoId}
  games/{gameId}
  scoreboard/global
```

Pair-level daily state, moods, notes, and names are stored on the pair document. Every pair subcollection is restricted to authenticated pair members by the versioned Firestore rules.

## Quality checks

```sh
npm run typecheck
npm run lint
npm run check
npm run test:rules
npx expo install --check
```

The current Firebase CLI requires Java 21 or newer. If macOS still selects an older JDK after installing OpenJDK 25, run the rules suite with:

```sh
PATH="$(brew --prefix openjdk@25)/bin:$PATH" npm run test:rules
```

Native authentication, notifications, deep links, background/resume locking, and two-device synchronization must also be checked on real iOS and Android devices before a release.

## Public-launch gates

Before opening registration to other couples:

- Move push-notification sending to a trusted Firebase Function with App Check, authentication, rate limiting, and Expo receipt handling.
- Move answer validation and score awarding for competitive games to a trusted function so correct answers never reach the guessing client.
- Add Firebase Emulator rule tests covering cross-pair reads, forged pair membership, forged sender IDs, receipt/reaction tampering, and scoreboard abuse.
- Split growing pair-root daily history into bounded subcollections or introduce retention/archival.
- Add account deletion, unpairing, token revocation, abuse handling, privacy policy, data export, and consent flows.
- Add crash reporting and production monitoring without recording private message content.

## Privacy notes

- Firebase client API keys are identifiers, not administrative secrets; Firebase rules remain the security boundary.
- Never commit service-account JSON, APNs private keys, FCM server credentials, or EAS access tokens.
- Push delivery is currently client-triggered because this release is private. It must not be treated as an authenticated sender channel for a public release.
