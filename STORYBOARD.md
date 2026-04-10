# Portfolio Card Storyboards

Presentation plays in the banner when a card is clicked.
Short, entertaining, makes Miguel marketable.

Generate images at 1920x1080 (16:9). Dark theme, blue/cyan accents, modern tech aesthetic.
Save to `public/showcase/` as `{project}-{frame}.png`.

---

## 1. DTR System

**Format:** 3 slides (~8s total)

### Frame 1
**Image:**
Team org chart — 3 senior devs, 1 senior QA, 1 junior dev
maintaining a DTR system. Role tags on each node.
Arrow pointing to one person: Miguel.

**Script:**
"A DTR system maintained by 5 people.
Miguel built a solo POC to prove AI can cut that cost."

**ChatGPT Prompt:**
```
Create a 1920x1080 dark-themed tech infographic. On the left side, show a corporate org chart with 5 connected nodes: 3 labeled "Senior Dev", 1 labeled "Junior Dev", and 1 labeled "Senior QA". Each node is a rounded rectangle with a subtle person icon and a role tag beneath it. All 5 nodes are connected by thin lines to a central box labeled "DTR System". This represents the current team. Separate from this group, on the right side, show a single person highlighted with a glowing cyan/blue border labeled only "Miguel" with an arrow pointing toward the DTR System — use the attached photo as reference for Miguel's face on this node. Miguel is not part of the current team; he is an outsider building a solo POC. The background is dark navy/charcoal with a subtle grid pattern. Use blue and cyan accent colors throughout. Modern, clean, corporate-tech aesthetic.
```

### Frame 2
**Image:**
Code editor with Node.js/Express code on left,
MongoDB aggregation pipeline on right.
Calendar view UI in the center. One-man operation feel.

**Script:**
"Full-stack solo build — Express REST API,
MongoDB, AngularJS. One dev. No docs. No onboarding."

**ChatGPT Prompt:**
```
Create a 1920x1080 dark-themed developer workspace scene. On the left third, show a code editor panel with visible Node.js/Express route handler code (dark syntax-highlighted theme, blue and green tokens). On the right third, show a MongoDB aggregation pipeline query with bracket-heavy JSON syntax. In the center, show a calendar/scheduling UI component with a monthly grid view, time slots, and employee names — resembling a Daily Time Record app. At the bottom, include a subtle banner reading "1 Dev. No Docs. No Onboarding." in a monospace font. The overall feel should be a one-man operation — one screen, multiple panels, everything built solo. Dark navy/charcoal background with blue/cyan accents. Modern tech aesthetic.
```

### Frame 3
**Image:**
Before/after — "Current: 5-person team" vs
"POC: 1 dev + AI". Cost reduction graph going down.
"Proof of Concept Delivered" badge.

**Script:**
"The POC proved it. AI-assisted development
can dramatically reduce labor cost."

**ChatGPT Prompt:**
```
Create a 1920x1080 dark-themed before/after comparison infographic. Split the image into two halves with a vertical divider. LEFT SIDE labeled "BEFORE" at the top: show 5 person icons in a row with the text "5-Person Team". RIGHT SIDE labeled "AFTER" at the top: show Miguel (use the attached photo as reference) next to a robot/AI icon with the text "Miguel + AI". No role labels on Miguel, just his face. Below the comparison, show a line graph trending sharply downward labeled "Labor Cost Reduction". In the bottom-right corner, place a prominent badge/seal graphic that reads "Proof of Concept Delivered" with a checkmark, glowing in cyan. Dark navy/charcoal background with blue and cyan accents. Clean, modern, corporate-tech infographic style.
```

---

## 2. PPE Detection (Thesis)

**Format:** 4 slides (~12s total)

### Frame 1
**Image:**
CCTV feed of construction site. Workers with/without PPE.
YOLOv9 bounding boxes with confidence scores
around hardhats, vests, goggles.

**Script:**
"Construction sites are dangerous.
Miguel built an AI that watches."

### Frame 2
**Image:**
Training dashboard — loss curves dropping, mAP climbing to 92%+.
Labeled dataset samples. Google Colab notebook in background.

**Script:**
"Fine-tuned YOLOv9 on a custom dataset —
92%+ mAP on hardhat, vest, and goggle detection."

### Frame 3
**Image:**
Phone mockup — Telegram alert with violation screenshot.
Red highlight on missing PPE.
Message: "PPE VIOLATION - Zone B - No Hardhat".

**Script:**
"Violations trigger instant Telegram alerts
to site managers. Real-time."

### Frame 4
**Image:**
Thesis defense scene — projector showing model architecture.
"PASSED" stamp overlay.

**Script:**
"Defended and passed.
Computer vision thesis, Mapua University '25."

---

## 3. Sheets-to-Form Automation

**Format:** 3 slides (~8s total)

### Frame 1
**Image:**
Google Sheets with hundreds of rows.
Arrow pointing to a web form with empty fields.
Clock icon showing hours wasted.

**Script:**
"Hundreds of rows. One web form.
Hours of copy-paste. Miguel said no."

### Frame 2
**Image:**
Chrome extension popup next to browser.
Selenium bot filling form fields automatically,
green checkmarks appearing.

**Script:**
"Chrome extension + Flask + Selenium —
reads the sheet, fills the forms, handles errors."

