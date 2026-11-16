// widgets/TedSpaceWidget.tsx — Android home-screen widget (react-native-android-widget).
import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { WidgetSnapshot } from "@/services/widget";

const WHITE = "#FFFFFF" as const;
const SOFT = "rgba(255, 255, 255, 0.78)" as const;

export function questionLine(q: WidgetSnapshot["question"], partner: string) {
  if (q === "pick") return "Today's question is waiting for you";
  if (q === "answer") return `${partner} answered. Your turn`;
  if (q === "waiting") return `Waiting for ${partner} to answer`;
  return "Today's answers are revealed ✨";
}

export function TedSpaceWidget({ data }: { data: WidgetSnapshot | null }) {
  const partner = data?.partnerName || "your person";
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 24,
        backgroundGradient: { from: "#E0567A", to: "#6B3488", orientation: "TL_BR" },
      }}
    >
      <FlexWidget style={{ flex: 1, flexDirection: "column", justifyContent: "center" }}>
        <TextWidget text="TED SPACE" style={{ fontSize: 10, color: SOFT, fontWeight: "800", letterSpacing: 0.12 }} />
        {data ? (
          <>
            <TextWidget text={`${partner} ${data.partnerMood || ""}`.trim()} maxLines={1} truncate="END" style={{ fontSize: 18, color: WHITE, fontWeight: "800", marginTop: 2 }} />
            <TextWidget
              text={data.meCheckedIn && data.partnerCheckedIn ? "You both checked in today 💞" : data.meCheckedIn ? `Waiting for ${partner}'s check-in` : "Tap to check in today"}
              maxLines={1}
              truncate="END"
              style={{ fontSize: 12.5, color: WHITE, marginTop: 6 }}
            />
            <TextWidget text={questionLine(data.question, partner)} maxLines={1} truncate="END" style={{ fontSize: 12.5, color: SOFT, marginTop: 2 }} />
            {data.reunionDays !== null && (
              <TextWidget text={data.reunionDays <= 0 ? "Together today 🫶" : `${data.reunionDays} day${data.reunionDays === 1 ? "" : "s"} until you're together`} maxLines={1} style={{ fontSize: 12.5, color: SOFT, marginTop: 2 }} />
            )}
          </>
        ) : (
          <TextWidget text="Open TED Space to sign in" style={{ fontSize: 15, color: WHITE, fontWeight: "700", marginTop: 4 }} />
        )}
      </FlexWidget>
      {data && (
        <FlexWidget style={{ width: 78, height: 78, borderRadius: 22, backgroundColor: "rgba(255, 255, 255, 0.18)", alignItems: "center", justifyContent: "center", marginLeft: 10 }}>
          <TextWidget text={`🔥 ${data.streak}`} style={{ fontSize: 20, color: WHITE, fontWeight: "800" }} />
          <TextWidget text={`Best ${Math.max(data.best, data.streak)}`} style={{ fontSize: 10.5, color: SOFT, marginTop: 2, fontWeight: "700" }} />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}

export const renderTedSpaceWidget = (data: WidgetSnapshot | null) => <TedSpaceWidget data={data} />;
