const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { logger, setGlobalOptions } = require("firebase-functions");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const crypto = require("crypto");

// Stream Video credentials. Set with:
//   firebase functions:secrets:set STREAM_API_KEY
//   firebase functions:secrets:set STREAM_API_SECRET
const STREAM_API_KEY = defineSecret("STREAM_API_KEY");
const STREAM_API_SECRET = defineSecret("STREAM_API_SECRET");

initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 2 });

const db = getFirestore();
const EXPO_SEND_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";
const VALID_ROUTES = new Set([
  "home",
  "chat",
  "plans",
  "care",
  "care_support",
  "care_dates",
  "care_period",
  "care_routine",
  "care_voice",
  "games",
  "recap",
  "memories",
]);

function isExpoPushToken(value) {
  return typeof value === "string"
    && /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(value);
}

async function expoPost(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body) {
    throw new Error(`Expo push request failed (${response.status})`);
  }
  return body;
}

async function removeInvalidToken(entry) {
  if (entry.tokenPath) {
    await db.doc(entry.tokenPath).delete().catch((error) => {
      logger.warn("Could not delete invalid push token", {
        tokenPath: entry.tokenPath,
        error: error.message,
      });
    });
    return;
  }

  if (!entry.legacyUid) return;
  const userRef = db.doc(`users/${entry.legacyUid}`);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    if (snapshot.data()?.expoPushToken === entry.token) {
      transaction.update(userRef, { expoPushToken: FieldValue.delete() });
    }
  }).catch((error) => {
    logger.warn("Could not remove legacy invalid push token", {
      uid: entry.legacyUid,
      error: error.message,
    });
  });
}

async function getRecipientDelivery(uid) {
  const userRef = db.doc(`users/${uid}`);
  const [tokensSnapshot, userSnapshot] = await Promise.all([
    userRef.collection("pushTokens").get(),
    userRef.get(),
  ]);
  const byToken = new Map();

  for (const tokenDoc of tokensSnapshot.docs) {
    const token = tokenDoc.data().token;
    if (isExpoPushToken(token)) {
      byToken.set(token, { token, tokenPath: tokenDoc.ref.path });
    }
  }

  const legacyToken = userSnapshot.data()?.expoPushToken;
  if (isExpoPushToken(legacyToken) && !byToken.has(legacyToken)) {
    byToken.set(legacyToken, { token: legacyToken, legacyUid: uid });
  }

  return {
    tokens: [...byToken.values()],
    showPreview: userSnapshot.data()?.notificationPreview !== false,
  };
}

async function processReceiptDocument(receiptDocument) {
  const data = receiptDocument.data();
  const tickets = Array.isArray(data.tickets) ? data.tickets : [];
  if (tickets.length === 0) {
    await receiptDocument.ref.delete();
    return;
  }

  const response = await expoPost(EXPO_RECEIPTS_URL, {
    ids: tickets.map((ticket) => ticket.id),
  });
  const receipts = response.data ?? {};
  let delivered = 0;
  let failed = 0;
  const errors = [];

  for (const ticket of tickets) {
    const receipt = receipts[ticket.id];
    if (!receipt) continue;
    if (receipt.status === "ok") {
      delivered += 1;
      continue;
    }

    failed += 1;
    const code = receipt.details?.error ?? receipt.message ?? "UnknownReceiptError";
    errors.push(code);
    if (code === "DeviceNotRegistered") {
      await removeInvalidToken(ticket);
    }
  }

  if (delivered + failed < tickets.length) {
    await receiptDocument.ref.update({
      checkAfter: Timestamp.fromMillis(Date.now() + 15 * 60 * 1000),
      attempts: FieldValue.increment(1),
    });
    return;
  }

  if (data.eventPath) {
    await db.doc(data.eventPath).set({
      status: failed === 0 ? "delivered" : delivered > 0 ? "partially_delivered" : "failed",
      receiptStatus: "checked",
      receiptCheckedAt: FieldValue.serverTimestamp(),
      deliveredCount: delivered,
      failedCount: failed,
      receiptErrors: [...new Set(errors)].slice(0, 10),
    }, { merge: true });
  }
  await receiptDocument.ref.delete();
}

