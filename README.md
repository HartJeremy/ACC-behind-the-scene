# ACC · Behind the Scenes — Filming Planner PWA

Version 2: A mobile-first, installable production app for the ACC mockumentary. The same features are available on mobile, tablet, and desktop; larger screens display expanded layouts.

## What's included

- **Today** — select any planned rehearsal, see its directorial goal, no-interruption approach, target shots, and a quick capture control.
- **Shot list** — 76 imported shots, searchable and filterable by status, priority and category. Each includes shot technique, filming instructions, opportunity and story thread. Add, edit or delete shots.
- **Storylines** — 26 imported narrative beats across the mockumentary threads. Track what the audience should see and which beats still need coverage. Add beats and new storylines.
- **Actor cards** — four editable starter actor/crew cards, interview question prompts, director notes and a safe actor-brief copy view. Any approved editor can add, change, comment or mark filmed.
- **Schedule** — 19 director-plan filming windows, editable, including separate pickup sessions for arrivals and construction.
- **Footage log** — multiple video-take records with camera, filename/private link, date, review status, and editing notes. Original video is **not uploaded**.
- **Team notes** — comments on shots, story beats, rehearsals and footage references.
- **Backups** — JSON export, plus local-demo-only restore.
- **Responsive PWA** — persistent bottom navigation on mobile; all seven sections accessible through **More**. Tablet uses wider cards and split panes. Desktop uses a fixed sidebar and expanded multi-column view.

## Run the demo (no backend required)

Open `ACC_BTS_Offline_Demo.html` in a browser. This is a single-file, local-only demo. Changes are stored in that device's browser, not shared with anyone else.

For the installable PWA itself, run the folder through any static web server:

```sh
cd acc-behind-scenes-pwa
python3 -m http.server 8000
```

Then open `http://localhost:8000`. It runs in **local demo mode** until `config.js` contains a Supabase project URL and public key. Service workers require HTTPS or localhost; opening `index.html` directly as a file does not install the PWA.

## Enable shared editing (Supabase)

1. Create a Supabase project at https://supabase.com/dashboard.
2. In its **SQL Editor**, run `supabase/001_schema.sql`, then run `supabase/002_seed.sql`, `supabase/003_actor_cards.sql`, and `supabase/004_actor_cards_seed.sql` in order. The seeds import 76 shots, 26 beats, 19 sessions and 4 editable sample actor cards. Re-running it preserves existing records (`ON CONFLICT DO NOTHING`).
3. In **Authentication → Users**, invite Jeremy, Courtney, and Alex using their actual email addresses. Use only the intended team accounts. In Auth settings, set the site's deployed URL and add that URL as an allowed redirect. Restrict public signups; the app itself also forbids auto-creating accounts with email OTP.
4. In the SQL Editor, allowlist the three actual email addresses, all lowercase:

   ```sql
   insert into public.app_members(email, display_name) values
     ('jeremy@example.com','Jeremy'),
     ('courtney@example.com','Courtney'),
     ('alex@example.com','Alex')
   on conflict (email) do update set display_name=excluded.display_name, active=true;
   ```

   **Replace the two example addresses.** Don't use someone else's email without their permission.
5. Edit `config.js` with the project's **Project URL** and **publishable key** (or legacy `anon` key):

   ```js
   export const cloudConfig = {
     url: 'https://YOUR_PROJECT.supabase.co',
     publishableKey: 'YOUR_PUBLIC_PUBLISHABLE_KEY',
   };
   ```

   This key is designed for browser applications; row-level security protects the tables. **Never place the service-role or secret key into this file.**
6. Upload the complete deployable app files to a static HTTPS site, with `index.html` at the site root (for example Netlify, Cloudflare Pages, or an existing HTTPS web server). Do **not** deploy the SQL scripts or setup docs as publicly browseable files if your host publishes everything in the project folder; instead deploy only `index.html`, `config.js`, `manifest.webmanifest`, `sw.js`, icons and `src/`.
7. On all three devices, open the live HTTPS URL, choose **Sign in**, and use the emailed sign-in link. Test by editing a shot on one device; it should refresh on the other. If Realtime is disabled for the project, changes still load when the app is reopened or the browser is refreshed.

**Note:** Cloud code imports the public Supabase JavaScript v2 module from `https://esm.sh/@supabase/supabase-js@2`. This avoids an npm build step but means online access to the CDN is required when initially loading the shared app. For long-term production use, bundle and version-lock the dependency.

