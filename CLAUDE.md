# Daisy Zen — Proje Belleği

## Projenin Amacı

Daisy Zen; insanların duygusal durumlarına göre şekillenen, pürüzsüz cam efektlerine (Glassmorphism) ve derin ses reaktörlerine sahip mikroskobik meditasyon evrenidir.
Hedef kitle: anksiyete, disleksi, otizm spektrumu veya günlük zihin egzersizi isteyen herkes.
Tasarım felsefesi: Csikszentmihalyi akış teorisi × Sistem 1/2 geri bildirim × Voyage & Return arketip narratifi.

## Stack

- **Framework:** TanStack Start + Vite 7 (SSR + Cloudflare Workers)
- **UI:** React 19 + Tailwind CSS 4 — harici ağır bileşen kütüphanesi yok
- **Dil:** TypeScript 5.x (strict mode)
- **Runtime:** Bun
- **Render:** Saf SVG + Web Audio API — WebGL veya canvas yok
- **Hedef:** 60 FPS, 2017 MacBook'ta sorunsuz, Capacitor ile iOS/Android

## Mimari Kararlar

| Karar | Gerekçe |
|---|---|
| Yol B — saf Web Standartları | Harici oyun motorları bundle boyutunu 5× artırır |
| İki katmanlı SVG `<g>` mimarisi | CSS `translate`/`scale` SVG'de çalışmaz; dış `<g>` orbital, iç `<g>` CSS feedback |
| `pathMorph.ts` — 24-sayı path dizileri | Aynı komut sayısı → lerp ile morph, harici lib yok |
| `useAudio.ts` — Web Audio API | FFT → `--audio-pulse` CSS var → daisy nefes alır |
| `zenState.ts` — saf hesaplama modülü | Sıfır side-effect, test edilebilir, hot-reload güvenli |
| `--zen-pace` CSS değişkeni | Stres arttıkça animasyonlar yavaşlar → sakinleştirici |

## Kod Kuralları

- **Import sırası:** React → external → internal (`../`) → `./`
- **Stil:** Inline `style={}` (game canvas); Tailwind class (landing/shell)
- **Animasyon:** CSS transition veya `requestAnimationFrame` — harici animasyon kütüphanesi yok
- **Side effects:** DOM yazımları (CSS var, classList) `useEffect` içinde, asla `setS` updater içinde
- **SVG transform:** Orbital konum = SVG `transform` attr; feedback = CSS `transform` property
- **Haptics:** `navigator.vibrate?.()` — masaüstünde hata fırlatmaz
- **Ses:** `AudioContext` yalnızca ilk kullanıcı etkileşiminden sonra başlatılır

## Commit Standardı

**Conventional Commits** — İngilizce, küçük harf, emir kipi, 50 karakter altı:

```
feat: add swipe-to-snap gesture on petals
fix: resolve win burst not animating on svg
refactor: extract pathMorph to standalone module
docs: update CLAUDE.md with audio architecture
style: align hint button opacity transition
```

Prefix'ler: `feat` · `fix` · `refactor` · `docs` · `style` · `perf` · `test` · `chore`

Her anlamlı değişiklik sonunda commit atılır. Birden fazla dosyayı kapsayan küçük değişiklikler tek committe birleştirilebilir.

## Dosya Yapısı

```
# ── Prototip (proje kökü, framework-agnostic) ─────────────────────────────
daisy-flower.jsx      # Sprint 1: Organik Bezier petal motoru + 5-durum duygu sistemi
daisy-app.jsx         # Sprint 1: Oyun shell — bölümler, bulmaca, tap/swipe, skor
daisy-styles.css      # Sprint 1: Neubrutalist tasarım sistemi, keyframe'ler

# ── Üretim uygulaması (TanStack Start + Vite 7) ───────────────────────────
src/
  game/
    DaisyCanvas.tsx   # SVG canvas, petal render, two-layer <g>
    UI.tsx            # Header, BottomArea, WinScreen, PauseModal, ChapterTransition, TutorialSheet
    useGame.ts        # Game state, tap/swipe/setDir/snapSwipe
    useAudio.ts       # Web Audio ambient engine
    pathMorph.ts      # SVG path normalization + lerp
    zenState.ts       # Pure ZenStateController (hint score, stress, pace)
    types.ts          # Dir, Puzzle, Chapter, Phase types
    shapes.tsx        # PETAL_PATHS, Arrow, CenterOverlay, ChapterSilhouette
    puzzles.ts        # 25 hand-crafted levels
  routes/
    __root.tsx        # Shell, head meta, SW registration
    index.tsx         # Landing / welcome screen
    play.tsx          # Game screen
  styles.css          # Design tokens, keyframes, animations
```

## Prototip Mimarisi (Sprint 1)

| Dosya | Sorumluluk |
|---|---|
| `daisy-flower.jsx` | Bezier petal geometrisi, organicNums LCG, 5-durum duygu motoru, ParticleField |
| `daisy-app.jsx` | Oyun durumu, bölüm yönetimi, tap/swipe handler, win/hint logic |
| `daisy-styles.css` | Design tokens, `--breath-period`, petal CSS sınıfları, keyframe animasyonlar |

**Yarım küre rotasyon kuralı:** `placementAngle > 180° → CCW (↺)`, `≤ 180° → CW (↻)`
**Duygu türetimi:** `deriveEmotion(alignedFrac, recentMisaligns, hintReady)` — 8s kayan pencere
**Nefes senkronizasyonu:** `--breath-period` CSS var → `useEffect` ile `document.documentElement.style.setProperty`

## Tasarım Sistemi

### Oyun (Game Canvas)
| Token | Değer |
|---|---|
| `--ink` | `#4D4732` |
| `--yellow` | `#FFD700` |
| `--surface` | `#FFFFFF` |
| `--text` | `#1B1C1C` |
| `--shadow-md` | `4px 4px 0px 0px rgba(77,71,50,1)` |
| Font | Quicksand 500/600/700 (self-hosted via @fontsource) |

### Landing (Glassmorphism — Dark-First)
| Token | Dark | Light |
|---|---|---|
| `--landing-bg` | `#0B0C10` | `#F0EDE8` |
| `--landing-surface` | `rgba(255,255,255,0.035)` | `rgba(255,255,255,0.65)` |
| `--landing-border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` |
| `--landing-text` | `#EDE9E0` | `#1B1C1C` |
| `--landing-muted` | `rgba(255,255,255,0.42)` | `#7E775F` |
| Glow vurgu | Altın `#FFD700`, Mor `#A855F7`, Zümrüt `#10B981` | — |

Tüm kartlarda `backdrop-filter: blur(18px)` cam efekti. Arka planda ambient glow orbs.

Dark mode: `[data-theme="dark"]` on `<html>`. Toggle persisted in `localStorage`.