exports.deliverPartnerNotification = onDocumentCreated({
  document: "pairs/{pairId}/notificationEvents/{eventId}",
  region: "us-central1",
  memory: "256MiB",
  timeoutSeconds: 60,
  minInstances: 0,
  maxInstances: 2,
  retry: false,
}, async (event) => {
  const eventSnapshot = event.data;
  if (!eventSnapshot) return;

  const notification = eventSnapshot.data();
  const { pairId, eventId } = event.params;
  const eventRef = eventSnapshot.ref;
  // System events (e.g. the weekly recap) are delivered by their own function.
  if (notification.system === true) return;

  try {
    if (
      typeof notification.actorUid !== "string"
      || typeof notification.title !== "string"
      || typeof notification.body !== "string"
      || typeof notification.action !== "string"
      || !VALID_ROUTES.has(notification.route)
    ) {
      await eventRef.set({
        status: "rejected",
        processedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return;
    }

    const pairSnapshot = await db.doc(`pairs/${pairId}`).get();
    const members = pairSnapshot.data()?.members;
    if (!Array.isArray(members) || !members.includes(notification.actorUid)) {
      await eventRef.set({
        status: "rejected",
        processedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return;
    }

    const recipientUid = members.find((uid) => uid !== notification.actorUid);
    if (!recipientUid) {
      await eventRef.set({
        status: "no_recipient",
        processedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return;
    }

    const delivery = await getRecipientDelivery(recipientUid);
    const tokenEntries = delivery.tokens;
    if (tokenEntries.length === 0) {
      await eventRef.set({
        status: "no_tokens",
        recipientUid,
        processedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return;
    }

    const messages = tokenEntries.map(({ token }) => ({
      to: token,
      sound: "default",
      badge: 1,
      title: delivery.showPreview ? notification.title.slice(0, 100) : "TED Space",
      body: delivery.showPreview ? notification.body.slice(0, 500) : "You have a new private update from your partner.",
      channelId: "default",
      priority: "high",
      data: {
        route: notification.route,
        action: notification.action,
        pairId,
        eventId,
      },
    }));
    const response = await expoPost(EXPO_SEND_URL, messages);
    const tickets = Array.isArray(response.data) ? response.data : [response.data];
    const receiptTickets = [];
    const ticketErrors = [];

    for (let index = 0; index < tickets.length; index += 1) {
      const ticket = tickets[index];
      const tokenEntry = tokenEntries[index];
      if (ticket?.status === "ok" && ticket.id) {
        receiptTickets.push({ id: ticket.id, ...tokenEntry });
        continue;
      }

      const code = ticket?.details?.error ?? ticket?.message ?? "UnknownTicketError";
      ticketErrors.push(code);
      if (code === "DeviceNotRegistered") {
        await removeInvalidToken(tokenEntry);
      }
    }

    if (receiptTickets.length > 0) {
      await db.collection("pushReceipts").doc(eventId).set({
        eventPath: eventRef.path,
        tickets: receiptTickets,
        checkAfter: Timestamp.fromMillis(Date.now() + 15 * 60 * 1000),
        attempts: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await eventRef.set({
      status: receiptTickets.length > 0
        ? ticketErrors.length > 0 ? "partially_queued" : "queued"
        : "failed",
      recipientUid,
      queuedCount: receiptTickets.length,
      failedCount: ticketErrors.length,
      ticketErrors: [...new Set(ticketErrors)].slice(0, 10),
      receiptStatus: receiptTickets.length > 0 ? "pending" : "none",
      processedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    logger.error("Partner notification delivery failed", {
      pairId,
      eventId,
      error: error.message,
    });
    await eventRef.set({
      status: "failed",
      failureReason: String(error.message ?? error).slice(0, 500),
      processedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
});

exports.checkExpoPushReceipts = onSchedule({
  schedule: "every 15 minutes",
  region: "us-central1",
  memory: "256MiB",
  timeoutSeconds: 60,
  minInstances: 0,
  maxInstances: 1,
  retryCount: 0,
}, async () => {
  const snapshot = await db.collection("pushReceipts")
    .where("checkAfter", "<=", Timestamp.now())
    .limit(100)
    .get();

  for (const receiptDocument of snapshot.docs) {
    try {
      await processReceiptDocument(receiptDocument);
    } catch (error) {
      logger.error("Expo receipt check failed", {
        receiptId: receiptDocument.id,
        error: error.message,
      });
      await receiptDocument.ref.update({
        checkAfter: Timestamp.fromMillis(Date.now() + 15 * 60 * 1000),
        attempts: FieldValue.increment(1),
        lastError: String(error.message ?? error).slice(0, 500),
      });
    }
  }
});


/* -------------------------------------------------------------------------- */
/* Calls: short-lived Stream Video user tokens for verified pair members.      */
/* -------------------------------------------------------------------------- */

function base64Url(input) {
  return Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function signStreamToken(userId, secret, ttlSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ user_id: userId, iat: now - 30, exp: now + ttlSeconds }));
  const signature = base64Url(crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${signature}`;
}

exports.streamToken = onCall({
  region: "us-central1",
  memory: "256MiB",
  maxInstances: 2,
  secrets: [STREAM_API_KEY, STREAM_API_SECRET],
}, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in to make calls.");
  const user = (await db.doc(`users/${uid}`).get()).data();
  const pairId = user?.pairId;
  if (typeof pairId !== "string") throw new HttpsError("failed-precondition", "Pair with your partner first.");
  const members = (await db.doc(`pairs/${pairId}`).get()).data()?.members;
  if (!Array.isArray(members) || !members.includes(uid) || members.length !== 2) {
    throw new HttpsError("permission-denied", "Calls are only available once you're paired.");
  }
  return {
    apiKey: STREAM_API_KEY.value(),
    token: signStreamToken(uid, STREAM_API_SECRET.value(), 6 * 60 * 60),
    userId: uid,
    name: typeof user?.name === "string" ? user.name : "TED Space",
  };
});

/* -------------------------------------------------------------------------- */
/* Weekly recap: every Sunday evening, summarise each couple's week.           */
/* -------------------------------------------------------------------------- */

const RECAP_TIME_ZONE = "Europe/London";
const londonDateKey = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: RECAP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

function lastSevenDayKeys(now) {
  const keys = [];
  for (let offset = 6; offset >= 0; offset -= 1) keys.push(londonDateKey(new Date(now.getTime() - offset * 86400000)));
  return keys;
}

function bothIn(list, members) {
  return Array.isArray(list) && members.every((uid) => list.includes(uid));
}

function currentStreak(history, members, todayKey) {
  let streak = 0;
  const cursor = new Date(`${todayKey}T12:00:00Z`);
  if (!bothIn(history[todayKey]?.checkInUsers, members)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  for (let i = 0; i < 3660; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (!bothIn(history[key]?.checkInUsers, members)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

async function countSince(query) {
  try {
    const snapshot = await query.count().get();
    return snapshot.data().count;
  } catch (error) {
    logger.warn("Recap count failed", { error: error.message });
    return 0;
  }
}

async function sendPushToUser(uid, { title, body, data }) {
  const delivery = await getRecipientDelivery(uid);
  if (!delivery.tokens.length) return 0;
  const messages = delivery.tokens.map(({ token }) => ({
    to: token, sound: "default", title, body, channelId: "default", priority: "high", data,
  }));
  const response = await expoPost(EXPO_SEND_URL, messages);
  const tickets = Array.isArray(response.data) ? response.data : [response.data];
  for (let index = 0; index < tickets.length; index += 1) {
    if (tickets[index]?.details?.error === "DeviceNotRegistered") await removeInvalidToken(delivery.tokens[index]);
  }
  return tickets.filter((ticket) => ticket?.status === "ok").length;
}

async function buildRecap(pairRef, pair, now) {
  const members = pair.members;
  const keys = lastSevenDayKeys(now);
  const weekStart = keys[0];
  const weekEnd = keys[6];
  const startTs = Timestamp.fromMillis(now.getTime() - 7 * 86400000);
  const history = pair.dailyConfirmations || {};

  let checkInDays = 0;
  let prayedTogether = 0;
  let questionsAnswered = 0;
  const questionHighlights = [];
  for (const key of keys) {
    const day = history[key] || {};
    if (bothIn(day.checkInUsers, members)) checkInDays += 1;
    if (bothIn(day.prayedUsers, members)) prayedTogether += 1;
    const answers = day.questionAnswers || {};
    if (members.every((uid) => typeof answers[uid] === "string" && answers[uid].length > 0)) {
      questionsAnswered += 1;
      if (day.question?.text) questionHighlights.push(day.question.text);
    }
  }

  const [messages, outfits, plansDone, voiceNotes] = await Promise.all([
    countSince(pairRef.collection("messages").where("createdAt", ">=", startTs)),
    countSince(pairRef.collection("proofOfLife").where("date", ">=", weekStart)),
    countSince(pairRef.collection("todos").where("completedAt", ">=", startTs)),
    countSince(pairRef.collection("voiceCapsules").where("createdAt", ">=", startTs)),
  ]);

  return {
    weekStart,
    weekEnd,
    checkInDays,
    prayedTogether,
    questionsAnswered,
    questionHighlight: questionHighlights[questionHighlights.length - 1] || null,
    messages,
    outfits,
    plansDone,
    voiceNotes,
    streak: currentStreak(history, members, weekEnd),
    createdAt: FieldValue.serverTimestamp(),
  };
}

function recapSummary(recap) {
  const parts = [`${recap.checkInDays}/7 check-ins`];
  if (recap.messages) parts.push(`${recap.messages} messages`);
  if (recap.questionsAnswered) parts.push(`${recap.questionsAnswered} questions answered`);
  if (recap.outfits) parts.push(`${recap.outfits} outfits`);
  if (recap.plansDone) parts.push(`${recap.plansDone} plans done`);
  return parts.slice(0, 4).join(" · ");
}

exports.weeklyRecap = onSchedule({
  schedule: "0 18 * * 0",
  timeZone: RECAP_TIME_ZONE,
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 300,
  maxInstances: 1,
  retryCount: 0,
}, async () => {
  const now = new Date();
  const pairs = await db.collection("pairs").get();
  for (const pairDoc of pairs.docs) {
    const pair = pairDoc.data();
    if (!Array.isArray(pair.members) || pair.members.length !== 2) continue;
    try {
      const recap = await buildRecap(pairDoc.ref, pair, now);
      await pairDoc.ref.collection("recaps").doc(recap.weekEnd).set(recap);
      const body = `${recapSummary(recap)}. Tap to see your week.`;
      await pairDoc.ref.collection("notificationEvents").add({
        system: true, actorUid: "ted-space", title: "Your week together 💞", body, route: "recap", action: "weekly_recap",
        readBy: [], createdAt: FieldValue.serverTimestamp(),
      });
      for (const uid of pair.members) {
        await sendPushToUser(uid, { title: "Your week together 💞", body, data: { route: "recap", action: "weekly_recap", pairId: pairDoc.id } });
      }
    } catch (error) {
      logger.error("Weekly recap failed", { pairId: pairDoc.id, error: error.message });
    }
  }
});
