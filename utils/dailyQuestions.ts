// utils/dailyQuestions.ts

export interface QuestionData {
  id: number;
  question: string; // Changed to match your Home.tsx component expectation
}

const QUESTIONS: QuestionData[] = [
  // ==========================================
  // RELATIONSHIP (1 - 100)
  // ==========================================
  // Love & Romance (1-10)
  { id: 1, question: "What is one thing you appreciate about me that you haven't mentioned recently? #1" },
  { id: 2, question: "When did you first realize you were falling in love with me? #2" },
  { id: 3, question: "What is your absolute favorite way for me to show you affection? #3" },
  { id: 4, question: "Which song always makes you think of our love story? #4" },
  { id: 5, question: "What is a small, romantic gesture you secretly wish I did more often? #5" },
  { id: 6, question: "How has your understanding of romance changed since we started dating? #6" },
  { id: 7, question: "What is the most romantic date night we have ever shared? #7" },
  { id: 8, question: "If our love story was a movie title, what would it be called? #8" },
  { id: 9, question: "What is a specific look or smile I give you that still makes your heart melt? #9" },
  { id: 10, question: "How do you think we keep the spark alive during stressful seasons of life? #10" },

  // Relationship Reflection (11-20)
  { id: 11, question: "What is one thing you appreciate about me that you haven't mentioned recently? #11" },
  { id: 12, question: "In what areas do you think our relationship has grown the most over the past year? #12" },
  { id: 13, question: "What is a challenge we faced together that ultimately made us stronger? #13" },
  { id: 14, question: "How do you think we complement each other's personality strengths and weaknesses? #14" },
  { id: 15, question: "What is one thing about our dynamic that you hope never changes? #15" },
  { id: 16, question: "When do you feel the most connected and in sync with me? #16" },
  { id: 17, question: "What is a habit or routine we've formed that you truly value? #17" },
  { id: 18, question: "How do you think our relationship differs from other couples we know? #18" },
  { id: 19, question: "What is something you learned about yourself only by being in this relationship? #19" },
  { id: 20, question: "If you could describe the current season of our relationship in one word, what would it be? #20" },

  // Appreciation & Gratitude (21-30)
  { id: 21, question: "What is a small thing I do daily that always brightens your mood? #21" },
  { id: 22, question: "What personality trait of mine are you most grateful for? #22" },
  { id: 23, question: "How can I better express my gratitude for everything you do for us? #23" },
  { id: 24, question: "What is a sacrifice you made for our relationship that I might not fully realize? #24" },
  { id: 25, question: "What is something I said recently that made you feel incredibly valued? #25" },
  { id: 26, question: "How do you feel most appreciated—through words, actions, gifts, or quality time? #26" },
  { id: 27, question: "What is a specific instance where you felt truly proud to be my partner? #27" },
  { id: 28, question: "What is a hidden talent or skill of mine that you deeply admire? #28" },
  { id: 29, question: "How has my presence in your life made your day-to-day routine easier or happier? #29" },
  { id: 30, question: "What is one thing you miss most about me when we are apart for a few days? #30" },

  // Trust & Vulnerability (31-40)
  { id: 31, question: "What is a secret or deep thought you’ve shared with me that you haven’t told anyone else? #31" },
  { id: 32, question: "When do you feel safest letting down your guard completely around me? #32" },
  { id: 33, question: "Is there an area in our relationship where you feel we need to rebuild or strengthen trust? #33" },
  { id: 34, question: "What is something you are currently worried about that you haven't fully shared with me? #34" },
  { id: 35, question: "How do you feel when I offer advice versus when I just listen to your struggles? #35" },
  { id: 36, question: "What does true emotional safety look like to you in our relationship? #36" },
  { id: 37, question: "Have I ever broken your trust in a minor way, and how did we move past it? #37" },
  { id: 38, question: "What is a topic or insecurity you sometimes hesitate to bring up with me? #38" },
  { id: 39, question: "How can I reassure you of my loyalty and commitment on a regular basis? #39" },
  { id: 40, question: "What is the hardest thing you’ve ever had to confess to me, and how did my reaction feel? #40" },

  // Conflict & Communication (41-50)
  { id: 41, question: "How do you think our fighting styles differ, and how can we bridge that gap? #41" },
  { id: 42, question: "What is one thing I do during arguments that makes you shut down or feel defensive? #42" },
  { id: 43, question: "How can we improve the way we apologize and seek forgiveness from each other? #43" },
  { id: 44, question: "What is a recurring disagreement we have that we still need to resolve fully? #44" },
  { id: 45, question: "Do you feel heard and understood when you voice a complaint or concern? #45" },
  { id: 46, question: "What is the best way for me to approach you when I need to bring up a difficult topic? #46" },
  { id: 47, question: "How do you prefer to cool down or process things right after a heated argument? #47" },
  { id: 48, question: "What is one communication habit of ours that you think is incredibly healthy? #48" },
  { id: 49, question: "When we disagree, do you feel like we act as a team, or does it feel like 'you vs. me'? #49" },
  { id: 50, question: "How can I better validate your feelings when we don't see eye-to-eye on an issue? #50" },

  // Marriage & Commitment (51-60)
  { id: 51, question: "What does the word 'commitment' mean to you in the context of our long-term future? #51" },
  { id: 52, question: "What are your honest thoughts and expectations about marriage? #52" },
  { id: 53, question: "What is one traditional marriage vow that resonates most deeply with your heart? #53" },
  { id: 54, question: "How do you view the balance of independence and togetherness in a lifelong marriage? #54" },
  { id: 55, question: "What scares you the most about the concept of lifelong marriage, if anything? #55" },
  { id: 56, question: "What excites you the most about the idea of growing old together? #56" },
  { id: 57, question: "How do you think we will handle major financial or lifestyle transitions as a married couple? #57" },
  { id: 58, question: "What is a piece of advice from a happily married couple that you want us to apply? #58" },
  { id: 59, question: "How do you think we can protect our relationship from external stressors like career demands? #59" },
  { id: 60, question: "What does 'for better or for worse' look like in practice for us right now? #60" },

  // Relationship Goals (61-70)
  { id: 61, question: "What is one major goal you want us to accomplish together over the next two years? #61" },
  { id: 62, question: "How can we better support each other's individual professional and personal goals? #62" },
  { id: 63, question: "What is a shared financial goal you think we should start saving for immediately? #63" },
  { id: 64, question: "What is a relational habit (like weekly dates) you want us to establish permanently? #64" },
  { id: 65, question: "Where do you see our relationship lifestyle-wise in five years? #65" },
  { id: 66, question: "What is a philanthropic or community-focused goal you'd love for us to pursue together? #66" },
  { id: 67, question: "How can we make sure our individual growth aligns with our growth as a couple? #67" },
  { id: 68, question: "What is a fitness or wellness goal you'd be excited to tackle as a team? #68" },
  { id: 69, question: "What does a 'successful relationship' look like to you in terms of daily habits? #69" },
  { id: 70, question: "What is one dream project (like remodeling a house or starting a business) you want to do together? #70" },

  // Relationship Check-Ins (71-80)
  { id: 71, question: "How well do you feel your emotional needs have been met over the past month? #71" },
  { id: 72, question: "Is there anything I’ve done recently that inadvertently hurt your feelings or made you anxious? #72" },
  { id: 73, question: "How happy are you with the amount of quality time we’ve spent together lately? #73" },
  { id: 74, question: "What can I do next week to make your daily life feel lighter and less stressful? #74" },
  { id: 75, question: "Are you satisfied with our current level of physical intimacy and closeness? #75" },
  { id: 76, question: "What is one thing we should change about our weekly routine to prioritize each other more? #76" },
  { id: 77, question: "Do you feel like we are sharing responsibilities and mental loads equally right now? #77" },
  { id: 78, question: "What was the highest point and the lowest point of our relationship this past week? #78" },
  { id: 79, question: "Is there a conversation or topic you feel we've been actively avoiding lately? #79" },
  { id: 80, question: "How full is your 'love tank' right now on a scale from 1 to 10? #80" },

  // About Our Long Distance Relationship (81-100)
  { id: 81, question: "What is the absolute hardest part of long distance for you on a daily basis? #81" },
  { id: 82, question: "What is a unique strength our relationship has developed because we are long distance? #82" },
  { id: 83, question: "What is your favorite routine or ritual we have established to stay connected across the distance? #83" },
  { id: 84, question: "How do you handle moments of loneliness when you miss me intensely? #84" },
  { id: 85, question: "What is the first thing you want to do the next time we see each other in person? #85" },
  { id: 86, question: "How do you feel when it’s time to say goodbye at the end of a visit? #86" },
  { id: 87, question: "What is a creative virtual date night idea you’ve been wanting to try with me? #87" },
  { id: 88, question: "How can I make you feel more physically or emotionally present in your daily life from afar? #88" },
  { id: 89, question: "What does our definitive 'end date' to the distance look like in your ideal timeline? #89" },
  { id: 90, question: "What is a small item of mine that you keep with you that brings you comfort? #90" },
  { id: 91, question: "How do you manage jealousy or insecurity when we are miles apart? #91" },
  { id: 92, question: "What is your favorite memory of a trip we took specifically to bridge the distance? #92" },
  { id: 93, question: "Do you think long distance makes us communicate better or worse than couples who live close? #93" },
  { id: 94, question: "What is a sweet text or voice message I sent that you've saved or reread multiple times? #94" },
  { id: 95, question: "How do you want us to handle the adjustment period when we finally live in the same city? #95" },
  { id: 96, question: "What is a funny or awkward mishap that happened during one of our video calls? #96" },
  { id: 97, question: "How do you navigate hanging out with friends while maintaining time for our virtual dates? #97" },
  { id: 98, question: "What is something you wish your friends or family understood about our long-distance dynamic? #98" },
  { id: 99, question: "If you could send me a surprise care package right now, what three things would be inside? #99" },
  { id: 100, question: "What keeps you motivated and filled with hope during the long stretches of being apart? #100" },

  // ==========================================
  // DEEP CONVERSATIONS (101 - 200)
  // ==========================================
  // Values & Beliefs (101-110)
  { id: 101, question: "What is a core value you hold that you will absolutely never compromise on? #101" },
  { id: 102, question: "How have your political or societal views evolved over the last five years? #102" },
  { id: 103, question: "What is your definition of a life well-lived? #103" },
  { id: 104, question: "How do you define success versus how society defines it? #104" },
  { id: 105, question: "What causes or social issues do you feel most passionate about supporting? #105" },
  { id: 106, question: "How do you determine what is right versus what is wrong in complex situations? #106" },
  { id: 107, question: "What value did your parents emphasize the most, and do you agree with it today? #107" },
  { id: 108, question: "How do you think money fits into your overall value system? #108" },
  { id: 109, question: "What is your view on the importance of community and social responsibility? #109" },
  { id: 110, question: "How do you want our future lifestyle to reflect our deepest internal values? #110" },

  // Life Philosophy (111-120)
  { id: 111, question: "Do you believe everything happens for a reason, or do we create our own destiny? #111" },
  { id: 112, question: "What is a personal motto or phrase that helps guide your daily choices? #112" },
  { id: 113, question: "How do you balance living in the present moment with planning for the future? #113" },
  { id: 114, question: "What is your philosophy on suffering and handling hard times? #114" },
  { id: 115, question: "Do you think people are inherently good, inherently bad, or somewhere in between? #115" },
  { id: 116, question: "How do you define happiness, and do you think it's a realistic permanent state? #116" },
  { id: 117, question: "What role does fate or luck play in your view of life outcomes? #117" },
  { id: 118, question: "How do you find peace when the world around you feels chaotic? #118" },
  { id: 119, question: "What is your view on aging and the passage of time? #119" },
  { id: 120, question: "If you could ask an omniscient being one question about the universe, what would it be? #120" },

  // Personal Growth (121-130)
  { id: 121, question: "In what specific way do you feel you've changed the most over the last three years? #121" },
  { id: 122, question: "What is a weakness you are currently working hard to transform into a strength? #122" },
  { id: 123, question: "What book, podcast, or speech has had the biggest impact on your self-growth? #123" },
  { id: 124, question: "How do you handle constructive criticism or negative feedback from people you respect? #124" },
  { id: 125, question: "What is a mindset shift you had to make to get to where you are today? #125" },
  { id: 126, question: "What area of your life do you feel requires the most discipline right now? #126" },
  { id: 127, question: "How do you measure your own personal progress and self-improvement? #127" },
  { id: 128, question: "What is a goal you failed to achieve that actually taught you something beautiful? #128" },
  { id: 129, question: "Who is someone in your life who constantly challenges you to be a better person? #129" },
  { id: 130, question: "What does reaching your full potential look like to you in this current phase of life? #130" },

  // Identity & Self-Discovery (131-140)
  { id: 131, question: "What are three words you would use to describe your core identity? #131" },
  { id: 132, question: "When do you feel most authentically yourself? #132" },
  { id: 133, question: "What part of your identity do you struggle with or hide from others sometimes? #133" },
  { id: 134, question: "How much of your identity is tied up in your current job or career? #134" },
  { id: 135, question: "What is a passion or hobby you discovered late in life that redefined who you are? #135" },
  { id: 136, question: "How do you think your cultural or family upbringing shaped your self-image? #136" },
  { id: 137, question: "What is something you used to care deeply about that you no longer value at all? #137" },
  { id: 138, question: "If you had to recreate your identity from scratch without your past, who would you be? #138" },
  { id: 139, question: "What labels do people place on you that you wish you could shed? #139" },
  { id: 140, question: "How has your understanding of your own emotional needs changed over time? #140" },

  // Biggest Lessons Learned (141-150)
  { id: 141, question: "What is the single most valuable lesson you learned from a past heartbreak? #141" },
  { id: 142, question: "What has a major financial mistake taught you about money management? #142" },
  { id: 143, question: "What is the biggest lesson you learned from a professional failure or job loss? #143" },
  { id: 144, question: "What has dealing with difficult people taught you about setting boundaries? #144" },
  { id: 145, question: "What is a truth about life that you had to learn the hard way? #145" },
  { id: 146, question: "What has a health scare or physical challenge taught you about your body? #146" },
  { id: 147, question: "What is the best piece of advice your grandparents or elders ever passed down to you? #147" },
  { id: 148, question: "What has loneliness taught you about the value of genuine connection? #148" },
  { id: 149, question: "What lesson did you learn from your very first job that you still use today? #149" },
  { id: 150, question: "What has losing a friend or family member taught you about grief and love? #150" },

  // Regrets & Mistakes (151-160)
  { id: 151, question: "What is a decision you made in your early twenties that you wish you could undo? #151" },
  { id: 152, question: "How do you cope with the heavy feeling of regret when it arises? #152" },
  { id: 153, question: "What is an opportunity you passed up that you still think about occasionally? #153" },
  { id: 154, question: "What is a conflict where you were clearly in the wrong, and how did you handle it? #154" },
  { id: 155, question: "Do you have any regrets regarding how you treated a specific person in your past? #155" },
  { id: 156, question: "What is a word spoken in anger that you deeply wish you could take back? #156" },
  { id: 157, question: "How easy or difficult is it for you to extend true forgiveness to yourself? #157" },
  { id: 158, question: "What is a mistake you made that ended up leading to an unexpectedly positive outcome? #158" },
  { id: 159, question: "Do you regret any choices you made regarding your higher education or career track? #159" },
  { id: 160, question: "What is a secret burden or mistake you carry that you are ready to let go of? #160" },

  // Fears & Insecurities (161-170)
  { id: 161, question: "What is your absolute deepest fear regarding our future together? #161" },
  { id: 162, question: "What is an insecurity about your appearance that you struggle to overcome? #162" },
  { id: 163, question: "What is a professional or creative fear that keeps you from taking big risks? #163" },
  { id: 164, question: "How do you typically react when your core insecurities are triggered? #164" },
  { id: 165, question: "Does the thought of being vulnerable with people scare you or comfort you? #165" },
  { id: 166, question: "What is a irrational fear or phobia you have that always makes you feel silly? #166" },
  { id: 167, question: "How can I best comfort you when you are caught in a wave of anxiety or fear? #167" },
  { id: 168, question: "What fear did you manage to conquer that you are incredibly proud of? #168" },
  { id: 169, question: "Do you ever worry about being left behind or forgotten by those you love? #169" },
  { id: 170, question: "What is an insecurity you have about your role as a partner in this relationship? #170" },

  // Meaning & Purpose (171-200)
  { id: 171, question: "What gives your individual life a profound sense of meaning and purpose? #171" },
  { id: 172, question: "When do you feel most aligned with your true calling in life? #172" },
  { id: 173, question: "If you could solve one global crisis or issue, what would you choose? #173" },
  { id: 174, question: "How do you want to be remembered by the world after you are gone? #174" },
  { id: 175, question: "Do you believe we have a predetermined destiny, or do we create our own meaning? #175" },
  { id: 176, question: "What legacy do you hope our relationship leaves behind for future generations? #176" },
  { id: 177, question: "What activities or interactions make you feel most alive and spiritually connected? #177" },
  { id: 178, question: "How does your daily job contribute to your overall sense of purpose? #178" },
  { id: 179, question: "If money didn't exist, how would you spend your time fulfilling your purpose? #179" },
  { id: 180, question: "What fulfills you more: personal achievement or serving others? #180" },
  { id: 181, question: "What is a burning question about existence you wish you could have answered? #181" },
  { id: 182, question: "How do you find meaning in mundane or boring daily tasks? #182" },
  { id: 183, question: "What life experience made you completely rethink your purpose? #183" },
  { id: 184, question: "Do you believe finding your purpose is a destination or a lifelong journey? #184" },
  { id: 185, question: "How do you think our relationship helps fulfill your individual purpose? #185" },
  { id: 186, question: "What cause would you gladly dedicate all your spare time and energy to? #186" },
  { id: 187, question: "When you feel lost, what anchor brings you back to your sense of purpose? #187" },
  { id: 188, question: "How important is recognition from others to your sense of fulfillment? #188" },
  { id: 189, question: "What is a beautiful truth about human nature that you firmly believe in? #189" },
  { id: 190, question: "How has your understanding of your life's mission shifted as you’ve grown older? #190" },
  { id: 191, question: "What does it mean to you to live an intentional life? #191" },
  { id: 192, question: "What is an underlying passion you have that most people don't notice? #192" },
  { id: 193, question: "How do you handle seasons where life feels stagnant or lacking in meaning? #193" },
  { id: 194, question: "What role does art, music, or nature play in your sense of purpose? #194" },
  { id: 195, question: "What is a core truth you've discovered about building a meaningful community? #195" },
  { id: 196, question: "How does helping someone else change your own internal emotional state? #196" },
  { id: 197, question: "What is the most fulfilling compliment someone could give you? #197" },
  { id: 198, question: "What does freedom look like to you in its truest form? #198" },
  { id: 199, question: "How do you think our modern world undermines our search for meaning? #199" },
  { id: 200, question: "What is a goal that, once achieved, made you feel empty instead of fulfilled? #200" },

  // ==========================================
  // FUN & LIGHTHEARTED (201 - 300)
  // ==========================================
  // Would You Rather (201-210)
  { id: 201, question: "Would you rather always have to sing instead of speaking, or dance instead of walking? #201" },
  { id: 202, question: "Would you rather only eat your favorite food for a year, or never eat it again? #202" },
  { id: 203, question: "Would you rather explore the depths of the ocean or travel to a distant galaxy? #203" },
  { id: 204, question: "Would you rather always be 15 minutes late or always be 45 minutes early? #204" },
  { id: 205, question: "Would you rather lose all your saved digital memories or all your physical photos? #205" },
  { id: 206, question: "Would you rather have a live-in chef or a live-in personal masseuse? #206" },
  { id: 207, question: "Would you rather be able to read minds or be completely invisible at will? #207" },
  { id: 208, question: "Would you rather live in a house that is always freezing or always boiling hot? #208" },
  { id: 209, question: "Would you rather have to whisper everything or scream everything you say? #209" },
  { id: 210, question: "Would you rather have unlimited free coffee for life or unlimited free flight tickets? #210" },

  // This or That (211-220)
  { id: 211, question: "Beach vacation or mountain cabin getaway? #211" },
  { id: 212, question: "Sweet breakfast like pancakes, or savory breakfast like eggs and bacon? #212" },
  { id: 213, question: "An active night out partying or a cozy night in watching a movie? #213" },
  { id: 214, question: "Physical paperback books or digital e-readers? #214" },
  { id: 215, question: "Spontaneous road trips or meticulously planned itineraries? #215" },
  { id: 216, question: "Comedy movies that make you laugh or thriller movies that keep you guessing? #216" },
  { id: 217, question: "Early morning sunrise or late night starlight? #217" },
  { id: 218, question: "Cooking a fancy dinner together at home or ordering delivery takeout? #218" },
  { id: 219, question: "A pet dog full of energy or a quiet, independent cat? #219" },
  { id: 220, question: "Hot summer weather or crisp, snowy winter days? #220" },

  // Rapid Fire Questions (221-230)
  { id: 221, question: "What is your absolute favorite ice cream flavor of all time? #221" },
  { id: 222, question: "What is the single word you use way too often when speaking? #222" },
  { id: 223, question: "If you could have dinner with one cartoon character, who is it? #223" },
  { id: 224, question: "What is the first app you open on your phone every single morning? #224" },
  { id: 225, question: "Cats or dogs? Answer in one second! #225" },
  { id: 226, question: "What is your lucky number and is there a reason why? #226" },
  { id: 227, question: "What is the last thing you bought online that you absolutely didn't need? #227" },
  { id: 228, question: "What is your favorite color to wear when you want to feel confident? #228" },
  { id: 229, question: "Window seat or aisle seat when flying on an airplane? #229" },
  { id: 230, question: "What is your ultimate comfort food dish when you feel sick? #230" },

  // Hypotheticals (231-240)
  { id: 231, question: "If you won $10 million tomorrow, what is the very first thing you would buy? #231" },
  { id: 232, question: "If you could speak any foreign language fluently overnight, what would it be? #232" },
  { id: 233, question: "If you were given a chance to live on Mars for a year, would you take it? #233" },
  { id: 234, question: "If you could switch lives with any celebrity for 24 hours, who would you choose? #234" },
  { id: 235, question: "If you could instantly play any musical instrument perfectly, which one would it be? #235" },
  { id: 236, question: "If an alien spaceship landed in your yard, would you go inside or run away? #236" },
  { id: 237, question: "If you could bring back one defunct fashion trend, what would it be? #237" },
  { id: 238, question: "If you could have an unlimited supply of one snack forever, what would it be? #238" },
  { id: 239, question: "If you were forced to open a themed museum, what would it display? #239" },
  { id: 240, question: "If you could read the mind of one person for an hour, who would you pick? #240" },

  // Silly Scenarios (241-250)
  { id: 241, question: "If animals could suddenly talk, which species do you think would be the rudest? #241" },
  { id: 242, question: "What would your ultimate pro-wrestling entrance song and persona be? #242" },
  { id: 243, question: "If you were a ghost tasked with haunting a specific building, where would you go? #243" },
  { id: 244, question: "If you had to survive a week trapped inside a giant grocery store, where would you sleep? #244" },
  { id: 245, question: "If your current pet became human for a day, what would you two do together? #245" },
  { id: 246, question: "What would you do if you woke up tomorrow and discovered you were invisible? #246" },
  { id: 247, question: "If your shoes squeaked loudly with every single step, how would you handle public places? #247" },
  { id: 248, question: "If you were a secret agent, what ridiculous code name would you choose for yourself? #248" },
  { id: 249, question: "If you had to replace your hands with objects instead of fingers, what would they be? #249" },
  { id: 250, question: "If you were crowned ruler of a small island, what would your first silly law be? #250" },

  // Random Opinions (251-260)
  { id: 251, question: "What is your definitive, hill-to-die-on opinion about pineapple on pizza? #251" },
  { id: 252, question: "Do you think cereal counts as a soup, and why or why not? #252" },
  { id: 253, question: "What is a popular, critically acclaimed movie that you absolutely cannot stand? #253" },
  { id: 254, question: "What is the best type of fry—waffle, curly, steak, or shoestring? #254" },
  { id: 255, question: "Do you believe ghosts or paranormal entities exist in our world? #255" },
  { id: 256, question: "What is the single most annoying text message slang abbreviation? #256" },
  { id: 257, question: "Is it more acceptable to sleep with socks on or completely barefoot? #257" },
  { id: 258, question: "What is the most overrated holiday of the entire calendar year? #258" },
  { id: 259, question: "Do you think hot dogs should be classified as sandwiches? #259" },
  { id: 260, question: "What is the absolute best season of the year for fashion choices? #260" },

  // Guilty Pleasures (261-270)
  { id: 261, question: "What cheesy reality TV show do you secretly love watching when no one is around? #261" },
  { id: 262, question: "What is a 'terrible' pop song that you know every single lyric to? #262" },
  { id: 263, question: "What is your favorite trashy fast food item that you indulge in occasionally? #263" },
  { id: 264, question: "Do you ever scroll through celebrity gossip websites or social media drama? #264" },
  { id: 265, question: "What is a childish movie or cartoon that you still watch as an adult? #265" },
  { id: 266, question: "What is your ultimate guilty pleasure snack combo that sounds weird but tastes amazing? #266" },
  { id: 267, question: "How much time do you honestly waste watching mindless videos online each day? #267" },
  { id: 268, question: "What is an expensive luxury item you bought just to treat yourself? #268" },
  { id: 269, question: "Do you ever stay up way past your bedtime playing mobile or video games? #269" },
  { id: 270, question: "What is a cliché romantic movie trope that you secretively love every single time? #270" },

  // Funny Memories (271-300)
  { id: 271, question: "What is the funniest thing that has ever happened to us while out on a date? #271" },
  { id: 272, question: "What is a hilarious misunderstanding we had early in our relationship? #272" },
  { id: 273, question: "What is the most ridiculous inside joke we currently share? #273" },
  { id: 274, question: "What text message did you send me that completely lacked context and made us laugh? #274" },
  { id: 275, question: "What is a funny face or noise I make that always cracks you up? #275" },
  { id: 276, question: "What is the most chaotic cooking disaster we have ever experienced together? #276" },
  { id: 277, question: "What is a funny story from one of our trips or travel delays? #277" },
  { id: 278, question: "What was a hilarious outfit choice one of us made in an old photo? #278" },
  { id: 279, question: "What is a time we burst out laughing in a quiet environment where we shouldn't have? #279" },
  { id: 280, question: "What is the funniest gift you have ever given or received from me? #280" },
  { id: 281, question: "What memory of us being clumsy still brings a smile to your face? #281" },
  { id: 282, question: "What is a funny habit I have when I am deep asleep that you’ve noticed? #282" },
  { id: 283, question: "What is the most absurd internet meme we’ve sent back and forth? #283" },
  { id: 284, question: "What is a funny line from a movie or show that we quote constantly? #284" },
  { id: 285, question: "What was a hilarious pet moment or animal interaction we witnessed together? #285" },
  { id: 286, question: "What is a funny phase or trend we both participated in years ago? #286" },
  { id: 287, question: "What is a comedic disaster that happened during a family gathering? #287" },
  { id: 288, question: "What is a funny prank or joke we played on someone else together? #288" },
  { id: 289, question: "What is the most ridiculous thing we’ve argued about that makes no sense now? #289" },
  { id: 290, question: "What is a funny dream you had about me that you remember vividly? #290" },
  { id: 291, question: "What is an awkward running encounter we had with a stranger together? #291" },
  { id: 292, question: "What is the most amusing nickname we have for an inanimate object in our life? #292" },
  { id: 293, question: "What was a funny karaoke performance or singing attempt we did? #293" },
  { id: 294, question: "What is a funny habit you have when you get overly tired or sleepy? #294" },
  { id: 295, question: "What is a humorous photo of us that will never be posted on social media? #295" },
  { id: 296, question: "What is a funny sound effect you make when you are stressed out? #296" },
  { id: 297, question: "What is a funny story about how we tried to save money on a date? #297" },
  { id: 298, question: "What is a funny game or challenge we made up out of pure boredom? #298" },
  { id: 299, question: "What is a funny thing you accidentally dropped or broke in front of me? #299" },
  { id: 300, question: "What is a hilarious memory of us trying to figure out directions together? #300" },

  // ==========================================
  // FUTURE & DREAMS (301 - 400)
  // ==========================================
  // Future Plans (301-310)
  { id: 301, question: "What is a major city or region you want us to live in at some point? #301" },
  { id: 302, question: "How do you see our career paths intertwining over the next few years? #302" },
  { id: 303, question: "What is your timeline for settling down permanently in one location? #303" },
  { id: 304, question: "What is a financial milestones you want us to reach before we turn 40? #304" },
  { id: 305, question: "How do you want us to handle major lifestyle inflation as our income grows? #305" },
  { id: 306, question: "What is a shared creative project you plan for us to launch in the future? #306" },
  { id: 307, question: "How do you want to balance professional ambitions with family time in our future? #307" },
  { id: 308, question: "What is a big purchase (besides a home) you want us to save for? #308" },
  { id: 309, question: "How do you plan to handle aging parents or family obligations in the future? #309" },
  { id: 310, question: "What is a step we can take today to secure our ideal future lifestyle? #310" },

  // Bucket List (311-320)
  { id: 311, question: "What is the number one ultimate bucket list experience you want us to share? #311" },
  { id: 312, question: "What is a crazy adrenaline-rush activity on your personal bucket list? #312" },
  { id: 313, question: "What is an iconic global festival or event you want us to attend together? #313" },
  { id: 314, question: "What is a creative project or book you want to finish before you die? #314" },
  { id: 315, question: "What is a natural wonder of the world you absolutely must see in person? #315" },
  { id: 316, question: "What is a unique skill (like scuba diving or piloting) on your bucket list? #316" },
  { id: 317, question: "What is a luxury travel experience you want to cross off your list with me? #317" },
  { id: 318, question: "What is a philanthropy or charity goal on your ultimate bucket list? #318" },
  { id: 319, question: "What is a concert or sports event you want to experience from front-row seats? #319" },
  { id: 320, question: "What is a legacy goal you want to fulfill before your time is up? #320" },

  // Dream Home (321-330)
  { id: 321, question: "What architectural style is your absolute dream home? #321" },
  { id: 322, question: "What is one non-negotiable room or feature your dream house must have? #322" },
  { id: 323, question: "Would you prefer a modern smart-home or a rustic historical house with character? #323" },
  { id: 324, question: "What does your dream backyard setup look like for entertaining guests? #324" },
  { id: 325, question: "What color palette and interior design aesthetic do you want for our living room? #325" },
  { id: 326, question: "Where is the ideal geographical setting for your dream house located? #326" },
  { id: 327, question: "What is your view on having an entirely dedicated home office space? #327" },
  { id: 328, question: "What does your absolute dream kitchen look like in terms of appliances and style? #328" },
  { id: 329, question: "How do you feel about a cozy fireplace or an outdoor fire pit setup? #329" },
  { id: 330, question: "What is a small decor detail that makes a house feel like a home to you? #330" },

  // Dream Careers (331-340)
  { id: 331, question: "If you could change your career path today with no consequences, what would you do? #331" },
  { id: 332, question: "What is your ultimate dream job or professional title? #332" },
  { id: 333, question: "What is a business or startup idea you secretly dream of launching? #333" },
  { id: 334, question: "How does your dream career provide fulfillment beyond just a paycheck? #334" },
  { id: 335, question: "Who is your absolute career role model or professional inspiration? #335" },
  { id: 336, question: "What is a creative industry you’ve always wanted to dip your toes into? #336" },
  { id: 337, question: "What does your ideal daily schedule look like in your dream career? #337" },
  { id: 338, question: "Would you rather be a top executive at a massive company or build your own small business? #338" },
  { id: 339, question: "What is a skill you wish you possessed that would skyrocket your career? #339" },
  { id: 340, question: "What is your dream achievement or award in your professional field? #340" },

  // Retirement Dreams (341-350)
  { id: 341, question: "At what ideal age would you love to officially retire from working? #341" },
  { id: 342, question: "Where is your absolute dream retirement location for us to settle down? #342" },
  { id: 343, question: "What hobbies do you plan to pick up or dedicate time to during retirement? #343" },
  { id: 344, question: "Would you prefer to travel full-time during retirement or have a steady home base? #344" },
  { id: 345, question: "How do you want us to stay active and healthy during our golden years? #345" },
  { id: 346, question: "What kind of community or social group do you want to surround us in retirement? #346" },
  { id: 347, question: "What is a dream volunteer or mentoring role you want to take on later in life? #347" },
  { id: 348, question: "How do you feel about downsizing our home once we reach retirement? #348" },
  { id: 349, question: "What does a perfect, relaxing Tuesday look like when we are retired? #349" },
  { id: 350, question: "What legacy or inheritance do you want to leave behind for family or charity? #350" },

  // Travel Dreams (351-360)
  { id: 351, question: "What is the number one international country you dream of exploring together? #351" },
  { id: 352, question: "What is an iconic landmark you want us to see in person? #352" },
  { id: 353, question: "What is your dream travel style—backpacking through cities or staying at luxury resorts? #353" },
  { id: 354, question: "What is an exotic cuisine or food tour you dream of taking abroad? #354" },
  { id: 355, question: "What is a scenic cruise or train journey you want us to experience? #355" },
  { id: 356, question: "If we could take a six-month sabbatical to travel anywhere, where would we start? #356" },
  { id: 357, question: "What island paradise do you dream of visiting for a relaxing beach vacation? #357" },
  { id: 358, question: "What historic city or ancient ruins do you most want to tour with me? #358" },
  { id: 359, question: "What is a unique travel experience (like seeing the Northern Lights) you dream of? #359" },
  { id: 360, question: "How do you want us to document or remember our future world travels? #360" },

  // Family Plans (361-370)
  { id: 361, question: "What are your honest hopes and dreams regarding having children in the future? #361" },
  { id: 362, question: "How many kids do you ideally see us having, if any? #362" },
  { id: 363, question: "What is a parenting philosophy you feel strongly about implementing? #363" },
  { id: 364, question: "How do you want to handle career choices when we start raising a family? #364" },
  { id: 365, question: "What family value is most important for us to instill in our future children? #365" },
  { id: 366, question: "How do you want to handle discipline and rule-setting as parents? #366" },
  { id: 367, question: "What is a childhood tradition of yours that you want to pass down to our family? #367" },
  { id: 368, question: "How do you want to balance couple time with family time once we have kids? #368" },
  { id: 369, question: "What scares you the most about the prospect of becoming a parent? #369" },
  { id: 370, question: "What excites you the most about watching our future family grow? #370" },

  // Five-Year Vision (371-400)
  { id: 371, question: "Where do you clearly see us living exactly five years from today? #371" },
  { id: 372, question: "What career milestones do you hope to have achieved in a five-year timeline? #372" },
  { id: 373, question: "How do you think our relationship dynamic will mature over the next five years? #373" },
  { id: 374, question: "What financial standing or investments do you hope we have in five years? #374" },
  { id: 375, question: "What personal habits do you want to have firmly established five years from now? #375" },
  { id: 376, question: "What major trips or travel goals do you want completed in the next five years? #376" },
  { id: 377, question: "How do you see our relationship with our families evolving over five years? #377" },
  { id: 378, question: "What is a health or fitness level you want to maintain or reach in five years? #378" },
  { id: 379, question: "What is a creative or personal project you want fully operational in five years? #379" },
  { id: 380, question: "What is the biggest obstacle we need to overcome to achieve our five-year vision? #380" },
  { id: 381, question: "How can we make sure we review and stay on track with our five-year goals? #381" },
  { id: 382, question: "What is a luxury or comfort you want to afford easily in five years? #382" },
  { id: 383, question: "How do you hope your spiritual or personal growth looks in five years? #383" },
  { id: 384, question: "What kind of home or living arrangement do you expect us to have in five years? #384" },
  { id: 385, question: "What friendship or social connections do you hope to cultivate over five years? #385" },
  { id: 386, question: "What is a skill or certification you want to have earned within five years? #386" },
  { id: 387, question: "How do you think our daily morning routine will look five years from now? #387" },
  { id: 388, question: "What is a community or charity role you want to fill in the next five years? #388" },
  { id: 389, question: "How will we celebrate when we officially hit our five-year goals? #389" },
  { id: 390, question: "What is one thing you can do this month to invest in our five-year future? #390" },
  { id: 391, question: "What books or knowledge do you want to absorb over the next five years? #391" },
  { id: 392, question: "How do you hope our communication patterns improve over the next five years? #392" },
  { id: 393, question: "What is a stressor you hope we have completely eliminated from our lives in five years? #393" },
  { id: 394, question: "What family milestones do you anticipate hitting within a five-year window? #394" },
  { id: 395, question: "How will we handle unexpected setbacks to our five-year plan as a team? #395" },
  { id: 396, question: "What is a bad habit you want completely broken and gone in five years? #396" },
  { id: 397, question: "What kind of mentorship or guidance do you want to seek out over five years? #397" },
  { id: 398, question: "What is a peace of mind or emotional state you want to secure in five years? #398" },
  { id: 399, question: "How do you think our appreciation for each other will deepen in five years? #399" },
  { id: 400, question: "If our five-year plan could change completely, what is your alternative dream? #400" },

  // ==========================================
  // INTIMACY (401 - 500)
  // ==========================================
  // Emotional Intimacy (401-410)
  { id: 401, question: "What makes you feel most emotionally safe and understood in our relationship? #401" },
  { id: 402, question: "When was a time you felt an intense, deep emotional connection with me? #402" },
  { id: 403, question: "What is a fear or vulnerability you’ve been hesitant to share with me lately? #403" },
  { id: 404, question: "How can I better validate your emotions when you are feeling down or overwhelmed? #404" },
  { id: 405, question: "What does true emotional intimacy look and feel like to you? #405" },
  { id: 406, question: "Do you feel comfortable crying or showing raw weakness in front of me? #406" },
  { id: 407, question: "What is an area of your inner life that you feel I don’t fully understand yet? #407" },
  { id: 408, question: "How can we cultivate deeper emotional closeness during our busy weeks? #408" },
  { id: 409, question: "What is a question about your internal world that you wish I would ask more often? #409" },
  { id: 410, question: "How do you feel when we share our deepest hopes and secrets with each other? #410" },

  // Physical Affection (411-420)
  { id: 411, question: "What is your absolute favorite type of physical touch or affection from me? #411" },
  { id: 412, question: "How important is holding hands or casual physical contact to you throughout the day? #412" },
  { id: 413, question: "What is your favorite memory of a simple cuddle session or quiet moment we shared? #413" },
  { id: 414, question: "How can I better initiate physical affection in a way that makes you feel loved? #414" },
  { id: 415, question: "Do you feel like we have a healthy balance of physical touch in our routine? #415" },
  { id: 416, question: "What is a non-sexual physical gesture of mine that always makes you feel secure? #416" },
  { id: 417, question: "How does physical touch help you decompress after a stressful day? #417" },
  { id: 418, question: "What is your favorite time of day for physical closeness and affection? #418" },
  { id: 419, question: "How does physical distance affect your mood and how can we counter it? #419" },
  { id: 420, question: "What is a small touch or embrace of mine that you always look forward to? #420" },

  // Love Languages (421-430)
  { id: 421, question: "What is your primary love language, and how can I speak it better this week? #421" },
  { id: 422, question: "How do you think my love language differs from yours, and how do we balance that? #422" },
  { id: 423, question: "What is a specific example of an act of service that makes you feel deeply loved? #423" },
  { id: 424, question: "How do words of affirmation impact your self-esteem and our relationship? #424" },
  { id: 425, question: "What does quality time mean to you—is it an activity or just being in the same room? #425" },
  { id: 426, question: "How do you feel about receiving thoughtful, unexpected gifts from me? #426" },
  { id: 427, question: "What is a way I express love that you appreciate, even if it's not your primary language? #427" },
  { id: 428, question: "How has your understanding of your own love language evolved over the years? #428" },
  { id: 429, question: "When do you feel like my 'love tank' is running low, and how do you fill it? #429" },
  { id: 430, question: "What is a fun, new way we can practice speaking each other's love languages? #430" },

  // Romantic Fantasies (431-440)
  { id: 431, question: "What is a dream romantic scenario or setting you’ve always wanted to experience? #431" },
  { id: 432, question: "If we could escape to a private fantasy destination for a weekend, where would it be? #432" },
  { id: 433, question: "What is a romantic movie scene you secretively wish we could recreate together? #433" },
  { id: 434, question: "What does your ideal, uninterrupted romantic evening look like from start to finish? #434" },
  { id: 435, question: "What is a romantic surprise you’ve fantasized about me planning for you? #435" },
  { id: 436, question: "How can we bring more romance and fantasy into our regular, daily routine? #436" },
  { id: 437, question: "What is a romantic custom or tradition from another culture you’d love to try? #437" },
  { id: 438, question: "What makes a setting or environment feel instantly romantic and intimate to you? #438" },
  { id: 439, question: "What is a romantic thought about me that crossed your mind recently? #439" },
  { id: 440, question: "How can we make our future anniversaries feel incredibly magical and special? #440" },

  // Feeling Connected (441-450)
  { id: 441, question: "What is an activity we do together that makes you feel instantly connected? #441" },
  { id: 442, question: "How do you feel our emotional connection handles periods of busyness or stress? #442" },
  { id: 443, question: "What is a shared interest or hobby that keeps us feeling connected as a team? #443" },
  { id: 444, question: "When do you feel a lack of connection, and what is the best way for us to fix it? #444" },
  { id: 445, question: "How does laughing together strengthen your feeling of connection to me? #445" },
  { id: 446, question: "What is a routine or ritual that grounds our connection at the end of every day? #446" },
  { id: 447, question: "How does practicing our faith together deepen your sense of connection? #447" },
  { id: 448, question: "What is a look or non-verbal cue we share that shows we are perfectly in sync? #448" },
  { id: 449, question: "How can I show you that I am fully present and engaged during our conversations? #449" },
  { id: 450, question: "What makes you feel proudest of our deep emotional connection? #450" },

  // Attraction (451-460)
  { id: 451, question: "What physical feature of mine is your absolute favorite to look at? #451" },
  { id: 452, question: "What is a personality trait of mine that you find incredibly attractive? #452" },
  { id: 453, question: "What outfit or style of clothing do you love seeing me wear the most? #453" },
  { id: 454, question: "How has your attraction to me grown or deepened since we first met? #454" },
  { id: 455, question: "What is a specific habit or mannerism of mine that turns you on? #455" },
  { id: 456, question: "What scent or cologne/perfume makes you want to get closer to me? #456" },
  { id: 457, question: "How do you feel when you see me completely confident and in my element? #457" },
  { id: 458, question: "What is a compliment about your attractiveness that you love hearing from me? #458" },
  { id: 459, question: "What is a subtle, non-verbal way I display confidence that you find attractive? #459" },
  { id: 460, question: "How can we continue to nurture and prioritize physical attraction as we age? #460" },

  // Date Night Ideas (461-470)
  { id: 461, question: "What is a creative, budget-friendly date night idea you’ve been wanting to try? #461" },
  { id: 462, question: "If we had an entire day completely to ourselves with no rules, what would our date look like? #462" },
  { id: 463, question: "What is a fancy, upscale restaurant you’ve been dying to go to for a special date? #463" },
  { id: 464, question: "Would you prefer an active date night (like mini-golf) or a relaxing date (like a movie)? #464" },
  { id: 465, question: "What is a seasonal date night idea (like ice skating or a summer picnic) you love? #465" },
  { id: 466, question: "How can we make our staying-at-home dates feel special and distinct from normal nights? #466" },
  { id: 467, question: "What is a hobby or class (like cooking or pottery) you want us to do for a date? #467" },
  { id: 468, question: "What is your favorite memory of a surprise date one of us planned for the other? #468" },
  { id: 469, question: "What is an outdoor or adventure-style date night you think we’d both enjoy? #469" },
  { id: 470, question: "How can we make sure we maintain a consistent date night schedule moving forward? #470" },

  // Relationship Needs (471-500)
  { id: 471, question: "What is your number one most important emotional need in our relationship? #471" },
  { id: 472, question: "How well do you feel your need for independence and alone time is being met? #472" },
  { id: 473, question: "What can I do to better support your need for reassurance and security? #473" },
  { id: 474, question: "How do you feel we handle our individual needs for social time with friends? #474" },
  { id: 475, question: "What is a relationship need you used to have that is no longer important to you? #475" },
  { id: 476, question: "How can we communicate our shifting needs to each other without causing hurt feelings? #476" },
  { id: 477, question: "Do you feel like your opinions and needs are treated with equal weight in decisions? #477" },
  { id: 478, question: "What is a way I can show you that your comfort and happiness are my priorities? #478" },
  { id: 479, question: "How do you feel when your emotional or physical needs aren't being fully met? #479" },
  { id: 480, question: "What is a step we can take today to make sure both of our core needs are satisfied? #480" },
  { id: 481, question: "What does feeling fully appreciated look like in terms of daily actions? #481" },
  { id: 482, question: "How can I better understand your needs during times of intense career stress? #482" },
  { id: 483, question: "What is a boundaries or guideline that helps protect your peace in this relationship? #483" },
  { id: 484, question: "Do you feel like you can openly express a negative need or boundary to me? #484" },
  { id: 485, question: "What is an area where you feel you consistently sacrifice your own needs for mine? #485" },
  { id: 486, question: "How can we create a regular check-in habit to discuss our relationship needs? #486" },
  { id: 487, question: "What is a small, subtle sign you give when you need extra love and attention? #487" },
  { id: 488, question: "How do you feel your need for intellectual stimulation is met in our relationship? #488" },
  { id: 489, question: "What is a way I can help you feel more organized and less overwhelmed? #489" },
  { id: 490, question: "What does an ideal, perfectly balanced relationship look like to you? #490" },
  { id: 491, question: "How can I help you protect your self-care and relaxation time? #491" },
  { id: 492, question: "What is a need you think I have that you try your best to fulfill regularly? #492" },
  { id: 493, question: "How does our physical environment affect your mood and emotional needs? #493" },
  { id: 494, question: "What is a specific reassurance you love to hear when you feel self-critical? #494" },
  { id: 495, question: "How can we ensure our home remains a peaceful sanctuary for both of us? #495" },
  { id: 496, question: "What is a way we can handle differences in lifestyle needs or habits smoothly? #496" },
  { id: 497, question: "Do you feel like you can fully relax and do nothing around me? #497" },
  { id: 498, question: "What is a growth need you have that you want me to gently hold you accountable for? #498" },
  { id: 499, question: "How can I best support you when you are dealing with external family drama? #499" },
  { id: 500, question: "What is one thing you need from me right now to feel completely loved and secure? #500" },

  // ==========================================
  // MEMORIES (501 - 600)
  // ==========================================
  // Childhood Memories (501-510)
  { id: 501, question: "What was your absolute favorite toy or game to play during childhood? #501" },
  { id: 502, question: "What is a funny or mischievous story about something you did as a kid? #502" },
  { id: 503, question: "Who was your absolute best friend growing up, and what did you do together? #503" },
  { id: 504, question: "What is a vivid memory of a childhood summer or school vacation? #504" },
  { id: 505, question: "What did you want to be when you grew up when you were seven years old? #505" },
  { id: 506, question: "What was a favorite family meal or comfort food from your childhood? #506" },
  { id: 507, question: "What is a memory of a childhood pet that holds a special place in your heart? #507" },
  { id: 508, question: "What was your favorite book or bedtime story when you were little? #508" },
  { id: 509, question: "What is a memory of a childhood birthday party or celebration you loved? #509" },
  { id: 510, question: "What was a lesson or piece of advice from childhood that stuck with you? #510" },

  // School Memories (511-520)
  { id: 511, question: "What was your favorite subject or class in elementary school? #511" },
  { id: 512, question: "What is a funny or awkward memory from your middle school years? #512" },
  { id: 513, question: "What high school clubs, sports, or activities were you involved in? #513" },
  { id: 514, question: "Who was a favorite teacher who had a major impact on your education? #514" },
  { id: 515, question: "What is a memory of a school field trip or special event you remember vividly? #515" },
  { id: 516, question: "What was your go-to style or fashion trend during your high school days? #516" },
  { id: 517, question: "What is a memory of high school graduation or senior year that makes you proud? #517" },
  { id: 518, question: "What was your favorite memory of hanging out with friends after school? #518" },
  { id: 519, question: "What is a funny story about a school project or presentation gone wrong? #519" },
  { id: 520, question: "How do you think your school experiences shaped your career ambitions? #520" },

  // Family Memories (521-530)
  { id: 521, question: "What is a favorite memory of a regular family dinner or weekend routine? #521" },
  { id: 522, question: "What is a sweet memory of a holiday or tradition spent with your family? #522" },
  { id: 523, question: "What is a funny story involving one of your siblings or extended family members? #523" },
  { id: 524, question: "What is a memory of a family reunion or gathering that stands out to you? #524" },
  { id: 525, question: "What is a lesson or value your parents demonstrated through their actions? #525" },
  { id: 526, question: "What is a favorite memory of a grandparent or older family member? #526" },
  { id: 527, question: "What is a story about a family project or home renovation you did together? #527" },
  { id: 528, question: "What is a memory of a difficult time that brought your family closer together? #528" },
  { id: 529, question: "What is a funny family inside joke or phrase that you still use? #529" },
  { id: 530, question: "What is a memory of a simple, quiet moment shared with a family member? #530" },

  // Firsts (531-540)
  { id: 531, question: "What is your memory of our very first official date together? #531" },
  { id: 532, question: "What were your exact thoughts when you saw me for the first time? #532" },
  { id: 533, question: "What is a memory of your very first job or professional gig? #533" },
  { id: 534, question: "What is a memory of the first car you ever owned or drove regularly? #534" },
  { id: 535, question: "What is a memory of the first time you traveled outside of your home country? #535" },
  { id: 536, question: "What is your memory of the first apartment or living space you rented on your own? #536" },
  { id: 537, question: "What is a memory of the first major concert or live show you ever attended? #537" },
  { id: 538, question: "What is a memory of the first time you realized you were truly independent? #538" },
  { id: 539, question: "What is a memory of the first big purchase you made with your own money? #539" },
  { id: 540, question: "What is your memory of the first text message or online interaction we had? #540" },

  // Best Moments (541-550)
  { id: 541, question: "What is the absolute best, most joyful moment we have ever shared as a couple? #541" },
  { id: 542, question: "What is a proud personal achievement moment from your past that you love remembering? #542" },
  { id: 543, question: "What was the highlight moment of our relationship over the past six months? #543" },
  { id: 544, question: "What is a memory of an unexpected, beautiful surprise that happened to you? #544" },
  { id: 545, question: "What is a memory of a day where everything just went perfectly from start to finish? #545" },
  { id: 546, question: "What is a memory of an outdoor or travel moment that took your breath away? #546" },
  { id: 547, question: "What is a memory of a celebration or party where you felt completely happy? #547" },
  { id: 548, question: "What is a memory of a breakthrough or success in your career that felt amazing? #548" },
  { id: 549, question: "What is a memory of a simple, ordinary day with me that you consider a 'best moment'? #549" },
  { id: 550, question: "What is a memory of a spiritual or faith-based milestone that filled you with peace? #550" },

  // Embarrassing Stories (551-560)
  { id: 551, question: "What is the most hilariously embarrassing thing that has ever happened to you in public? #551" },
  { id: 552, question: "What is an awkward childhood or school story that makes you laugh today? #552" },
  { id: 553, question: "What is a funny or embarrassing wardrobe malfunction you’ve experienced? #553" },
  { id: 554, question: "What is a story about a time you accidentally texted or called the wrong person? #554" },
  { id: 555, question: "What is an embarrassing mistake you made during a job interview or professional event? #555" },
  { id: 556, question: "What is a funny story about a time you completely misspoke or mispronounced a word? #556" },
  { id: 557, question: "What is an embarrassing memory of a time you tripped or fell in front of a crowd? #557" },
  { id: 558, question: "What is a funny story about a time you got caught doing something silly when you thought you were alone? #558" },
  { id: 559, question: "What is an embarrassing memory from an old date or relationship before we met? #559" },
  { id: 560, question: "What is a story about a time you completely forgot someone's name in an awkward situation? #560" },

  // Nostalgia (561-570)
  { id: 561, question: "What song or band immediately triggers an intense feeling of nostalgia for you? #561" },
  { id: 562, question: "What childhood commercial, cartoon, or TV show intro brings back instant memories? #562" },
  { id: 563, question: "What specific scent (like rain, a perfume, or cooking) makes you feel nostalgic? #563" },
  { id: 564, question: "What old video game, board game, or website do you miss from your younger days? #564" },
  { id: 565, question: "What fashion trend or style from your past do you look back on with fondness? #565" },
  { id: 566, question: "What childhood place or store that no longer exists do you wish you could visit one last time? #566" },
  { id: 567, question: "What snack, candy, or soda from your childhood do you wish they would bring back? #567" },
  { id: 568, question: "What era or decade of your life do you feel the most nostalgic for? #568" },
  { id: 569, question: "What old photo of yourself brings back the warmest, most nostalgic feelings? #569" },
  { id: 570, question: "What childhood holiday memory feels the most magical when you look back on it? #570" },

  // Favorite Vacations (571-600)
  { id: 571, question: "What is your absolute favorite vacation we have ever taken together? #571" },
  { id: 572, question: "What is a memory of a childhood family vacation that you loved the most? #572" },
  { id: 573, question: "What was the most beautiful scenic view you’ve ever experienced on a trip? #573" },
  { id: 574, question: "What is a favorite memory of a meal or restaurant from a past vacation? #574" },
  { id: 575, question: "What is a story about an unexpected adventure or detour on a trip that turned out great? #575" },
  { id: 576, question: "What is a favorite memory of a relaxing beach or resort getaway? #576" },
  { id: 577, question: "What is a memory of a bustling, exciting city exploration vacation? #577" },
  { id: 578, question: "What is a favorite souvenir or item you bought on a trip that you still cherish? #578" },
  { id: 579, question: "What is a memory of a road trip or scenic drive that you thoroughly enjoyed? #579" },
  { id: 580, question: "What made our best vacation feel so distinct and memorable to you? #580" },
  { id: 581, question: "What is a memory of a funny travel mishap that we managed to survive together? #581" },
  { id: 582, question: "What is a favorite memory of a hotel, cabin, or Airbnb we stayed in? #582" },
  { id: 583, question: "What is a memory of a historic landmark or museum tour that fascinated you? #583" },
  { id: 584, question: "What is a travel memory of interacting with locals that warmed your heart? #584" },
  { id: 585, question: "What is a memory of a vacation activity (like hiking or snorkeling) that was unforgettable? #585" },
  { id: 586, question: "What is a memory of a rainy day on vacation that turned into a fun experience? #586" },
  { id: 587, question: "What is a favorite memory of a sunrise or sunset watched while on a trip? #587" },
  { id: 588, question: "What is a memory of packing or preparing for a trip that felt incredibly exciting? #588" },
  { id: 589, question: "What is a memory of a short weekend trip that provided the perfect escape? #589" },
  { id: 590, question: "Where was a place you visited that completely exceeded your expectations? #590" },
  { id: 591, question: "What is a travel memory that shifted your perspective on a different culture? #591" },
  { id: 592, question: "What is a favorite memory of listening to music or a podcast while traveling? #592" },
  { id: 593, question: "What is a memory of a vacation where you felt completely disconnected from work stress? #593" },
  { id: 594, question: "What is a travel memory of a beautiful wildlife or nature encounter? #594" },
  { id: 595, question: "What is a memory of an amusement park or theme park trip you thoroughly enjoyed? #595" },
  { id: 596, question: "What is a memory of a unique tour or local guide who made a trip amazing? #596" },
  { id: 597, question: "What is a travel memory of a traditional celebration or festival you witnessed? #597" },
  { id: 598, question: "What is a memory of a cozy winter or snow-filled vacation? #598" },
  { id: 599, question: "What is a memory of finding a hidden gem spot that wasn't on any tourist guide? #599" },
  { id: 600, question: "What is the very first trip you want us to plan once we have the time and budget? #600" },

  // ==========================================
  // PERSONAL (601 - 700)
  // ==========================================
  // Personality (601-610)
  { id: 601, question: "Are you more of an introvert or an extrovert, and how does that affect your energy? #601" },
  { id: 602, question: "What is a personality trait you have that you think is most misunderstood by others? #602" },
  { id: 603, question: "What is your Myers-Briggs (MBTI) or Enneagram type, and does it feel accurate? #603" },
  { id: 604, question: "How do you typically handle large crowds or intense social environments? #604" },
  { id: 605, question: "What is a quirky personality trait of yours that you secretly love? #605" },
  { id: 606, question: "How has your personality shifted or matured over the past five years? #606" },
  { id: 607, question: "What trait do you look for most in a close, trustworthy friend? #607" },
  { id: 608, question: "Are you more analytical and logical, or emotional and intuitive when making choices? #608" },
  { id: 609, question: "What personality trait do you find most challenging to deal with in other people? #609" },
  { id: 610, question: "How would your closest friends describe your personality in three words? #610" },

  // Habits (611-620)
  { id: 611, question: "What is a healthy daily habit you’ve successfully built recently? #611" },
  { id: 612, question: "What is a bad habit you are actively trying to break right now? #612" },
  { id: 613, question: "What is a quirky habit you have when you are deep in thought or concentrating? #613" },
  { id: 614, question: "How do you feel when your daily routine or habits get suddenly disrupted? #614" },
  { id: 615, question: "What is a habit of mine that you find endearing or sweet? #615" },
  { id: 616, question: "What is a bedtime habit or routine that helps you fall asleep easily? #616" },
  { id: 617, question: "How do you stay accountable when trying to build a positive new habit? #617" },
  { id: 618, question: "What is a habit you picked up from your parents that you wish you hadn't? #618" },
  { id: 619, question: "What is a tech or phone habit you have that you want to reduce? #619" },
  { id: 620, question: "What is a morning habit that sets your entire day up for ultimate success? #620" },

  // Strengths (621-630)
  { id: 621, question: "What do you consider to be your single greatest personal strength? #621" },
  { id: 622, question: "How do you utilize your unique strengths to excel in your current career? #622" },
  { id: 623, question: "What is an emotional or relational strength you bring to our partnership? #623" },
  { id: 624, question: "What is a strength of mine that you constantly admire or rely on? #624" },
  { id: 625, question: "When did you first realize you possessed a specific talent or strength? #625" },
  { id: 626, question: "How do you handle compliments regarding your strengths and achievements? #626" },
  { id: 627, question: "What is a hidden strength of yours that most casual acquaintances don't see? #627" },
  { id: 628, question: "How can I better encourage you to lean into your natural strengths? #628" },
  { id: 629, question: "What is a strength you want to actively develop further over the next year? #629" },
  { id: 630, question: "How do our individual strengths complement each other to make a great team? #630" },

  // Weaknesses (631-640)
  { id: 631, question: "What is a personal weakness you struggle with that causes you frustration? #631" },
  { id: 632, question: "How does your main weakness manifest when you are under immense stress? #632" },
  { id: 633, question: "What is a weakness in communication you are actively working to fix? #633" },
  { id: 634, question: "How can I gently support or help you when a weakness gets the best of you? #634" },
  { id: 635, question: "What is a weakness you’ve managed to significantly improve over time? #635" },
  { id: 636, question: "Do you find it difficult to admit your flaws or weaknesses to others? #636" },
  { id: 637, question: "What is a weakness you have that you think actually keeps you humble? #637" },
  { id: 638, question: "How do you handle situations where a weakness impacts your professional work? #638" },
  { id: 639, question: "What is a flaw or weakness of mine that you accept and extend grace toward? #639" },
  { id: 640, question: "What is a step we can take to keep each other accountable regarding our flaws? #640" },

  // Motivations (641-650)
  { id: 641, question: "What is the ultimate driving motivation behind your career ambitions? #641" },
  { id: 642, question: "What motivates you to get out of bed and stay positive on difficult days? #642" },
  { id: 643, question: "Are you more motivated by internal satisfaction or external recognition? #643" },
  { id: 644, question: "What role does our future family play in your daily motivation levels? #644" },
  { id: 645, question: "What quote, speech, or concept always sparks instant motivation in you? #645" },
  { id: 646, question: "How do you handle seasons where you feel completely unmotivated or burnt out? #646" },
  { id: 647, question: "How can I best inspire or motivate you when you feel stuck in a rut? #647" },
  { id: 648, question: "What is a long-term dream that serves as your north star motivation? #648" },
  { id: 649, question: "How has your core life motivation changed since we started dating? #649" },
  { id: 650, question: "What makes you feel energized and ready to tackle a major challenge? #650" },

  // Pet Peeves (651-660)
  { id: 651, question: "What is your single absolute biggest petty pet peeve in daily life? #651" },
  { id: 652, question: "What is a driving or traffic-related habit of others that drives you crazy? #652" },
  { id: 653, question: "What is a texting or social media habit of others that irks you? #653" },
  { id: 654, question: "What is a minor habit of mine that is a slight pet peeve for you? #654" },
  { id: 655, question: "How do you typically react or control your annoyance when a pet peeve happens? #655" },
  { id: 656, question: "What is a public etiquette violation that always bothers you? #656" },
  { id: 657, question: "What is a pet peeve you have regarding home cleanliness or organization? #657" },
  { id: 658, question: "What is a corporate or workplace habit that you find incredibly annoying? #658" },
  { id: 659, question: "What is a word or phrase that people use that always grates on your nerves? #659" },
  { id: 660, question: "How can we communicate our minor pet peeves to each other without causing a fight? #660" },

  // Daily Life (661-670)
  { id: 661, question: "What is your absolute favorite part of an ordinary, routine weekday? #661" },
  { id: 662, question: "How do you typically decompress and transition from work mode to home mode? #662" },
  { id: 663, question: "What is your favorite meal or snack to prepare during a busy workday? #663" },
  { id: 664, question: "How organized is your typical daily workspace or desk setup? #664" },
  { id: 665, question: "What is a daily chore or task that you absolutely dread doing? #665" },
  { id: 666, question: "What is a small luxury or treat you treat yourself to during the week? #666" },
  { id: 667, question: "How do you stay organized and manage your daily tasks and to-do lists? #667" },
  { id: 668, question: "What is your absolute favorite room in your current home to spend time in? #668" },
  { id: 669, question: "How much sleep do you ideally need to feel fully functional and happy? #669" },
  { id: 670, question: "What is one thing that could make your daily routine feel much more peaceful? #670" },

  // Self-Care (671-700)
  { id: 671, question: "What does your ultimate, perfect self-care day look like from start to finish? #671" },
  { id: 672, question: "How do you know when your mental and emotional tank is completely empty? #672" },
  { id: 673, question: "What is a solo activity that always recharges your emotional battery? #673" },
  { id: 674, question: "How good are you at saying 'no' to invitations when you need rest? #674" },
  { id: 675, question: "What is a physical self-care habit (like a hot bath or a walk) that you love? #675" },
  { id: 676, question: "How does journaling or artistic expression fit into your self-care routine? #676" },
  { id: 677, question: "What boundaries do you set with social media to protect your mental health? #677" },
  { id: 678, question: "How can I best support you when you explicitly need a self-care evening? #678" },
  { id: 679, question: "What is a book, album, or piece of media that acts as comfort food for your soul? #679" },
  { id: 680, question: "What is a treat or investment in yourself that you never regret making? #680" },
  { id: 681, question: "What is your favorite type of exercise or physical movement for mental clarity? #681" },
  { id: 682, question: "How do you handle negative self-talk or periods of intense self-doubt? #682" },
  { id: 683, question: "What is a skincare or grooming routine that makes you feel refreshed? #683" },
  { id: 684, question: "How does spending time in nature contribute to your self-care? #684" },
  { id: 685, question: "What is a space in our home that you want to dedicate entirely to relaxation? #685" },
  { id: 686, question: "How do you manage stress levels during peak seasons at your job? #686" },
  { id: 687, question: "What is a comfort food meal that instantly makes a bad day feel better? #687" },
  { id: 688, question: "How easy is it for you to ask for help when you feel overwhelmed? #688" },
  { id: 689, question: "What is an emotional boundary you’ve set recently that has saved your peace? #689" },
  { id: 690, question: "What is a favorite tea, coffee, or drink that acts as a soothing ritual? #690" },
  { id: 691, question: "How do you make sure you get quality sleep when your mind is racing? #691" },
  { id: 692, question: "What is a hobby you do purely for joy with zero productivity goals? #692" },
  { id: 693, question: "How do you treat yourself after completing a massive, stressful project? #693" },
  { id: 694, question: "What is an outdoor spot you love to sit at just to clear your head? #694" },
  { id: 695, question: "How can we practice shared self-care together as a couple? #695" },
  { id: 696, question: "What is a scent or essential oil that instantly calms your nervous system? #696" },
  { id: 697, question: "How do you audit your schedule to remove things that drain your energy? #697" },
  { id: 698, question: "What is a reminder or affirmation you need to tell yourself more often? #698" },
  { id: 699, question: "How do you separate your self-worth from your daily productivity levels? #699" },
  { id: 700, question: "What is one thing you can do for your self-care routine before this week ends? #700" },

  // ==========================================
  // FAMILY & FRIENDS (701 - 800)
  // ==========================================
  // Family Traditions (701-710)
  { id: 701, question: "What was your absolute favorite family holiday tradition growing up? #701" },
  { id: 702, question: "Is there a unique family tradition of yours that you want us to continue? #702" },
  { id: 703, question: "How did your family celebrate birthdays or milestones when you were a kid? #703" },
  { id: 704, question: "What is a quirky or funny tradition your family has developed over the years? #704" },
  { id: 705, question: "What does an ideal Christmas or Thanksgiving holiday look like according to your family? #705" },
  { id: 706, question: "What is a tradition you want us to start entirely on our own as a couple? #706" },
  { id: 707, question: "How does your family handle gift-giving during major celebrations? #707" },
  { id: 708, question: "What is a summer or seasonal family tradition you look forward to? #708" },
  { id: 709, question: "How has your appreciation for family traditions changed as you’ve grown up? #709" },
  { id: 710, question: "What is a tradition from my family that you are excited to participate in? #710" },

  // Parenting (711-720)
  { id: 711, question: "What is a parenting choice your parents made that you will definitely replicate? #711" },
  { id: 712, question: "What is a parenting style or mistake you want to avoid completely? #712" },
  { id: 713, question: "How do you want to handle screens and technology boundaries with future children? #713" },
  { id: 714, question: "What is your view on the balance of praise and discipline in raising kids? #714" },
  { id: 715, question: "How do you want to teach future children about financial responsibility? #715" },
  { id: 716, question: "What role should extracurricular sports or arts play in a child’s life? #716" },
  { id: 717, question: "How will we handle disagreements about parenting choices in front of our kids? #717" },
  { id: 718, question: "How do you want to foster open communication and trust with a teenager? #718" },
  { id: 719, question: "What is a core character trait you hope our future children inherit from me? #719" },
  { id: 720, question: "How can we ensure our marriage remains the solid foundation while parenting? #720" },

  // Siblings (721-730)
  { id: 721, question: "What is your absolute favorite memory with one of your siblings? #721" },
  { id: 722, question: "How would you describe your current dynamic with each of your siblings? #722" },
  { id: 723, question: "What was the biggest rivalry or argument you had with a sibling growing up? #723" },
  { id: 724, question: "How have your relationships with your siblings matured as you’ve become adults? #724" },
  { id: 725, question: "What is a trait you share with a sibling that always makes you laugh? #725" },
  { id: 726, question: "If you are an only child, how did that shape your imagination and independence? #726" },
  { id: 727, question: "What is a sibling’s achievement that you are incredibly proud of? #727" },
  { id: 728, question: "How do you want our future children’s sibling dynamics to look? #728" },
  { id: 729, question: "What is an inside joke or code word you only share with your siblings? #729" },
  { id: 730, question: "How can we best support your siblings through their current life seasons? #730" },

  // Friendships (731-740)
  { id: 731, question: "Who do you consider to be your closest, most trusted friend right now? #731" },
  { id: 732, question: "What qualities make someone a truly exceptional friend in your eyes? #732" },
  { id: 733, question: "What is your favorite memory of a wild or fun adventure with friends? #733" },
  { id: 734, question: "How do you maintain long-distance friendships over years of life changes? #734" },
  { id: 735, question: "What is a boundary you maintain to keep your friendships healthy? #735" },
  { id: 736, question: "Have you ever had to break off a toxic friendship, and how did it feel? #736" },
  { id: 737, question: "What is an area where a friend recently supported you in a massive way? #737" },
  { id: 738, question: "How do you handle jealousy or comparison within your friend group? #738" },
  { id: 739, question: "What is a shared hobby or interest that anchors your core friendships? #739" },
  { id: 740, question: "How do you feel about your partner hanging out with your friends without you? #740" },

  // Social Life (741-750)
  { id: 741, question: "What is your ideal balance between social outings and quiet nights at home? #741" },
  { id: 742, question: "Do you prefer hosting dinner parties or attending social events at venues? #742" },
  { id: 743, question: "What is your go-to role or vibe when hanging out in a large group? #743" },
  { id: 744, question: "How do you feel about making new friends at this current stage in life? #744" },
  { id: 745, question: "What is your absolute favorite group activity or game night setup? #745" },
  { id: 746, question: "How do you handle social exhaustion or burnout after busy weekends? #746" },
  { id: 747, question: "What kind of couple friends do you hope we cultivate in the future? #747" },
  { id: 748, question: "What is a social scene or environment you’ve completely outgrown? #748" },
  { id: 749, question: "How can we best support each other’s differing social battery levels? #749" },
  { id: 750, question: "What is a dream social gathering or celebration you want us to host? #750" },

  // Future Family (751-760)
  { id: 751, question: "What family size feels absolutely perfect to you for our future? #751" },
  { id: 752, question: "Where do you want our future family to be rooted geographically? #752" },
  { id: 753, question: "What kind of relationship do you want our future kids to have with extended family? #753" },
  { id: 754, question: "How do you want to handle holiday rotations between our families in the future? #754" },
  { id: 755, question: "What legacy or values do you want our future family unit to be known for? #755" },
  { id: 756, question: "How do you feel about adopting children or fostering in the future? #756" },
  { id: 757, question: "What milestones are you most excited to experience as a future family? #757" },
  { id: 758, question: "How will we make sure our future home feels warm, safe, and welcoming? #758" },
  { id: 759, question: "What pet choices do you want to include in our future family structure? #759" },
  { id: 760, question: "What is a prayer or hope you have for our future family today? #760" },

  // Family Values (761-770)
  { id: 761, question: "What core value from your upbringing will you fight to preserve? #761" },
  { id: 762, question: "How do you define structural honor and respect within a family unit? #762" },
  { id: 763, question: "What is your view on transparency and honesty regarding family finances? #763" },
  { id: 764, question: "How should a family handle major internal conflicts and disagreements? #764" },
  { id: 765, question: "What value does your family place on higher education versus life experience? #765" },
  { id: 766, question: "How do you want our family value system to handle community service? #766" },
  { id: 767, question: "What is your philosophy on keeping family matters private versus seeking outside help? #767" },
  { id: 768, question: "How do you want to pass down our shared faith values to the next generation? #768" },
  { id: 769, question: "What family value of mine do you respect and appreciate the most? #769" },
  { id: 770, question: "How can we create a written 'family mission statement' for our future? #770" },

  // Childhood Home (771-780)
  { id: 771, question: "What did your childhood bedroom look like, and what posters were on the wall? #771" },
  { id: 772, question: "What was the neighborhood vibe like around your childhood home? #772" },
  { id: 773, question: "What is a specific sound or smell that reminds you of your childhood house? #773" },
  { id: 774, question: "What was your favorite secret spot or hiding place in or around that home? #774" },
  { id: 775, question: "How did your childhood home environment influence your current living preferences? #775" },
  { id: 776, question: "What is a memory of a backyard game or outdoor activity at that house? #776" },
  { id: 777, question: "Who were the most prominent neighbors you remember from growing up? #777" },
  { id: 778, question: "What was a rule in your childhood home that you thought was totally unfair? #778" },
  { id: 779, question: "What is a memory of a family movie or game night in that living room? #779" },
  { id: 780, question: "How does it feel when you visit or think about your childhood home today? #780" },

  // In-laws (781-800)
  { id: 781, question: "What were your genuine first impressions of my parents and family? #781" },
  { id: 782, question: "What is something you appreciate about how my family has welcomed you? #782" },
  { id: 783, question: "What is a topic or boundary you want us to maintain with our families? #783" },
  { id: 784, question: "How can I best support you during intense periods of family gatherings? #784" },
  { id: 785, question: "What is a trait of my parents that you hope I emulate or maintain? #785" },
  { id: 786, question: "How do you want to handle advice or opinions from in-laws regarding our marriage? #786" },
  { id: 787, question: "What is a fun memory you share with one of my family members? #787" },
  { id: 788, question: "How can we build a deeper, more comfortable connection with your in-laws? #788" },
  { id: 789, question: "What scares you the most about dealing with future in-law dynamics, if anything? #789" },
  { id: 790, question: "How can we ensure our marriage remains the primary partnership over family demands? #790" },
  { id: 791, question: "What is a traditional meal or custom from my family that you genuinely enjoy? #791" },
  { id: 792, question: "How do you feel about extended family staying over at our home for long visits? #792" },
  { id: 793, question: "What is a piece of guidance from my parents that you found helpful? #793" },
  { id: 794, question: "How can I help you feel more relaxed and at ease around my extended family? #794" },
  { id: 795, question: "What is an area where our families' cultural dynamics differ, and how do we navigate it? #795" },
  { id: 796, question: "How do you want to celebrate future major holidays with both sets of parents? #796" },
  { id: 797, question: "What is a funny misunderstanding that happened with an in-law early on? #797" },
  { id: 798, question: "How do you want to support our parents as they navigate retirement and old age? #798" },
  { id: 799, question: "What makes you feel proudest of how we handle our family dynamics? #799" },
  { id: 800, question: "What is one goal you have for our relationship with our extended families this year? #800" },

  // ==========================================
  // TRAVEL (801 - 850)
  // ==========================================
  // Dream Destinations (801-807)
  { id: 801, question: "If we could board a flight tonight to any dream destination, where are we going? #801" },
  { id: 802, question: "What destination has been on your bucket list since you were a teenager? #802" },
  { id: 803, question: "What country’s history and architecture are you most eager to see in person? #803" },
  { id: 804, question: "What is your absolute dream tropical island paradise escape? #804" },
  { id: 805, question: "If we had to pick an absolute dream city for an anniversary trip, where is it? #805" },
  { id: 806, question: "What remote, untouched corner of nature do you dream of exploring? #806" },
  { id: 807, question: "What is a dream landmark destination you want us to take a photo in front of? #807" },

  // Road Trips (808-814)
  { id: 808, question: "What is your ultimate dream road trip route in the world? #808" },
  { id: 809, question: "What are your absolute top three non-negotiable road trip snacks? #809" },
  { id: 810, question: "Who is the primary DJ on a road trip, and what genre are we listening to? #810" },
  { id: 811, question: "Do you prefer driving through scenic mountain passes or coastal highways? #811" },
  { id: 812, question: "What is a funny or memorable road trip mishap from your past? #812" },
  { id: 813, question: "How do you handle navigating versus driving when we are on a long road trip? #813" },
  { id: 814, question: "What is a quirky roadside attraction you’d love for us to stop at? #814" },

  // Adventure Travel (815-820)
  { id: 815, question: "What is an intense adventure sport (like skydiving or rafting) you want us to try? #815" },
  { id: 816, question: "What is your dream multi-day hiking or backpacking trail itinerary? #816" },
  { id: 817, question: "Would you ever want to go on a wildlife safari in Africa together? #817" },
  { id: 818, question: "How do you feel about extreme camping under the stars versus luxury glamping? #818" },
  { id: 819, question: "What is an underwater adventure travel experience you want to check off? #819" },
  { id: 820, question: "What is the most daring physical activity you've ever done while traveling? #820" },

  // Luxury Travel (821-825)
  { id: 821, question: "What does your absolute dream 5-star luxury resort experience look like? #821" },
  { id: 822, question: "If we could fly first-class to any destination, which airline or route would you pick? #822" },
  { id: 823, question: "What is a luxury spa or wellness retreat you’ve been secretively eyeing? #823" },
  { id: 824, question: "How do you feel about booking a private villa with an infinity pool for an entire week? #824" },
  { id: 825, question: "What is a high-end luxury dining experience abroad you want us to splurge on? #825" },

  // Cultural Experiences (826-830)
  { id: 826, question: "What country’s cultural traditions or festivals do you want to experience firsthand? #826" },
  { id: 827, question: "How important is visiting historic museums and art galleries when you travel? #827" },
  { id: 828, question: "What language would you love to learn the basics of before our next big trip? #828" },
  { id: 829, question: "What is a cultural performance (like opera or traditional dance) you want to see live? #829" },
  { id: 830, question: "How has traveling to a completely different culture shifted your worldview in the past? #830" },

  // Food Travel (831-835)
  { id: 831, question: "If we did a travel tour solely based on food, what country are we choosing? #831" },
  { id: 832, question: "What is a famous street food market in the world you are dying to visit? #832" },
  { id: 833, question: "What is the most unique or exotic dish you have ever tried while traveling? #833" },
  { id: 834, question: "Would you prefer a wine-tasting tour in Tuscany or a street food crawl in Tokyo? #834" },
  { id: 835, question: "What is a cooking class you want us to take abroad to replicate back home? #835" },

  // Weekend Getaways (836-842)
  { id: 836, question: "What is your absolute favorite local city for a quick weekend escape? #836" },
  { id: 837, question: "What does a perfect, relaxing 48-hour weekend getaway look like to you? #837" },
  { id: 838, question: "Would you rather a cozy cabin weekend in the woods or a boutique hotel city weekend? #838" },
  { id: 839, question: "What is a packing essential you never forget for a short weekend trip? #839" },
  { id: 840, question: "How can we incorporate more spontaneous weekend getaways into our yearly schedule? #840" },
  { id: 841, question: "What is a scenic small town nearby that you've been wanting to explore? #841" },
  { id: 842, question: "What is your favorite playlist or vibe for a short weekend road trip? #842" },

  // Places to Live (843-850)
  { id: 843, question: "If we had to move abroad for exactly one year, what country would you pick? #843" },
  { id: 844, question: "What city do you think matches our couple personality perfectly to live in? #844" },
  { id: 845, question: "Would you prefer living in a bustling metropolitan high-rise or a quiet suburban house? #845" },
  { id: 846, question: "What is a state or province you’ve never lived in but are curious about? #846" },
  { id: 847, question: "What features must a neighborhood have for you to consider settling down there? #847" },
  { id: 848, question: "How do you feel about the digital nomad lifestyle of moving every few months? #848" },
  { id: 849, question: "What is a dream city that you love to visit but would absolutely hate to live in? #849" },
  { id: 850, question: "Where do you see us buying our absolute forever home in the future? #850" },

  // ==========================================
  // ENTERTAINMENT (851 - 900)
  // ==========================================
  // Movies (851-857)
  { id: 851, question: "What is your absolute favorite, number one movie of all time? #851" },
  { id: 852, question: "What movie universe would you secretly love to live in for a week? #852" },
  { id: 853, question: "Who is an actor or actress whose movies you will always watch no matter what? #853" },
  { id: 854, question: "What is a movie that completely changed your perspective on a specific topic? #854" },
  { id: 855, question: "What classic film have you never seen that everyone tells you to watch? #855" },
  { id: 856, question: "What is your ultimate comfort movie when you are having a down day? #856" },
  { id: 857, question: "What film soundtrack or score is a masterpiece in your opinion? #857" },

  // TV Shows (858-864)
  { id: 858, question: "What is a television series you can binge-watch over and over without getting bored? #858" },
  { id: 859, question: "What is a TV show character that you relate to on a deeply personal level? #859" },
  { id: 860, question: "What show’s series finale completely ruined the entire experience for you? #860" },
  { id: 861, question: "What is a popular, trending show that you think is completely overrated? #861" },
  { id: 862, question: "What is a reality TV competition show you’d love to compete on? #862" },
  { id: 863, question: "What is a hidden gem TV show that you wish more people knew about? #863" },
  { id: 864, question: "What is a show we started watching together that you’ve thoroughly enjoyed? #864" },

  // Music (865-871)
  { id: 865, question: "Who is your absolute favorite music artist or band at this moment? #865" },
  { id: 866, question: "What was the very first concert or live music show you ever attended? #866" },
  { id: 867, question: "What genre of music do you put on when you need to focus or work intensely? #867" },
  { id: 868, question: "What song represents the absolute soundtrack of your teenage years? #868" },
  { id: 869, question: "If you could only listen to one album for the rest of your life, what is it? #869" },
  { id: 870, question: "What is a song that always makes you want to get up and dance immediately? #870" },
  { id: 871, question: "What is your favorite Christian worship song that always brings you peace? #871" },

  // Books (872-876)
  { id: 872, question: "What book has had the single greatest impact on your intellectual growth? #872" },
  { id: 873, question: "Who is your favorite author, and what is their best piece of work? #873" },
  { id: 874, question: "Do you prefer reading fiction novels or educational non-fiction books? #874" },
  { id: 875, question: "What is a book you started reading recently that you just couldn’t put down? #875" },
  { id: 876, question: "What fictional book character do you wish was a real-life friend of yours? #876" },

  // Video Games (877-881)
  { id: 877, question: "What is a video game from your childhood that you have fond memories of? #877" },
  { id: 878, question: "Do you enjoy casual mobile games, competitive multiplayer, or solo story games? #878" },
  { id: 879, question: "What video game franchise do you think has the best storytelling? #879" },
  { id: 880, question: "Would you ever want us to play a cooperative video game together for a date night? #880" },
  { id: 881, question: "What is a gaming system or console you spent the most hours playing on? #881" },

  // Celebrities (882-886)
  { id: 882, question: "Who is a celebrity or public figure that you deeply admire for their charity work? #882" },
  { id: 883, question: "Who was your absolute biggest celebrity crush when you were a teenager? #883" },
  { id: 884, question: "If you could swap places with any famous person for 24 hours, who is it? #884" },
  { id: 885, question: "What celebrity interview or speech has resonated with you recently? #885" },
  { id: 886, question: "Who is a famous historical figure you would love to sit down and have coffee with? #886" },

  // Podcasts (887-891)
  { id: 887, question: "What is your number one go-to podcast for daily entertainment or news? #887" },
  { id: 888, question: "What educational podcast has taught you the most interesting random facts? #888" },
  { id: 889, question: "Do you prefer true crime, comedy, self-help, or interview style podcasts? #889" },
  { id: 890, question: "What is a podcast episode you listened to recently that you immediately shared with someone? #890" },
  { id: 891, question: "If we started a podcast together as a couple, what would our topic and title be? #891" },

  // Social Media (892-900)
  { id: 892, question: "What social media platform do you honestly spend the most time scrolling on? #892" },
  { id: 893, question: "What content creator or account always makes you laugh out loud? #893" },
  { id: 894, question: "How do you feel about digital detoxes or taking regular breaks from social media? #894" },
  { id: 895, question: "What is a trend on social media right now that you find completely annoying? #895" },
  { id: 896, question: "How much does social media comparison affect your daily mood or confidence? #896" },
  { id: 897, question: "What is a recipe, life hack, or DIY project you found online and actually tried? #897" },
  { id: 898, question: "How do you want us to handle posting about our relationship or future kids online? #898" },
  { id: 899, question: "What is the funniest meme or video you’ve saved to your phone recently? #899" },
  { id: 900, question: "What is an online community or group that has been helpful to your hobbies? #900" },

  // ==========================================
  // LIFESTYLE (901 - 930)
  // ==========================================
  // Food & Cooking (901-905)
  { id: 901, question: "What is your absolute favorite signature dish to cook when you want to impress? #901" },
  { id: 902, question: "Would you rather handle the cooking prep or the kitchen cleanup after a meal? #902" },
  { id: 903, question: "What is a culinary ingredient or spice you absolutely cannot cook without? #903" },
  { id: 904, question: "What is a bakery item or dessert you dream of mastering from scratch? #904" },
  { id: 905, question: "How do you feel about trying highly unusual or experimental food pairings? #905" },

  // Fitness & Health (906-910)
  { id: 906, question: "What is your favorite way to stay active that doesn't feel like a chore? #906" },
  { id: 907, question: "What health or wellness goal are you currently prioritizing the most? #907" },
  { id: 908, question: "How do you maintain consistency with your workouts during busy weeks? #908" },
  { id: 909, question: "What is a wellness trend (like ice baths or juicing) you are curious about? #909" },
  { id: 910, question: "How can we better support each other’s health and fitness lifestyle choices? #910" },

  // Home Life (911-915)
  { id: 911, question: "What is your philosophy on keeping a living space perfectly clean versus lived-in? #911" },
  { id: 912, question: "What is your absolute favorite household chore that you find weirdly relaxing? #912" },
  { id: 913, question: "How do you prefer to handle home decorating decisions as a couple? #913" },
  { id: 914, question: "What home item or appliance is worth splurging on for maximum daily comfort? #914" },
  { id: 915, question: "What makes a home feel genuinely warm, peaceful, and hospitable to guests? #915" },

  // Fashion (916-918)
  { id: 916, question: "How would you describe your personal style or fashion aesthetic in one sentence? #916" },
  { id: 917, question: "What is an item of clothing in your closet that always makes you feel confident? #917" },
  { id: 918, question: "What fashion trend do you hope absolutely never comes back into style? #918" },

  // Technology (919-921)
  { id: 919, question: "What smart home tech or gadget is an absolute game-changer for your routine? #919" },
  { id: 920, question: "How do you feel about the rapid advancement of artificial intelligence in daily life? #920" },
  { id: 921, question: "What is a boundary you set with your devices to prevent digital overload? #921" },

  // Hobbies (922-924)
  { id: 922, question: "What creative hobby or craft would you love to pick up if you had unlimited free time? #922" },
  { id: 923, question: "What hobby did you drop years ago that you’d love to rediscover now? #923" },
  { id: 924, question: "What is a hobby of mine that you love learning about or supporting me in? #924" },

  // Productivity (925-927)
  { id: 925, question: "What is your single best tip or tool for beating procrastination when unmotivated? #925" },
  { id: 926, question: "Do you prefer mapping out your week meticulously or taking things hour-by-hour? #926" },
  { id: 927, question: "What is your prime productive hour of the day where your focus peaks? #927" },

  // Daily Routines (928-930)
  { id: 928, question: "What morning routine step completely sets the tone for a successful day? #928" },
  { id: 929, question: "What does your ideal winding-down evening routine look like before bed? #929" },
  { id: 930, question: "How can we optimize our weekly routine to spend more intentional time together? #930" },

  // ==========================================
  // CREATIVE (931 - 950)
  // ==========================================
  // Alternate Realities (931-933)
  { id: 931, question: "If you existed in an alternate universe, what career or life path did you choose? #931" },
  { id: 932, question: "What minor choice in your past do you think completely altered your current reality? #932" },
  { id: 933, question: "If you could see a glimpse of your life in an alternate timeline, what would you look for? #933" },

  // Superpowers (934-936)
  { id: 934, question: "If you could possess any classic superpower, what would it be and why? #934" },
  { id: 935, question: "What is a mundane, useless superpower that would make daily life hilarious? #935" },
  { id: 936, question: "If we were a superhero duo, what would our team name and matching outfits look like? #936" },

  // Time Travel (937-939)
  { id: 937, question: "If you could travel to any historical era for exactly 24 hours, where are you going? #937" },
  { id: 938, question: "Would you rather travel 100 years into the past or 100 years into the future? #938" },
  { id: 939, question: "If you could give your 13-year-old self one piece of advice, what would it be? #939" },

  // Fantasy Worlds (940-942)
  { id: 940, question: "What fantasy novel or movie world would you love to explore in real life? #940" },
  { id: 941, question: "If you were a character in a high-fantasy setting, what role or class would you be? #941" },
  { id: 942, question: "What mythical creature would you love to have as a loyal, trained pet? #942" },

  // Zombie Apocalypse (943-945)
  { id: 943, question: "What is your definitive strategy for surviving the first 72 hours of a zombie outbreak? #943" },
  { id: 944, question: "What specific role do I have in our post-apocalyptic survival team? #944" },
  { id: 945, question: "What local store or building is our official survival base camp? #945" },

  // Create a Story / Invent Something / Design Your Dream Life (946-950)
  { id: 946, question: "If we wrote a fiction novel together, what would the central plot twist be? #946" },
  { id: 947, question: "What simple household invention do you wish existed to make life easier? #947" },
  { id: 948, question: "If you could design your dream day with zero financial or physical constraints, describe it. #948" },
  { id: 949, question: "What is a business concept that doesn't exist yet but you think would succeed? #949" },
  { id: 950, question: "If you could invent a new global holiday, what would we celebrate and how? #950" },

  // ==========================================
  // COUPLES GAME CATEGORIES (951 - 975)
  // ==========================================
  // Green Flags & Red Flags (951-954)
  { id: 951, question: "What was a major green flag you noticed about me during our very first conversations? #951" },
  { id: 952, question: "What is a behavioral red flag in friendships or dating that makes you run away instantly? #952" },
  { id: 953, question: "What is a subtle green flag in a person’s family dynamic that you admire? #953" },
  { id: 954, question: "What is a minor quirk of mine that you initially thought was a yellow flag but now love? #954" },

  // Compatibility & Guess My Answer (955-958)
  { id: 955, question: "In what area of life do you think our compatibility is absolutely off the charts? #955" },
  { id: 956, question: "Guess my absolute favorite comfort food dish when I am incredibly stressed out. #956" },
  { id: 957, question: "What is a topic where we have completely different views but perfect mutual respect? #957" },
  { id: 958, question: "Guess the exact song that I listen to the most when I am driving alone. #958" },

  // Most Likely To & Never Have I Ever (959-963)
  { id: 959, question: "Which one of us is most likely to completely lose their phone or keys on a trip? #959" },
  { id: 960, question: "Which one of us is most likely to cry during a slightly emotional movie or commercial? #960" },
  { id: 961, question: "Never have I ever broken a bone or stayed in a hospital—what is your story? #961" },
  { id: 962, question: "Which one of us is most likely to accidentally spend a fortune on a useless gadget? #962" },
  { id: 963, question: "Never have I ever forgotten an important date—have you ever done this in the past? #963" },

  // Truth Questions & Dares (964-975)
  { id: 964, question: "Truth: What is a thought about our relationship that you’ve been hesitant to voice? #964" },
  { id: 965, question: "Truth: What is your single biggest insecurity regarding how I perceive you? #965" },
  { id: 966, question: "Dare: Text me the absolute most embarrassing selfie currently sitting in your camera roll right now. #966" },
  { id: 967, question: "Truth: What is a habit of mine that you tolerate purely because you love me? #967" },
  { id: 968, question: "Dare: Call me right now and sing the chorus of your favorite pop song at the top of your lungs. #968" },
  { id: 969, question: "Truth: Have you ever looked through my social media followers out of mild curiosity or jealousy? #969" },
  { id: 970, question: "Dare: Give me a dramatic, 60-second spoken-word poetry performance about our love story. #970" },
  { id: 971, question: "Truth: What is the most childish thing you still do when you are completely alone? #971" },
  { id: 972, question: "Dare: Speak in a ridiculous foreign accent for the next three questions of this game. #972" },
  { id: 973, question: "Truth: What is a dream you have that you think I might find silly or impractical? #973" },
  { id: 974, question: "Dare: Send me a voice note describing your absolute favorite physical feature of mine in vivid detail. #974" },
  { id: 975, question: "Truth: What is something I did this week that made you feel incredibly appreciated? #975" },

  // ==========================================
  // REFLECTION (976 - 988)
  // ==========================================
  // This Week / This Month / This Year (976-979)
  { id: 976, question: "What was the absolute highest and lowest moment of your week so far? #976" },
  { id: 977, question: "What is a significant lesson you learned about yourself during this past month? #977" },
  { id: 978, question: "How has your perspective on your career goals shifted over the course of this year? #978" },
  { id: 979, question: "What is a habit or routine we changed this year that drastically improved our connection? #979" },

  // Lessons Learned & Proud Moments (980-983)
  { id: 980, question: "What is a harsh truth about personal growth that you had to accept recently? #980" },
  { id: 981, question: "What is an accomplishment from the past six months that you are incredibly proud of? #981" },
  { id: 982, question: "What did a recent failure or mistake teach you about your emotional resilience? #982" },
  { id: 983, question: "When did you feel most proud of how we handled a relationship challenge as a team? #983" },

  // Challenges Overcome & Future Improvements (984-988)
  { id: 984, question: "What is a major mental or emotional obstacle you managed to conquer recently? #984" },
  { id: 985, question: "What is an area of our communication that you want us to actively improve next month? #985" },
  { id: 986, question: "What was a stressful external situation that we successfully navigated together? #986" },
  { id: 987, question: "What is a personal win you achieved this week, no matter how small it might seem? #987" },
  { id: 988, question: "What is one promise you want to make to yourself for your personal growth this year? #988" },

  // ==========================================
  // FAITH-BASED / CHRISTIAN QUESTIONS (989 - 1000)
  // ==========================================
  { id: 989, question: "How has your personal relationship with God grown or transformed over the past year? #989" },
  { id: 990, question: "What is a specific Bible verse or passage that has brought you profound comfort recently? #990" },
  { id: 991, question: "How do you feel our relationship helps you grow closer to Christ and your calling? #991" },
  { id: 992, question: "What does practicing spiritual leadership and mutual submission look like in our future marriage? #992" },
  { id: 993, question: "How can we better incorporate shared prayer and Scripture reading into our daily routine? #993" },
  { id: 994, question: "What is a prayer request for your heart or career that you want me to commit to daily? #994" },
  { id: 995, question: "How do you handle seasons of spiritual dryness or doubt, and how can I support you? #995" },
  { id: 996, question: "What is your favorite attribute of God (e.g., grace, justice, sovereignty) to reflect on? #996" },
  { id: 997, question: "How do you see God’s hand or guidance in the story of how we met and fell in love? #997" },
  { id: 998, question: "What does building a Christ-centered home look like to you in terms of practical habits? #998" },
  { id: 999, question: "What is a ministry, charity, or mission cause you feel strongly called to serve together? #999" },
  { id: 1000, question: "What is a spiritual legacy or value you most want us to pass down to our future children? #1000" }
];

export function getQuestionOfTheDay(): QuestionData {
  const now = new Date();
  
  // Calculate local time offset day index (Epoch Day matching)
  const localTargetTimestamp = now.getTime() - (now.getTimezoneOffset() * 60 * 1000);
  const dayIndex = Math.floor(localTargetTimestamp / (1000 * 60 * 60 * 24));
  
  const targetIndex = dayIndex % QUESTIONS.length;
  return QUESTIONS[targetIndex];
}