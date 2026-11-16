import SwiftUI
import WidgetKit

private let appGroup = "group.com.samuel.adebiyi.TEDnotes"

/// Mirrors `WidgetSnapshot` in services/widget.ts.
struct Snapshot: Codable {
  var partnerName: String
  var partnerMood: String
  var streak: Int
  var best: Int
  var reunionDays: Int?
  var question: String
  var meCheckedIn: Bool
  var partnerCheckedIn: Bool
  var updatedAt: Double

  static func load() -> Snapshot? {
    guard let raw = UserDefaults(suiteName: appGroup)?.string(forKey: "snapshot"),
          let data = raw.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(Snapshot.self, from: data)
  }

  static let preview = Snapshot(partnerName: "Tolu", partnerMood: "😊", streak: 12, best: 30, reunionDays: 9,
                                question: "answer", meCheckedIn: true, partnerCheckedIn: false, updatedAt: 0)

  var questionLine: String {
    switch question {
    case "pick": return "Today's question is waiting for you"
    case "answer": return "\(partnerName) answered. Your turn"
    case "waiting": return "Waiting for \(partnerName) to answer"
    default: return "Today's answers are revealed ✨"
    }
  }

  var checkInLine: String {
    if meCheckedIn && partnerCheckedIn { return "You both checked in 💞" }
    if meCheckedIn { return "Waiting for \(partnerName)'s check-in" }
    return "Tap to check in today"
  }
}

struct Entry: TimelineEntry {
  let date: Date
  let snapshot: Snapshot?
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> Entry { Entry(date: .now, snapshot: .preview) }
  func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
    completion(Entry(date: .now, snapshot: context.isPreview ? .preview : Snapshot.load() ?? .preview))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    // The app reloads the widget whenever something changes; refresh every 30 min as a fallback.
    let next = Calendar.current.date(byAdding: .minute, value: 30, to: .now) ?? .now
    completion(Timeline(entries: [Entry(date: .now, snapshot: Snapshot.load())], policy: .after(next)))
  }
}

struct TedSpaceWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: Entry

  var body: some View {
    Group {
      if let s = entry.snapshot {
        if family == .systemSmall { small(s) } else { medium(s) }
      } else {
        VStack(alignment: .leading, spacing: 4) {
          Text("TED SPACE").font(.system(size: 10, weight: .heavy)).foregroundStyle(.white.opacity(0.8))
          Text("Open TED Space to sign in").font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
      }
    }
    .containerBackground(for: .widget) {
      LinearGradient(colors: [Color("gradientStart"), Color("gradientEnd")], startPoint: .topLeading, endPoint: .bottomTrailing)
    }
    .widgetURL(URL(string: "tednotes://"))
  }

  func small(_ s: Snapshot) -> some View {
    VStack(alignment: .leading, spacing: 2) {
      Text("TED SPACE").font(.system(size: 10, weight: .heavy)).foregroundStyle(.white.opacity(0.8))
      Text("\(s.partnerName) \(s.partnerMood)").font(.system(size: 17, weight: .heavy)).foregroundStyle(.white).lineLimit(1)
      Spacer(minLength: 4)
      Text("🔥 \(s.streak)").font(.system(size: 30, weight: .heavy)).foregroundStyle(.white)
      Text("Best \(max(s.best, s.streak))").font(.system(size: 11, weight: .bold)).foregroundStyle(.white.opacity(0.8))
      Text(s.checkInLine).font(.system(size: 11)).foregroundStyle(.white).lineLimit(2).padding(.top, 2)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  func medium(_ s: Snapshot) -> some View {
    HStack(spacing: 12) {
      VStack(alignment: .leading, spacing: 3) {
        Text("TED SPACE").font(.system(size: 10, weight: .heavy)).foregroundStyle(.white.opacity(0.8))
        Text("\(s.partnerName) \(s.partnerMood)").font(.system(size: 19, weight: .heavy)).foregroundStyle(.white).lineLimit(1)
        Spacer(minLength: 2)
        Text(s.checkInLine).font(.system(size: 13, weight: .semibold)).foregroundStyle(.white).lineLimit(1)
        Text(s.questionLine).font(.system(size: 12.5)).foregroundStyle(.white.opacity(0.85)).lineLimit(1)
        if let days = s.reunionDays {
          Text(days <= 0 ? "Together today 🫶" : "\(days) day\(days == 1 ? "" : "s") until you're together")
            .font(.system(size: 12.5)).foregroundStyle(.white.opacity(0.85)).lineLimit(1)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      VStack(spacing: 2) {
        Text("🔥 \(s.streak)").font(.system(size: 24, weight: .heavy)).foregroundStyle(.white)
        Text("Best \(max(s.best, s.streak))").font(.system(size: 11, weight: .bold)).foregroundStyle(.white.opacity(0.8))
      }
      .frame(width: 84, height: 84)
      .background(.white.opacity(0.18), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
    }
  }
}

struct TedSpaceWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "TedSpaceWidget", provider: Provider()) { entry in
      TedSpaceWidgetView(entry: entry)
    }
    .configurationDisplayName("TED Space")
    .description("Your streak, check-ins and today's question at a glance.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
