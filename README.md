# Varga Studio — learning rebuild

A static, motion-led one-pager for **Ines Varga**, a *fictional* design mentor. It rebuilds the layout, type
scale, colours and scroll choreography of a reference portfolio as a learning exercise. All names, client
brands, logos and copy here are invented; no media, fonts or code were taken from the reference.

## Run
```bash
python3 -m http.server 8771
```
Open http://localhost:8771 (add `?noloader` to skip the intro).

## What's inside
- Intro: four words rise one at a time, stack in the centre, then settle into the hero.
- Left rail (desktop): menu, I–VI section index with an active label, vertical "Let's connect" button.
- Horizontal module (≥1200px): hero → about → giant "MEET INES" letters that act as windows into a video;
  the band then opens into a full-screen clip with a "Watch intro" button.
- Ten huge lines that turn from grey to coral as they pass, with drifting photos.
- Client list with a sticky coral square showing a type-only mark for the current client.
- Theme switch to sand and an echoing word that fans out with scroll.
- Overview, "Let's make a plan" contact block, footer with a random quote.

Stack: plain HTML/CSS/JS, GSAP (intro + menu), Lenis (smooth scroll). Sizes are in rem, measured at 1440px
(1rem = 0.5208vw on desktop).

## Credits
- Video and stills: [Mixkit](https://mixkit.co) (Mixkit License).
- Fonts: Outfit, Mrs Saint Delafield, Fraunces, Space Mono (Google Fonts).
