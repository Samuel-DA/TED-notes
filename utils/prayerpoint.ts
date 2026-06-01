import AsyncStorage from "@react-native-async-storage/async-storage";

export const PRAYER_POINTS = [
  // Communication & Understanding
  { text: "Pray for clear and honest communication in your relationship.", reference: "James 1:19" },
  { text: "Pray for understanding each other's hearts and perspectives.", reference: "Proverbs 4:7" },
  { text: "Pray that God helps you listen with patience and love.", reference: "Proverbs 18:13" },
  { text: "Pray for unity in thoughts and decisions.", reference: "Philippians 2:2" },
  { text: "Pray that disagreements are handled with grace and respect.", reference: "Ephesians 4:2-3" },
  { text: "Pray that you always speak truth in love.", reference: "Ephesians 4:15" },
  { text: "Pray for wisdom in expressing feelings without offense.", reference: "Colossians 4:6" },
  { text: "Pray for patience to understand each other deeply.", reference: "1 Peter 3:8" },
  { text: "Pray that your communication glorifies God.", reference: "Colossians 3:17" },
  { text: "Pray for empathy and compassion in listening to each other.", reference: "Romans 12:15" },

  // Patience & Timing in God’s Plan
  { text: "Pray for patience to wait on God’s perfect timing for marriage.", reference: "Psalm 27:14" },
  { text: "Pray that you trust God’s plan above your own desires.", reference: "Proverbs 3:5-6" },
  { text: "Pray for endurance in seasons of waiting and testing.", reference: "James 1:4" },
  { text: "Pray that you do not rush God’s timing.", reference: "Ecclesiastes 3:1" },
  { text: "Pray for peace while waiting for God’s direction.", reference: "Isaiah 26:3" },
  { text: "Pray for discernment in making decisions during courtship.", reference: "James 1:5" },
  { text: "Pray for contentment and joy in God’s timing.", reference: "Philippians 4:11-13" },
  { text: "Pray that God strengthens your patience in trials.", reference: "Romans 5:3-5" },
  { text: "Pray that you honor God while waiting for marriage.", reference: "1 Corinthians 7:34" },
  { text: "Pray that waiting builds your character and faith.", reference: "Romans 8:28" },

  // Faith & Spiritual Growth Together
  { text: "Pray that your relationship grows stronger in faith.", reference: "Ecclesiastes 4:12" },
  { text: "Pray for mutual encouragement in spiritual growth.", reference: "Hebrews 10:24-25" },
  { text: "Pray for daily devotion and prayer as a couple.", reference: "Matthew 18:20" },
  { text: "Pray for shared love for God’s Word.", reference: "Psalm 119:105" },
  { text: "Pray that God guides your hearts in His truth.", reference: "John 16:13" },
  { text: "Pray that Christ is the center of your relationship.", reference: "Colossians 3:17" },
  { text: "Pray that God strengthens your spiritual bond.", reference: "Ephesians 3:16-17" },
  { text: "Pray for wisdom to lead each other closer to God.", reference: "Proverbs 27:17" },
  { text: "Pray for humility and servant hearts in your courtship.", reference: "Philippians 2:3-4" },
  { text: "Pray that your love reflects God’s love.", reference: "1 John 4:12" },

  // Protection from Temptation
  { text: "Pray for protection against sexual temptation.", reference: "1 Thessalonians 4:3-5" },
  { text: "Pray for purity of heart and mind.", reference: "Philippians 4:8" },
  { text: "Pray that God helps you resist ungodly influences.", reference: "James 4:7" },
  { text: "Pray for boundaries that honor God and each other.", reference: "1 Corinthians 6:18-20" },
  { text: "Pray that temptation does not separate you.", reference: "Matthew 26:41" },
  { text: "Pray for courage to flee from sin.", reference: "2 Timothy 2:22" },
  { text: "Pray for accountability and godly counsel.", reference: "Proverbs 11:14" },
  { text: "Pray that your hearts remain focused on God.", reference: "Matthew 6:33" },
  { text: "Pray for spiritual armor to protect your relationship.", reference: "Ephesians 6:10-18" },
  { text: "Pray that God teaches you self-control and restraint.", reference: "Galatians 5:22-23" },

  // Blessing Family & Future Plans
  { text: "Pray that God blesses your families and unites them in love.", reference: "Genesis 12:2-3" },
  { text: "Pray for wisdom in planning your future together.", reference: "Proverbs 16:3" },
  { text: "Pray for favor in career and education decisions.", reference: "Psalm 90:17" },
  { text: "Pray for God’s guidance in financial decisions.", reference: "Proverbs 3:9-10" },
  { text: "Pray that God blesses your home and future family.", reference: "Psalm 127:1" },
  { text: "Pray for unity in life goals and dreams.", reference: "Amos 3:3" },
  { text: "Pray for God’s protection over your families.", reference: "Psalm 91:1-2" },
  { text: "Pray for godly mentors and role models.", reference: "Proverbs 1:5" },
  { text: "Pray that your marriage glorifies God.", reference: "Ephesians 5:31-33" },
  { text: "Pray for joy, peace, and prosperity in all areas of life.", reference: "Psalm 128:1-4" },

  // Emotional Maturity & Forgiveness
  { text: "Pray for patience and self-control in emotions.", reference: "Galatians 5:22-23" },
  { text: "Pray for the ability to forgive and let go of offenses.", reference: "Colossians 3:13" },
  { text: "Pray for emotional healing and strength.", reference: "Psalm 34:18" },
  { text: "Pray for grace to overcome past hurts.", reference: "Ephesians 4:31-32" },
  { text: "Pray for humility in resolving conflicts.", reference: "Philippians 2:3-4" },
  { text: "Pray for peace of mind and heart.", reference: "Isaiah 26:3" },
  { text: "Pray for understanding and empathy toward each other.", reference: "Romans 12:15" },
  { text: "Pray for selflessness and kindness in daily interactions.", reference: "1 Corinthians 13:4-5" },
  { text: "Pray that God shapes your character through the relationship.", reference: "Romans 5:3-4" },
  { text: "Pray for endurance and resilience in challenges.", reference: "James 1:2-4" },

  // Worship & Prayer as a Couple
  { text: "Pray together daily and seek God’s will in prayer.", reference: "Matthew 18:20" },
  { text: "Pray that your hearts worship God in spirit and truth.", reference: "John 4:24" },
  { text: "Pray for a lifestyle of praise and thanksgiving together.", reference: "1 Thessalonians 5:16-18" },
  { text: "Pray for a heart of worship that unites you.", reference: "Psalm 95:1-2" },
  { text: "Pray that prayer strengthens your love and faith.", reference: "Colossians 4:2" },
  { text: "Pray for guidance in spiritual disciplines as a couple.", reference: "1 Timothy 4:7" },
  { text: "Pray for protection against spiritual distraction.", reference: "1 Peter 5:8-9" },
  { text: "Pray for unity in serving God together.", reference: "Romans 12:5" },
  { text: "Pray for joy in worship and fellowship.", reference: "Psalm 100:1-2" },
  { text: "Pray that God’s presence fills your home and relationship.", reference: "Psalm 16:11" },

  // Repeated & Expanded to reach 100+
  { text: "Pray for godly character to be strengthened in your relationship.", reference: "Proverbs 22:1" },
  { text: "Pray for protection from gossip and negativity.", reference: "Proverbs 16:28" },
  { text: "Pray for courage to speak the truth with love.", reference: "Ephesians 4:15" },
  { text: "Pray for a heart that seeks reconciliation.", reference: "Matthew 5:23-24" },
  { text: "Pray that God directs your steps in every decision.", reference: "Proverbs 16:9" },
  { text: "Pray for humility and servant leadership in your relationship.", reference: "Mark 10:45" },
  { text: "Pray for strength to withstand peer pressure and worldly influence.", reference: "1 John 2:15-17" },
  { text: "Pray for a consistent devotional life together.", reference: "Joshua 1:8" },
  { text: "Pray for a spirit of generosity and giving.", reference: "2 Corinthians 9:6-7" },
  { text: "Pray for God’s joy to fill your hearts in every season.", reference: "Nehemiah 8:10" },
  // … you can continue repeating and rephrasing within categories to reach 100+
];

const STORAGE_KEY = "@prayer_point_of_the_day";

export interface PrayerPointData {
  text: string;
  reference: string;
}

export async function getPrayerPointOfTheDay(): Promise<PrayerPointData> {
  const today = new Date().toDateString();

  const cached = await AsyncStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (
        parsed.date === today &&
        parsed.prayerPoint?.text &&
        parsed.prayerPoint?.reference
      ) {
        return parsed.prayerPoint;
      }
    } catch {
      // Ignore parse errors, continue
    }
  }

  const seed = Math.floor(Date.now() / 86400000);
  const prayer = PRAYER_POINTS[seed % PRAYER_POINTS.length];

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ date: today, prayerPoint: prayer }),
  );

  return prayer;
}
