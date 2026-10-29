import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";

const PROJECT_ID = "demo-ted-notes";
let env: RulesTestEnvironment;

const user = (uid: string) => env.authenticatedContext(uid).firestore();
const files = (uid: string) => env.authenticatedContext(uid).storage(`gs://${PROJECT_ID}.appspot.com`);

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users", "alice"), {
      uid: "alice",
      name: "Alice",
      email: "alice@example.test",
      pairId: "pair-one",
      createdAt: new Date(),
    });
    await setDoc(doc(db, "users", "bob"), {
      uid: "bob",
      name: "Bob",
      email: "bob@example.test",
      pairId: "pair-one",
      createdAt: new Date(),
    });
    await setDoc(doc(db, "users", "eve"), {
      uid: "eve",
      name: "Eve",
      email: "eve@example.test",
      pairId: null,
      createdAt: new Date(),
    });
    await setDoc(doc(db, "pairs", "pair-one"), {
      members: ["alice", "bob"],
      names: { alice: "Alice", bob: "Bob" },
      createdAt: new Date(),
    });
    await setDoc(doc(db, "pairs", "open-invite"), {
      members: ["alice"],
      names: { alice: "Alice" },
      createdAt: new Date(),
    });
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("user privacy", () => {
  test("owners and partners can read a profile, outsiders cannot", async () => {
    await assertSucceeds(getDoc(doc(user("alice"), "users", "alice")));
    await assertSucceeds(getDoc(doc(user("alice"), "users", "bob")));
    await assertFails(getDoc(doc(user("eve"), "users", "bob")));
  });

  test("user collection scans are denied", async () => {
    await assertFails(getDocs(collection(user("alice"), "users")));
  });

  test("users manage only their own device tokens", async () => {
    const token = { token: "ExponentPushToken[test-device-token]", platform: "ios", projectId: "test-project", updatedAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(user("alice"), "users", "alice", "pushTokens", "device-one"), token));
    await assertFails(setDoc(doc(user("bob"), "users", "alice", "pushTokens", "forged"), token));
  });

  test("users control only their own notification preview preference", async () => {
    await assertSucceeds(updateDoc(doc(user("alice"), "users", "alice"), { notificationPreview: false, settingsUpdatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(user("bob"), "users", "alice"), { notificationPreview: true, settingsUpdatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(user("alice"), "users", "alice"), { notificationPreview: "hidden", settingsUpdatedAt: serverTimestamp() }));
  });
});

describe("pair membership", () => {
  test("a user can create and link a pair atomically", async () => {
    const eveDb = user("eve");
    const batch = writeBatch(eveDb);
    batch.set(doc(eveDb, "pairs", "new-secure-id"), {
      members: ["eve"],
      names: { eve: "Eve" },
      createdAt: serverTimestamp(),
    });
    batch.update(doc(eveDb, "users", "eve"), { pairId: "new-secure-id" });
    await assertSucceeds(batch.commit());
  });

  test("members cannot remove or replace pair members", async () => {
    await assertFails(
      updateDoc(doc(user("alice"), "pairs", "pair-one"), {
        members: ["alice"],
      }),
    );
  });

  test("a known open invite can be read and joined once", async () => {
    const eveDb = user("eve");
    await assertSucceeds(getDoc(doc(eveDb, "pairs", "open-invite")));
    await assertSucceeds(
      runTransaction(eveDb, async (transaction) => {
        const pairRef = doc(eveDb, "pairs", "open-invite");
        await transaction.get(pairRef);
        transaction.update(pairRef, {
          members: ["alice", "eve"],
          names: { alice: "Alice", eve: "Eve" },
        });
        transaction.update(doc(eveDb, "users", "eve"), {
          pairId: "open-invite",
        });
      }),
    );
  });

  test("pair collection scans are denied", async () => {
    await assertFails(getDocs(collection(user("alice"), "pairs")));
  });
});

describe("pair data isolation", () => {
  test("members can update daily state and outsiders cannot", async () => {
    await assertSucceeds(
      updateDoc(doc(user("alice"), "pairs", "pair-one"), {
        "moods.alice": "😊",
      }),
    );
    await assertFails(
      updateDoc(doc(user("eve"), "pairs", "pair-one"), {
        "moods.eve": "👀",
      }),
    );
  });

  test("care needs and OTISH are visible to partners but owner-editable only", async () => {
    const profile = {
      ownerUid: "alice",
      needs: [{ id: "gift", text: "A book", createdAt: Date.now() }],
      otish: { value: 7, updatedAt: serverTimestamp() },
      updatedAt: serverTimestamp(),
    };
    await assertSucceeds(setDoc(doc(user("alice"), "pairs", "pair-one", "careProfiles", "alice"), profile));
    await assertSucceeds(getDoc(doc(user("bob"), "pairs", "pair-one", "careProfiles", "alice")));
    await assertFails(setDoc(doc(user("bob"), "pairs", "pair-one", "careProfiles", "alice"), { ...profile, needs: [] }));
    await assertFails(setDoc(doc(user("alice"), "pairs", "pair-one", "careProfiles", "alice"), { ...profile, otish: { value: 11, updatedAt: serverTimestamp() } }));
  });

  test("important dates are isolated to pair members", async () => {
    const validDate = { title: "Hospital appointment", dateAt: Date.now(), note: "Call after", createdBy: "alice", createdAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(user("alice"), "pairs", "pair-one", "careDates", "date-one"), validDate));
    await assertFails(setDoc(doc(user("eve"), "pairs", "pair-one", "careDates", "date-two"), { ...validDate, createdBy: "eve" }));
  });

  test("period tracker is shared only within the pair", async () => {
    const tracker = { lastPeriodStart: "2026-10-01", cycleLength: 28, periodLength: 5, periodDays: ["2026-10-01", "2026-10-02"], dailyLogs: { "2026-10-01": { flow: "Medium", symptoms: ["Cramps"], mood: "😌", note: "" } }, updatedBy: "alice", updatedByName: "Alice", updatedAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(user("alice"), "pairs", "pair-one", "periodTracker", "shared"), tracker));
    await assertSucceeds(getDoc(doc(user("bob"), "pairs", "pair-one", "periodTracker", "shared")));
    await assertFails(setDoc(doc(user("eve"), "pairs", "pair-one", "periodTracker", "shared"), { ...tracker, updatedBy: "eve", updatedByName: "Eve" }));
  });

  test("daily routines are visible to partners but editable only by their owner", async () => {
    const routine = {
      ownerUid: "alice",
      items: [{ id: "water", text: "Drink water" }],
      completions: { "2026-10-16": ["water"] },
      updatedAt: serverTimestamp(),
    };
    const routineRef = doc(user("alice"), "pairs", "pair-one", "routines", "alice");
    await assertSucceeds(setDoc(routineRef, routine));
    await assertSucceeds(getDoc(doc(user("bob"), "pairs", "pair-one", "routines", "alice")));
    await assertFails(setDoc(doc(user("bob"), "pairs", "pair-one", "routines", "alice"), { ...routine, items: [] }));
    await assertFails(setDoc(doc(user("eve"), "pairs", "pair-one", "routines", "eve"), { ...routine, ownerUid: "eve" }));
  });

  test("voice capsule metadata is pair-only and sender-bound", async () => {
    const capsule = { storagePath: "pairs/pair-one/voiceCapsules/alice/capsule-one.m4a", senderId: "alice", senderName: "Alice", durationMs: 12000, createdAt: serverTimestamp(), expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) };
    await assertSucceeds(setDoc(doc(user("alice"), "pairs", "pair-one", "voiceCapsules", "capsule-one"), capsule));
    await assertSucceeds(getDoc(doc(user("bob"), "pairs", "pair-one", "voiceCapsules", "capsule-one")));
    await assertFails(setDoc(doc(user("bob"), "pairs", "pair-one", "voiceCapsules", "forged"), { ...capsule, senderId: "alice", storagePath: "pairs/pair-one/voiceCapsules/alice/forged.m4a" }));
    await assertFails(setDoc(doc(user("alice"), "pairs", "pair-one", "voiceCapsules", "too-long"), { ...capsule, durationMs: 60001, storagePath: "pairs/pair-one/voiceCapsules/alice/too-long.m4a" }));
    await assertFails(setDoc(doc(user("alice"), "pairs", "pair-one", "voiceCapsules", "too-late"), { ...capsule, expiresAt: new Date(Date.now() + 92 * 24 * 60 * 60 * 1000), storagePath: "pairs/pair-one/voiceCapsules/alice/too-late.m4a" }));
  });

  test("notification events are sender-bound and server-owned after creation", async () => {
    const event = { actorUid: "alice", title: "Hello", body: "A shared update", route: "home", action: "test_event", readBy: ["alice"], createdAt: serverTimestamp() };
    const eventRef = doc(user("alice"), "pairs", "pair-one", "notificationEvents", "event-one");
    await assertSucceeds(setDoc(eventRef, event));
    await assertFails(updateDoc(eventRef, { status: "sent" }));
    await assertSucceeds(updateDoc(doc(user("bob"), "pairs", "pair-one", "notificationEvents", "event-one"), { readBy: ["alice", "bob"] }));
    await assertSucceeds(updateDoc(doc(user("bob"), "pairs", "pair-one", "notificationEvents", "event-one"), { clearedBy: ["bob"] }));
    await assertFails(updateDoc(doc(user("bob"), "pairs", "pair-one", "notificationEvents", "event-one"), { clearedBy: ["alice", "bob"] }));
    await assertFails(setDoc(doc(user("bob"), "pairs", "pair-one", "notificationEvents", "forged"), { ...event, actorUid: "alice" }));
    await assertFails(setDoc(doc(user("eve"), "pairs", "pair-one", "notificationEvents", "outside"), { ...event, actorUid: "eve" }));
  });

  test("messages reject outsiders and forged sender IDs", async () => {
    const validMessage = {
      text: "Hello",
      type: "text",
      senderId: "alice",
      createdAt: serverTimestamp(),
      localCreatedAt: Date.now(),
      readBy: ["alice"],
    };

    await assertSucceeds(
      setDoc(doc(user("alice"), "pairs", "pair-one", "messages", "valid"), validMessage),
    );
    await assertFails(
      setDoc(doc(user("eve"), "pairs", "pair-one", "messages", "outside"), {
        ...validMessage,
        senderId: "eve",
        readBy: ["eve"],
      }),
    );
    await assertFails(
      setDoc(doc(user("alice"), "pairs", "pair-one", "messages", "forged"), {
        ...validMessage,
        senderId: "bob",
        readBy: ["bob"],
      }),
    );
  });

  test("a user can only add their own receipt and reaction", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pairs", "pair-one", "messages", "receipt"), {
        text: "Hello",
        type: "text",
        senderId: "alice",
        createdAt: new Date(),
        localCreatedAt: Date.now(),
        readBy: ["alice"],
      });
    });

    await assertSucceeds(
      updateDoc(doc(user("bob"), "pairs", "pair-one", "messages", "receipt"), {
        readBy: ["alice", "bob"],
      }),
    );
    await assertFails(
      updateDoc(doc(user("alice"), "pairs", "pair-one", "messages", "receipt"), {
        readBy: ["alice"],
      }),
    );
    await assertFails(
      updateDoc(doc(user("alice"), "pairs", "pair-one", "messages", "receipt"), {
        "reactions.bob": "😂",
      }),
    );
    await assertSucceeds(
      updateDoc(doc(user("alice"), "pairs", "pair-one", "messages", "receipt"), {
        "reactions.alice": "❤️",
      }),
    );
  });

  test("message senders can edit and soft-delete only their own message", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pairs", "pair-one", "messages", "editable"), {
        text: "Original",
        type: "text",
        senderId: "alice",
        createdAt: new Date(),
        localCreatedAt: Date.now(),
        readBy: ["alice"],
      });
    });
    const aliceMessage = doc(user("alice"), "pairs", "pair-one", "messages", "editable");
    const bobMessage = doc(user("bob"), "pairs", "pair-one", "messages", "editable");
    await assertSucceeds(updateDoc(aliceMessage, { text: "Edited", editedAt: serverTimestamp() }));
    await assertFails(updateDoc(bobMessage, { text: "Forged", editedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(aliceMessage, { text: "", deletedAt: serverTimestamp() }));
    await assertFails(updateDoc(aliceMessage, { text: "Restored", editedAt: serverTimestamp() }));
  });

  test("scoreboard writes cannot change a partner's score", async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pairs", "pair-one", "scoreboard", "global"), {
        alice: 2,
        bob: 3,
        updatedAt: Date.now(),
      });
    });

    await assertSucceeds(
      updateDoc(doc(user("alice"), "pairs", "pair-one", "scoreboard", "global"), {
        alice: 3,
        updatedAt: Date.now(),
      }),
    );
    await assertFails(
      updateDoc(doc(user("alice"), "pairs", "pair-one", "scoreboard", "global"), {
        bob: 99,
        updatedAt: Date.now(),
      }),
    );
  });

  test("a game may create the current user's first point but not an arbitrary score", async () => {
    await assertSucceeds(setDoc(doc(user("alice"), "pairs", "pair-one", "scoreboard", "fresh"), {
      alice: 1,
      updatedAt: Date.now(),
    }));
    await assertFails(setDoc(doc(user("bob"), "pairs", "pair-one", "scoreboard", "forged-score"), {
      bob: 50,
      updatedAt: Date.now(),
    }));
  });
});

describe("voice capsule files", () => {
  test("pair members can upload audio only to their own path", async () => {
    const validPath = "pairs/pair-one/voiceCapsules/alice/capsule-one.m4a";
    await assertSucceeds(Promise.resolve(files("alice").ref(validPath).put(new Uint8Array([1, 2, 3]), { contentType: "audio/mp4" })));
    await assertSucceeds(files("bob").ref(validPath).getDownloadURL());
    await assertFails(Promise.resolve(files("bob").ref("pairs/pair-one/voiceCapsules/alice/forged.m4a").put(new Uint8Array([1]), { contentType: "audio/mp4" })));
    await assertFails(Promise.resolve(files("eve").ref("pairs/pair-one/voiceCapsules/eve/outside.m4a").put(new Uint8Array([1]), { contentType: "audio/mp4" })));
    await assertFails(Promise.resolve(files("alice").ref("pairs/pair-one/voiceCapsules/alice/not-audio.m4a").put(new Uint8Array([1]), { contentType: "text/plain" })));
  });
});
