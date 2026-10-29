const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { logger, setGlobalOptions } = require("firebase-functions");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");

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