## Install on phones

- **iPhone:** Open the deployed HTTPS site in Safari → Share → Add to Home Screen.
- **Galaxy:** Open in Chrome → menu → Add to Home screen / Install app (wording may vary).
- **Tablet and PC:** Use the same site URL; the layout expands automatically. All app sections remain available at every width.

## Security and reliability notes

- All six editable data tables use Supabase Row Level Security, with read/write access limited to email-allowlisted authenticated team members. Client accounts cannot self-add to the allowlist.
- Optimistic version checking rejects concurrent overwrites of the **same record**. The editor must reopen after a conflict. Different records can be edited independently.
- Realtime notifications refresh data across signed-in clients. Changes require internet connectivity in cloud mode. The service worker caches the app shell only; **offline cloud editing and guaranteed offline data access are not implemented**.
- Original footage should remain in a **private shared folder**, such as Google Drive, and the app should store only the original filename or access-controlled file link.
- Keep exported JSON backups somewhere private. Use Google Drive originals as the media source of truth, not the app's footage log.
- Filming guidelines: don't interrupt rehearsal or block exits and stage routes. Prioritize adult cast footage unless any applicable permissions for children have been confirmed.
- The web app is designed for a small, trusted three-person editorial team. There is no self-service invitation interface, video hosting, offline merge queue, or integrated video editor in v1.

## Source files

| File | Purpose |
|---|---|
| `index.html` + `src/style.css` | Responsive frontend |
| `src/app.js` | Navigation, editing, local demo and shared Supabase mode |
| `src/seed.js` | Embedded 76-shot + 26-beat + 19-session local demo data |
| `config.js` | Public Supabase project settings (blank by default) |
| `supabase/001_schema.sql` | Team allowlist, RLS, tables, versioning and realtime |
| `supabase/002_seed.sql` | Initial database import from director workbook |
| `supabase/003_actor_cards.sql` | Actor cards, read-only audit log and secure collaboration policies |
| `supabase/004_actor_cards_seed.sql` | Four editable example cards |
| `manifest.webmanifest`, `sw.js`, icons | PWA installation and cached app shell |
| `ACC_BTS_Offline_Demo.html` | Dependency-free single-file local preview |
| `make_seed.py`, `make_preview.py` | Optional scripts used to generate the initial app data/demo |

## First-use acceptance check

1. On your phone, select a rehearsal and mark a shot captured.
2. Search for the shot; change its camera or add a production note.
3. Open a storyline and mark one beat covered.
4. Add a footage record with a video filename and editing note.
5. On Courtney's phone, verify that the changes appear in shared mode.
6. Reopen both phones; verify status persists.
7. Export a JSON backup.
8. Confirm the same actions can be reached on a tablet or PC.

If any shared test fails, use the local demo for reviewing the design, but **do not** treat the disconnected version as a collaboration system.

## Version 2 - Actor Cards and three-person collaboration

**New:** The **Actor cards** tab is part of the primary navigation on mobile and the full navigation on tablet and desktop. It supports:

- Add, edit, and delete a scene-specific card for any adult actor or crew member.
- Edit the actor name, storyline, timing, scene setup, directions, interview questions (one question per line), optional filmed action, shot IDs, director's goal, internal director notes and status.
- A **Shareable actor brief** view and **Copy actor brief** action. These exclude internal director notes/punchlines. The actor is not invited to the database by default.
- Team notes on any card, last editor metadata, and a server-side audit history for created/edited/deleted actor cards (including before/after snapshots). The detail view lists the most recent changes. Only approved editors have access.
- Existing shot lists, story beats, schedule, footage records, and comments stay editable. A **New actor card** shortcut is available from a storyline.
- Mobile bottom navigation: **Today, Shot list, Actor cards, More**. All sections remain available under More and via the expanded desktop sidebar.

**Important:** The demo is *not* shared. Every browser/device has independent data until you deploy and connect the Supabase backend. The three editors have equal content editing rights in v2; only the Supabase project administrator can allowlist additional email addresses.

### Enable on a new or existing Supabase project

