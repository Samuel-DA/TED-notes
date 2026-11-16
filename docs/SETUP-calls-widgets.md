# Setting up calls, private chat, weekly recap and widgets

## 1. Install the new packages
```
npx expo install
cd functions && npm install && cd ..
```

## 2. Stream (voice and video calls)
1. Create a free app at https://getstream.io/video. Copy its **API key** and **secret**.
2. Dashboard → Video & Audio → Call types → create a call type named **`e2ee`** (copy the `default` settings).
   In its settings set **Encryption → auto-on**.
3. Give the secrets to Firebase:
   ```
   firebase functions:secrets:set STREAM_API_KEY
   firebase functions:secrets:set STREAM_API_SECRET
   ```

## 3. Deploy the backend
```
firebase deploy --only functions,firestore:rules,firestore:indexes,storage
```
This adds `streamToken` (call sign-in) and `weeklyRecap` (Sundays 18:00 London time), and the new rules and indexes.

## 4. iPhone widget
Add your Apple Team ID to `app.json` under `expo.ios`:
```json
"appleTeamId": "XXXXXXXXXX"
```
(Find it at developer.apple.com → Membership.) The App Group `group.com.samuel.adebiyi.TEDnotes` is created automatically by EAS.

## 5. Build new apps
Calls, encryption and widgets use native code, so Expo Go and old APKs won't have them:
```
eas build -p android --profile preview
eas build -p ios
```

## 6. In the app
- Each of you opens Chat → tap the header → **Turn on private chat** and picks a passphrase (8+ characters).
  Keep it safe: it's the only way to read encrypted messages on a new phone.
- Once both of you have it on, the phone and video buttons in Chat work. Compare the safety code in the same sheet once, in person or on a call.
- Add the widget: long-press the home screen → Widgets → TED Space.
