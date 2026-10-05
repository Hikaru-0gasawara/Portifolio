---
name: Hikaru Ogasawara — Portfólio
description: A playable pixel-art room at night; dark moss ground, paper-white mono text, gold for the one thing in focus.
colors:
  ground: "#0A0F0B"
  panel: "#0D130F"
  panel-raised: "#131B15"
  os-warm: "#1a1f12"
  hairline: "rgba(232,228,212,.11)"
  hairline-strong: "rgba(232,228,212,.2)"
  paper: "#E8E4D4"
  muted: "#A3AD9F"
  dim: "#7F8A7C"
  gold: "#D8B24A"
  gold-bright: "#F0CE6A"
  jade: "#62B37F"
  jade-bright: "#8FD3A6"
  sky: "#7FB2DA"
  sky-bright: "#A9CDEA"
  signal-red: "#E04A3A"
typography:
  display:
    fontFamily: "Anybody, Helvetica Neue, sans-serif"
    fontSize: "clamp(72px, 8.4vw, 128px)"
    fontWeight: 900
    lineHeight: 0.8
    fontVariation: "'wdth' 56"
  statement:
    fontFamily: "Anybody, Helvetica Neue, sans-serif"
    fontSize: "clamp(22px, 2.15vw, 31px)"
    fontWeight: 500
    lineHeight: 1.16
    fontVariation: "'wdth' 86"
  body:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    letterSpacing: ".12em"
  pixel:
    fontFamily: "DotGothic16, JetBrains Mono, monospace"
    fontWeight: 400
  os-body:
    fontFamily: "JetBrains Mono, DotGothic16, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.55
  os-title:
    fontFamily: "JetBrains Mono, DotGothic16, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: ".02em"
  os-heading:
    fontFamily: "DotGothic16, JetBrains Mono, monospace"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.3
  os-clock:
    fontFamily: "Anybody, JetBrains Mono, sans-serif"
    fontSize: "clamp(64px, 12vw, 172px)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-.01em"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 140"
rounded:
  none: "0px"
spacing:
  tile-gap: "8px"
  os-bar: "30px"
  os-title: "28px"
  os-dock: "44px"
  touch: "44px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ground}"
    rounded: "{rounded.none}"
    height: "48px"
    padding: "0 22px"
  button-primary-hover:
    backgroundColor: "{colors.gold-bright}"
    textColor: "{colors.ground}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    height: "48px"
    padding: "0 22px"
  os-button:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ground}"
    typography: "{typography.os-title}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  os-button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  os-tile:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
  os-tile-title:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.muted}"
    typography: "{typography.os-title}"
    height: "{spacing.os-title}"
  os-tile-title-focused:
    backgroundColor: "{colors.os-warm}"
    textColor: "{colors.gold-bright}"
  os-workspace-active:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ground}"
    height: "24px"
    padding: "0 9px"
  os-tab:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.muted}"
    height: "28px"
    padding: "0 8px"
  os-tab-active:
    backgroundColor: "{colors.os-warm}"
    textColor: "{colors.gold-bright}"
---

# Design System: Hikaru Ogasawara — Portfólio

## Overview

**Creative North Star: "The Room at Night"**

The portfolio is a pixel-art bedroom seen late at night: a dark moss-green ground, warm paper-white text, and gold light falling on whatever is in focus right now. Everything the visitor touches lives inside that room: the HUD and ground strip framing the scene, the TV, and the room computer, which boots into okwm, a keyboard-first tiling window manager. The interface reads like a terminal that learned to draw: monospaced copy, translucent paper hairlines, square corners, and pixel art scaled without smoothing.

Density is high and calm. Copy is set in mono at 12–14px, panels are tonal steps of the same green-black, and color is spent on meaning: gold marks focus and the primary action, jade marks what is alive or done, sky marks links, paths and data, red marks alerts, closing and power. The pixel-art language is a confirmed brand commitment (PRODUCT.md) and every interface in PT, EN and JA must hold up, with Japanese never breaking inside navigation words or titles.