1. New project: run `001_schema.sql`, `002_seed.sql`, `003_actor_cards.sql`, and `004_actor_cards_seed.sql` **in that order**. Existing v1 project: run **only** `003_actor_cards.sql` then `004_actor_cards_seed.sql`, preserving all prior edits.
2. Invite **Jeremy, Courtney, and Alex** in Supabase Authentication using their real email addresses. Configure your HTTPS URL as an allowed redirect. Do not enable unrestricted public signup.
3. In SQL Editor, insert their **actual lowercase** addresses into `public.app_members` (no addresses are hardcoded or assumed):

   ```sql
   insert into public.app_members(email,display_name) values
     ('REPLACE_WITH_JEREMY_EMAIL','Jeremy'),
     ('REPLACE_WITH_COURTNEY_EMAIL','Courtney'),
     ('REPLACE_WITH_ALEX_EMAIL','Alex')
   on conflict(email) do update set display_name=excluded.display_name, active=true;
   ```

4. Configure `config.js` with your public Supabase URL/publishable key, deploy the app shell files over HTTPS, and have all three people sign in. Never include a service-role key in client code.
5. Test: Courtney creates a card; Alex edits a question; Jeremy views the updated card and its change history. Confirm edits show on the other device after a refresh, and that the actor-facing brief excludes director notes.

The example cards (Glen, Bryan, Johanna, and an adult choir member) are **editable starting points**, not approved scripts. Do not film or share other people's personal information without consent.

### Reliability constraints

- Edits to different records can be made independently. If two editors change **the same record at the same time**, the second save is rejected on version mismatch and the editor must reload/reapply their changes; this prevents silent overwrites.
- Cloud editing requires internet. The local demo supports basic local persistence, and a v1 local demo's saved shots/notes are carried forward automatically.
- Audit history is retained for actor cards; other records show last editor and team comments, not a complete prior-version history.
- Live multiuser cloud operation is **not verified** until you connect a Supabase project and perform the three-person check above.

## Version 3 - Connections board (optional)

**New:** a detective-style **Connections board** is in the navigation on phone, tablet and desktop. It is an editorial planning view, not a separate store of storylines or actor cards.

- Story pins are derived automatically from the current `story_beats`, `shots`, and `actor_cards` records. New storylines appear automatically; removing the last record for a storyline removes its pin.
- Actor pins come directly from actor cards. Changing an actor's name, scene title or storyline in Actor Cards updates the board automatically.
- Dotted blue strings are automatic actor-card-to-storyline memberships. They cannot be removed independently; change the actor card's **Storyline** field instead.
- Deliberate links between any two storylines or actor cards can be **added, edited, marked as Idea/Confirmed/Cut or deleted**. These are stored in `board_links` and synchronized in shared mode after v3's database migration.
- Three **Idea** connections are included as optional creative prompts: Missing Turkey / Colonial Ghost, The Legend of Jim S / Bryan vs Everybody, and Four Boxes One Choir / Bryan vs Everybody. These are suggestions, not established events.
- Tap a storyline pin and choose **Rename storyline** to change that name throughout story beats, shot assignments, actor cards and links. This performs one SQL transaction in cloud mode. **Do not rename a storyline by manually changing only one story beat**; that changes its assignment instead of globally renaming it.
- The mobile board defaults to a focused storyline and a readable vertical evidence wall. Select **All storylines** to see the entire board; desktop presents multiple columns. The connections list underneath gives every connection an accessible Edit/Delete control, including on a phone.
- The positions of pins are determined by layout automatically; **manual dragging/repositioning is not yet implemented**. This intentionally avoids storing a second set of positions that could become stale as the narrative changes.
- If a board link points to a deleted storyline or actor card, the connection remains visible in the editable list as **Needs reconnection** rather than being silently deleted.

### Database migration

**New project:** run SQL migrations `001_schema.sql`, `002_seed.sql`, `003_actor_cards.sql`, `004_actor_cards_seed.sql`, and **`005_connections_board.sql`** in that order. Then allowlist the three approved editors and configure `config.js` as documented above.

**Existing v2 project:** run **only `005_connections_board.sql`** in the Supabase SQL Editor; it creates `board_links`, adds RLS/Realtime, seeds the three optional Idea links without replacing edits, and adds the transaction-safe `acc_rename_storyline` RPC. Deploy the complete v3 frontend; do not replace the existing data tables or seed over edited records.

The v3 offline demo retains browser-local edits only and is **not** a shared database. Multi-device synchronization and the rename RPC must be verified after configuring and deploying your own Supabase instance. Test on both phones: create a new link, change an actor-card title, rename a storyline from the board, and verify the other device receives each change.
