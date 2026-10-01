# BunnyBank website

The public pages for the BunnyBank iOS app: home, support and privacy policy. The home page links to the live App Store listing (id6814388982).
Static HTML and CSS, no build step. Served by GitHub Pages at
https://hlum.github.io/bunnybank-site/

- `privacy.html`: the Privacy Policy URL for App Store Connect and the app's Settings.
- `support.html`: the Support URL.
- `img/app-store-badge-en.svg`, `img/app-store-badge-ja.svg`: the official "Download on the App Store" badges from Apple's marketing tools (black, unmodified). Apple's guidelines: 40px minimum height, quarter-height clear space, never alter or recolour them, one badge per layout, credit line once per site (home footer).

The source lives in the app repository's `website/` folder; copy it here to publish.

`bunny.js` plays Mochi from the sprite strips in `img/bunny-<motion>.webp`
(13 frames each, cut from the app's `Assets.xcassets/Characters/Bunny` with one
shared crop), using the same timings as `CharacterMotion.swift`. Screens in
`img/screen-*.webp` are cropped from the App Store screenshots.

Japanese pages live in `ja/` and share the root's CSS, JS and images. English
pages send visitors whose timezone is Asia/Tokyo, or whose first browser
language is Japanese, to `ja/` (inline script in each page's `<head>`); picking
a language in the header overrides that (`localStorage` "bb-lang").

The site is light by default; the header's moon button switches to dark and is
remembered ("bb-theme").

`demo.js` is the "learns your day" demo on the home pages: a map and an Add form
that fills itself in, one scene per suggestion signal. Its reason lines use the
app's own wording (`Core/Suggestions/SuggestionExplanation.swift`).
