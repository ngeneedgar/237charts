# YouTube API quota extension — answers to copy into Google's form

**Form:** YouTube API Services — *Audit and Quota Extension Form*: https://support.google.com/youtube/contact/yt_api_form
Submit it yourself, signed in with the Google account that owns the API key. Prepared 2026-11-22.

## Before you start (you need these)
1. **Google Cloud project number** — https://console.cloud.google.com → pick the project that holds `YOUTUBE_API_KEY` → Dashboard → *Project number* (digits). Also note the *Project ID*.
2. **Links:** site https://237charts.pages.dev · privacy https://237charts.pages.dev/en/privacy/ · terms https://237charts.pages.dev/en/terms/ · methodology https://237charts.pages.dev/en/methodology/
3. **Screenshots** (the form asks for them): the home page, the Top 50, one song page (shows the YouTube link), the methodology page. Phone screenshots are fine.

## Answers

**Organization / developer name:** 237 Charts (independent, Cameroon). Use your own name as contact.

**Website of the API client:** https://237charts.pages.dev

**Is the app public?** Yes — a free public website, no login for visitors.

**What does your API client do? (use case)**
> 237 Charts is a free weekly music chart for Cameroon (Cameroonian artists only). Every Monday it ranks songs using public listening data. YouTube views are the largest input (50% of the score), together with Shazam Cameroon chart positions and Deezer popularity. The method is published on our Methodology page.
> We use the YouTube Data API only to read public data: we look up the official channels of Cameroonian artists, list their uploads, and read the public view counts of those videos once a week. The weekly increase in views of a song's official videos is one input of its chart score. Each chart entry links to the official video on YouTube.

**Which API endpoints do you use?**
> channels.list (find/verify official artist channels, uploads playlist) · playlistItems.list (list uploads) · videos.list (public view counts, in batches of 50) · search.list (only to find the official channel of a newly added artist; capped per run).

**How often?** Once a week (Mondays 07:00 UTC), plus an occasional manual re-run after the editorial team corrects data.

**Do you access private/user data or use OAuth?** No. Only public channel and video data with an API key. No YouTube user accounts, no sign-in, no uploads, no comments.

**How is YouTube data shown to users?**
> We show the song title, artist and a link to the official YouTube video. We do not show or redistribute videos, and we do not show raw view counts as our own metric; views are one input to a weekly chart position. YouTube is credited on every page ("Ranked from YouTube views, …; not affiliated with YouTube").

**Current usage and why you need more quota**
> Today a weekly run uses about 150–400 units. The limit we hit is search.list (100 units per call): we track ~300 Cameroonian artists and still need to find the official channel of ~130 of them, and new artists are discovered every week. With 10,000 units/day we can only run a few dozen searches, and the daily search limit already stopped one run. We also want to cover more of each artist's catalogue (videos.list for ~2,000–5,000 videos weekly).

**Requested quota:** 30,000 units per day.
> Breakdown: up to ~200 channel searches when onboarding new artists (≈20,000 units), weekly view counts for up to 5,000 videos (≈100 units), channel/playlist reads (≈1,000 units), plus headroom for a manual re-run after corrections.

**Privacy policy URL:** https://237charts.pages.dev/en/privacy/ (it links to the Google Privacy Policy and explains our use of YouTube API Services).
**Terms URL:** https://237charts.pages.dev/en/terms/ (it requires users to agree to the YouTube Terms of Service).

**Data storage (they will ask — answer honestly):**
> We store public view counts of tracked videos to compute weekly increases (a song's weekly views = this week's count − last week's count), and we store the resulting chart positions. We refresh YouTube data every week and delete raw YouTube API data older than 30 days; published charts keep only our derived ranking (position, movement), not YouTube data.

> ⚠️ This last sentence must be true before you submit — see "Our side" below.

## Our side (to do before submitting)
- **30-day rule:** YouTube's Developer Policies require refreshing or deleting stored API data after 30 days. Today we keep every weekly YouTube snapshot (`collector/out/snapshots/youtube-*.json`) in the public repository. Before applying, the weekly run should delete YouTube snapshots older than 30 days (we only ever need the last one or two) — ask Claude to add this; it is a small change.
- Check the Privacy page mentions YouTube API Services and links Google's privacy policy (it does) and the Terms page links the YouTube ToS (it does).

## After submitting
- Google usually replies by email within a few weeks and may ask for a short screen recording or more screenshots.
- Keep the email thread; quota is granted per Cloud project.
