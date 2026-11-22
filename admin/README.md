# 237 Charts — Admin (edit here, no code needed)

Everything you may need to change lives in this folder. Edit a file on **github.com**
(open the file → pencil icon ✏️ → change → **Commit changes**). The next weekly run
(every Monday, 08:00 WAT) applies it. To apply it right away: **Actions → Weekly chart → Run workflow**.

Rules for all `.csv` files: one line per entry, values separated by a comma, keep the first line (the headers).
If a value contains a comma, put it in "double quotes".

| File | What it controls | Example line |
|---|---|---|
| `eligibility.csv` | Is an artist Cameroonian? `yes` adds them, `no` keeps them out for good | `Tabaski,yes` |
| `genres.csv` | An artist's main genre | `Jovi,mboko` |
| `artists-add.csv` | Add an artist we don't know yet (with your reason/source) | `Maahlox,Cameroonian rapper born in Yaoundé` |
| `artists-remove.csv` | Remove someone who isn't an eligible artist (with reason) | `Some Channel,not a musician` |
| `channels.csv` | An artist's official YouTube channel (the ID starts with `UC`) | `Jovi,UCSG0CS2umjnuMeOYyoow5QA,@JoviLeMonstre` |
| `contact.json` | Where artist requests go (email, WhatsApp in international format) | `"whatsapp": "237681372757"` |

**Genre codes:** `makossa` · `bikutsi` · `mbole` · `njang` · `afro` · `hiphop` · `mboko` · `gospel`

**Finding a channel ID:** open the channel on YouTube → **About** / **More** → **Share channel** → **Copy channel ID**.

What you should *not* edit here: the ranking rules (weights, eligibility windows). Those are the published
methodology — changing them is a methodology update and should be announced on the Methodology page.