**Key Characteristics:**
- One green-black ground (#0A0F0B) with two tonal panel steps; no other surface hues.
- 1px translucent paper hairlines instead of gray borders; square corners everywhere in interface chrome.
- Three faces with fixed jobs: JetBrains Mono for content, DotGothic16 for pixel labels and headings, Anybody for big set pieces.
- Pixel art rendered `pixelated` / `crispEdges` at integer scale.
- The site's own Movimento (Motion) setting governs reduced motion everywhere, including okwm.

## Colors

A near-black moss palette lit by one warm gold, with jade and sky as quiet signal colors and red reserved for alarm.

### Primary
- **Lamp Gold** (gold): the one current thing. Active workspace chip, focused tile border, primary buttons, text selection, focus outlines on the site, link color on the page, the neofetch logo and folder icons.
- **Lit Gold** (gold-bright): hover state of gold buttons, focused tile title text, okwm focus-visible outline (2px, inset), split-line and gutter highlight, caret color, box titles in the monitor.

### Secondary
- **Jade Signal** (jade / jade-bright): live, running, OK. Open-app underline in the dock, FPS graph bars at healthy rates, terminal user name, now-playing track, chips in previews, the ghost button's hover.
- **Paulista Sky** (sky / sky-bright): links, file paths, directories and data meters. On the site the same hues are the `--sw`/`--sw2` pair (the software side of the hardware/software selector).

### Tertiary
- **Signal Red** (signal-red): alert and destruction only. Close-button hover, power hover, FPS bars when frame rate is low, the bobbing dialogue arrow in the room, aviation lights on the skyline.

### Neutral
- **Night Moss Ground** (ground): page and okwm background, text on gold.
- **Moss Panel** (panel): tiles, launcher, cards.
- **Raised Moss** (panel-raised): tile title bars, side places list, hover fill in okwm bars.
- **Warm Lamp Panel** (os-warm, okwm only): background of the selected/focused row, tab, title bar and file item; gold text sits on it.
- **Paper Hairline** (hairline, 11% paper) and **Strong Paper Hairline** (hairline-strong, 20% paper): every divider and frame.
- **Paper** (paper): body text. **Lichen** (muted): secondary text. **Dust** (dim): metadata, captions, inactive controls.

### Named Rules
**The One Lamp Rule.** Gold marks focus, selection or the primary action, never decoration. In any view one region owns the gold border; everything else is hairline.

**The Signal Grammar Rule.** Jade means alive/ok, sky means link/path/data, red means alert/close/power. Do not swap them for variety.

**The Paper Hairline Rule.** Frames and dividers are 1px of paper at 11% or 20% opacity over the green ground, never an opaque gray.

## Typography

**Display Font:** Anybody (with Helvetica Neue, sans-serif), variable width 50–150%
**Body Font:** JetBrains Mono (with ui-monospace, Menlo, Consolas, monospace)
**Label/Pixel Font:** DotGothic16 (with JetBrains Mono, monospace)

All three are self-hosted (src/fonts.css), no CDN.

**Character:** A terminal mono carries everything readable; a dot-matrix Japanese bitmap face gives labels and headings the pixel-art voice; Anybody's variable width is the one theatrical gesture, condensed on the site and stretched wide inside okwm.

### Hierarchy
- **Display** (Anybody 900, width 56%, clamp(72px, 8.4vw, 128px), line-height 0.8, uppercase): the name on the home screen and section titles. In Japanese it switches to DotGothic16 400 at normal width.
- **Statement** (Anybody 500, width 86%, clamp(22px, 2.15vw, 31px), 1.16, max 30ch): one-line positioning statements, with gold/jade words.
- **Body** (JetBrains Mono 400, 14px, 1.55; lede max 62ch): all page copy.
- **Label** (JetBrains Mono, 12.5px, .12em, uppercase): HUD navigation labels. Tracking drops to 0 in Japanese.
- **Pixel** (DotGothic16 400): brand marks (光), dialogue bubbles, okwm headings (18–26px), lock date and name, workspace names.
- **okwm body / title** (JetBrains Mono 13px/1.55; titles 500 12px/1, .02em): everything inside the window manager.
- **okwm numerals** (Anybody 800, width 125–140%, tabular): lock clock clamp(64px, 12vw, 172px), FPS readout 34px, world clock clamp(22px, 9cqi, 46px), empty-area numeral at 10% paper.

### Named Rules
**The Three Faces Rule.** Mono reads, DotGothic16 labels, Anybody performs. Never set paragraphs in Anybody or DotGothic16, and never introduce a fourth face.

**The Tabular Rule.** Every changing number (clocks, fps, ms, memory, bpm, workspace numbers) uses tabular figures.

## Layout

The site is a full-viewport stage: a 72px HUD on top, a scrolling screen (padding 40px 48px) on a 12-column grid with 24px gutters, and a 56px ground strip with the seismic trace at the bottom. Interactive targets on the site are 44px. Site breakpoints step down at 1320/1260/1180/1100/1080px for the HUD, then 860, 760 and 560px for single-column layouts.

okwm is a three-row shell inside the room: 30px bar, the mosaic, 44px dock, with a 16px margin around the shell (max width 1800px). Tiles are laid out by a binary split tree with a fixed **8px gap** between tiles and around the edge; nothing overlaps. Gutters in the gaps resize; dragging a title swaps tiles. Inside tiles, container queries (900, 640, 560, 520, 460px) reflow apps from multi-column to stacked.

Responsive steps: below 1359px the dock keeps two shortcut hints; below 1000px (and on coarse pointers) the hints go; below 900px the focused title and now-playing leave the bar; below 760px the shell becomes 36px bar / 50px dock with a 6px margin, workspaces show numbers only and the dock is icon-only with 44px targets. When the workspace is narrower than 640px, okwm switches to **tabbed mode**: one full tile at a time under a row of 28px tabs.

## Elevation & Depth

The site is flat and tonal: depth comes from the three ground/panel steps, translucent bars (ground at 86–92% opacity over the room) and hairlines. Glows are inset and colored (jade or gold at 12–25%) to mark a lit state, not to lift.

okwm is the one place with ambient drop shadows, because tiles float over the dimmed room snapshot.

### Shadow Vocabulary
- **Shell** (`box-shadow: 0 24px 80px #0009`): the monitor glass over the room.
- **Tile** (`box-shadow: 0 10px 26px rgba(0,0,0,.42)`): every tile at rest.
- **Focused tile** (`box-shadow: 0 14px 34px rgba(0,0,0,.55)`): with the gold border.
- **Launcher** (`box-shadow: 0 26px 60px rgba(0,0,0,.6)`): the one modal.
- **Sticky note** (`box-shadow: 0 6px 14px rgba(0,0,0,.35)`): paper notes in the Notes app.

### Named Rules
**The Glass Over the Room Rule.** Shadows exist only where a layer sits over the room scene. Inside a tile, depth is tone and hairline.

## Shapes

Interface chrome is square: buttons, tiles, tabs, chips, inputs and panels have 0 radius and 1px hairline frames. Circles appear only as true dots (status dots, ripples, the ground-ring). Pixel art carries its own silhouettes (room atlas `public/assets/images/portfolio-art.png`, sprites, the canvas skyline) and is always rendered with `image-rendering: pixelated` or `shape-rendering: crispEdges` at integer scale. Meters and graphs are drawn as stepped segments (repeating gradients of 5–6px blocks with 2px gaps), so data reads as pixels too.

### Named Rules
**The Square Chrome Rule.** No rounded corners on interface chrome; the room's pixel art supplies all the curves.

**The No Smoothing Rule.** Pixel art is never blurred: no smoothing, no fractional scale, no CSS filters on sprites.

## Components

### Buttons
Tactile and square, uppercase tracked labels on the site, plain mono inside okwm.
- **Shape:** square (0px), 1px frame.
- **Primary:** gold fill, ground-colored text; site 48px tall with 0 22px padding and 12.5px .12em uppercase; okwm 8px 12px, 600 12px mono.
- **Hover / Focus:** fill steps to gold-bright; trailing arrow moves 4px. Focus is a 2px gold outline (site, offset 2px) or 2px gold-bright inset outline (okwm).
- **Ghost / Quiet:** transparent with a strong hairline and paper text; on the site hover turns the frame jade, in okwm hover turns it gold.
- **HUD icon buttons:** 44px squares with a strong hairline, muted icon; hover/on goes gold with an 8% gold wash.

### Chips
- **Style:** 1px strong hairline, jade-bright text, 3px 8px, 12px mono, square.

### Cards / Containers
- **Corner Style:** square.
- **Background:** panel or ground; selected cards take their accent as border with a 7% wash.
- **Shadow Strategy:** none on the site (see Elevation).
- **Border:** strong hairline; the selector panel adds 14px gold corner brackets (2px) at two opposite corners.
- **Internal Padding:** 12–22px.

### Inputs / Fields
- **Style:** borderless text on transparent ground inside a hairline frame, paper text, dim placeholder, gold-bright caret.
- **Focus:** the frame or row carries the focus; the lock field shows typed characters as 7px square dots that turn gold-bright.

### Navigation
- **Site HUD:** centered tab buttons, muted 12.5px uppercase labels with a dim glyph; hover to paper; the active tab gets a 1px gold underline that wipes in from the left (.45s) and a gold glyph.
- **okwm bar:** launcher brand (光 in DotGothic16, gold-bright), four numbered workspaces (active = solid gold chip, busy = strong hairline), focused title, then right-side modules separated by hairlines (now playing in jade-bright, language, sound, network, clock, power with red hover).
- **okwm dock:** app buttons with 16px stroke icons; open apps carry a 2px jade underline, the focused app a gold underline on the warm panel with a 45% gold frame; keyboard hints as hairline-framed `kbd`.

### okwm Tile (signature)
The window manager's unit. Square panel with a 1px strong hairline; the focused tile's border turns gold and its 28px title bar turns warm with gold-bright text. Title bars hold a 14px stroke icon, a 500 12px title and 26px square controls (fullscreen, minimize, close; close hovers red on a 16% red wash). Bodies scroll with a thin paper scrollbar and fade their last 32px while more content is below. While dragged a tile goes 82% opaque with a dashed gold-bright border; the drop target gets a jade-bright border and a 14% jade wash. Gutters show a 2px gold-bright bar on hover, focus or drag.

**Split-line entrance.** Opening an app splits the focused tile: a 2px gold-bright line grows along the split (.62s) and the new tile is revealed from it with a clip-path wipe (.46s), all on `cubic-bezier(.16,1,.3,1)`. Layout changes animate left/top/width/height over .3s.

### Box Titles (btop style)
Monitor boxes are 1px strong-hairline frames whose lowercase gold-bright title (500 12px) is cut into the top edge: positioned over the line with the tile color behind it. Inside, segmented jade bars (gold when mid, red when low) and sky segmented meters.

### Icons
Two families with separate jobs. Chrome icons (bar, title bars, dock, tabs, launcher, lock, transport) are stroke-only SVG: no fill, currentColor, 1.6 stroke, round caps and joins, 13–18px. File and folder icons in Files are filled pixel art: `crispEdges`, gold folders with a gold-bright lip, paper documents with a muted fold and colored pixel accents.

### Lock Screen
Full-shell scene over the canvas São Paulo skyline (320×180, drawn in code with Bayer-dithered sky, Farol Santander, Edifício Itália, Copan, the Paulista TV towers and a gold moon; aviation lights blink red once per second unless motion is reduced). Center column: wide Anybody clock, DotGothic16 date, the Hikaru sprite from the room atlas, name in DotGothic16, then a 40px hairline field with square dots and a 32px gold enter button. A quiet "stand up" power button sits bottom right. Leaving the lock slides the bar down from the top and the dock up from the bottom (.5s). Behind open tiles the skyline drops to 12% opacity; an empty workspace shows it at 60%.

### Motion
The site's motion vocabulary is short eases (`cubic-bezier(.2,.7,.2,1)` and relatives) plus `steps()` timing for pixel blinks. okwm uses one ease, `cubic-bezier(.16,1,.3,1)`.

**The Movimento Rule.** Reduced motion is the site's own setting (Movimento / Motion / 動き, stored locally and toggled from the site menu and okwm Settings), with the OS `prefers-reduced-motion` collapsing animations unless the visitor chose full motion. In okwm calm mode: no camera push, a 160ms fade in, tiles move without travel or split animation, bars and launcher appear without sliding, and skyline lights stop blinking.

## Do's and Don'ts

### Do:
- **Do** build every new surface from the ground/panel/panel-raised steps and 11%/20% paper hairlines.
- **Do** give gold to exactly one focus per view: the active workspace, the focused tile, the primary action.
- **Do** keep chrome square (0px) and pixel art at integer scale with `image-rendering: pixelated`.
- **Do** use stroke icons (1.6, round) for chrome and filled crisp-edged pixel icons for things (files, folders).
- **Do** keep an 8px gap between okwm tiles and switch to tabbed mode under 640px of workspace width.
- **Do** ship every string in PT, EN and JA; in Japanese drop letter-spacing to 0, use `line-break: strict`, and use `word-break: keep-all` / `nowrap` on navigation, workspace and dock labels.
- **Do** route all motion through the Movimento setting and provide the calm variant.
- **Do** use tabular figures for every changing number.

### Don't:
- **Don't** overlap okwm windows or add a centered dock; tiles split, they never float.
- **Don't** use red for anything but alert, close and power.
- **Don't** set paragraphs in Anybody or DotGothic16, or add a fourth typeface or any CDN font.
- **Don't** round interface corners or smooth pixel art.
- **Don't** add drop shadows inside tiles or on site panels; shadows belong to layers over the room.