### Frame 3
**Image:**
Before/after — "Manual: 4 hours" vs "Automated: 3 minutes".
Rocket icon. Productivity graph going up.

**Script:**
"Hours of manual work eliminated.
One click, done."

---

## 4. Food Price Forecasting

**Format:** 3 slides (~8s total)

### Frame 1
**Image:**
Philippine market scene with floating price tags
showing upward trends. Line chart overlay
of volatile food prices over time.

**Script:**
"Food prices in the Philippines are unpredictable.
Miguel built a model to forecast them."

### Frame 2
**Image:**
Orange Data Mining workflow canvas with connected nodes.
Inset: ARIMA equation, seasonal decomposition chart
(trend + seasonal + residual).

**Script:**
"ARIMA time-series model with seasonal decomposition
and stationarity testing."

### Frame 3
**Image:**
Forecast chart — solid historical line,
dashed prediction with confidence interval band.
Accuracy metrics (MAE, RMSE) displayed.

**Script:**
"Forecasts commodity prices with measurable accuracy.
Data science in action."

---

## 5. Local LLM App

**Format:** 3 slides (~8s total)

### Frame 1
**Image:**
Laptop running locally — wifi icon crossed out.
Terminal showing Mistral-7B loading.
RAM/GPU usage meters. "100% LOCAL" badge.

**Script:**
"No API keys. No cloud. Miguel runs a 7B parameter
LLM on a single GPU."

### Frame 2
**Image:**
Architecture flowchart — User prompt > LangChain >
vector store (RAG) > Mistral-7B via HuggingFace >
response. Clean arrows.

**Script:**
"LangChain orchestration + RAG pipeline +
quantized Mistral-7B inference."

### Frame 3
**Image:**
Chat interface — user asks a technical question,
LLM responds with sourced answer.
"Runs Offline" badge.

**Script:**
"A fully local AI assistant.
Private, fast, and surprisingly capable."

---

## 6. YouTube Q&A Tool

**Format:** 3 slides (~8s total)

### Frame 1
**Image:**
YouTube player showing a 2-hour video.
Question mark bubbles floating above.
"Too long; didn't watch" text.

**Script:**
"A 2-hour YouTube video. You have one question.
Miguel built a tool for that."

### Frame 2
**Image:**
Pipeline diagram — YouTube URL > transcript extraction >
text chunking > embedding vectors > vector database.
Auto-GPT agent orchestrating.

**Script:**
"Auto-GPT extracts transcripts, chunks text,
embeds vectors, and retrieves answers."

### Frame 3
**Image:**
Chat interface — user asks
"What did they say about quantum computing at 45:00?"
Gets a precise answer with timestamp.

**Script:**
"Ask anything about any video.
Get precise answers with timestamps."

---

## 7. RPSLS Game

**Format:** 3 slides (~8s total)

### Frame 1
**Image:**
5 RPSLS gestures in a circle with arrows showing
what beats what. Accenture event banner in background.

**Script:**
"Rock Paper Scissors Lizard Spock —
built for Accenture's Digital Data Day."

### Frame 2
**Image:**
Microsoft Teams chat showing RonnieAI bot.
Adaptive Card with hand gesture buttons.
Bot showing game result with emoji.

**Script:**
"Deployed as RonnieAI on Microsoft Bot Framework
with Adaptive Cards."

### Frame 3
**Image:**
Event scene — people at conference playing on phones.
Leaderboard showing top players.

**Script:**
"Live at the event. Real players.
Real competition. Built by Miguel."

---

## 8. HTTYD Telegram Bots

**Format:** 3 slides (~8s total)

### Frame 1
**Image:**
Multiple Telegram chat windows with different
dragon bots (Toothless, Stormfly).
Distinct personality-colored bubbles.
"How To Train Your AI Dragon" title.

**Script:**
"What if you could chat with dragons?
Miguel built the bots for that."

### Frame 2
**Image:**
BotFather setup screen. Personality prompt templates
for each dragon. Conversation flow diagram.

**Script:**
"Each dragon has a unique personality —
Telegram BotFather + custom AI prompts."

### Frame 3
**Image:**
Players interacting with dragon bots in game.
Dragons giving quests and reacting to choices.
Colorful, game-like atmosphere.

**Script:**
"An interactive AI game where every dragon
talks, thinks, and reacts differently."

---

## 9. Genie Game

**Format:** Video (already produced)

Videos exist: enter.mp4, greet.mp4, idle.mp4,
wish.mp4, win1/2.mp4, lose1/2.mp4, warn2.mp4

### Suggested enhancement — intro card (optional)

**Image:**
"Inspire Event 2024" title.
ElevenLabs waveform + CapCut lip-sync visual.
Tech stack badges.

**Script:**
"Voice generated with ElevenLabs.
Lip-synced with CapCut. Built for Inspire."

---

## 10. Hackathon Videos

**Format:** Video (already produced)

Videos exist: recruit-bolt.mp4, specsync.mp4, r-factchecker.mp4
(thumbnail picker already working)

### Suggested enhancement — intro card (optional)

**Image:**
Devpost logo + hackathon banners for all 3 projects.
"3 Hackathons. 3 AI Solutions."
Amazon Polly waveform.

**Script:**
"Three hackathon entries.
All narrated with Amazon Polly TTS. All built by Miguel."
