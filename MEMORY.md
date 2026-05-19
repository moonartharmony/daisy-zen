# Daisy Zen — Karar Günlüğü

---

## 2026-05-19 — Yol B felsefesi seçildi

Harici ağır oyun motorları yerine saf Web Standartları (SVG + Web Audio API) ile 60 FPS hedeflendi. Proje iskeleti kuruldu.

**Gerekçe:** Phaser/PixiJS gibi motorlar ~2MB bundle ekler; Daisy Zen'in tüm görsel mantığı 350kB JS içinde çalışıyor.

---

## 2026-05-19 — İki katmanlı SVG `<g>` mimarisi

**Problem:** CSS `translate`/`scale` bireysel özellikleri SVG elementlerde çalışmıyor (Chromium computed value: `0px`/`1`). CSS `transform` kısayolu çalışıyor ama SVG `transform` attribute'unu eziyor.

**Çözüm:** Dış `<g>` → orbital konum (SVG attr, asla dokunulmuyor). İç `<g>` → tüm CSS feedback (spring press, win burst, shake, flash). Burst yönü: dış `<g>` koordinat sistemini döndürdüğü için `-Y` her zaman radyal dışarıyı gösteriyor → `translate(0, -Npx)`, trigonometri gerekmez.

---

## 2026-05-19 — pathMorph.ts — normalize edilmiş path dizileri

**Problem:** CSS `d` transition farklı komut sayısına sahip path'ler arasında çalışmıyor.

**Çözüm:** Tüm 5 petal şekli 24 sayılık diziye (4 cubic bezier × 6 koordinat) normalize edildi. `lerpNums()` ile ease-in-out cubic interpolation → 800ms watercolor morph.

---

## 2026-05-19 — `useAudio.ts` — Web Audio ambient engine

OscillatorNode → GainNode → BiquadFilterNode → AnalyserNode → destination. FFT low-band amplitude → `--audio-pulse` CSS var (0.97–1.03). `.daisy-svg { filter: brightness(var(--audio-pulse)) }` → daisy nefes alır. Her bölümün frekansı farklı: Garden 174.6Hz, Forest 146.8Hz, Mountain 110Hz, Storm 98Hz, Void 82.4Hz.

---

## 2026-05-19 — ZenStateController

Hint score = `time(0–40) + failures(0–25) + hesitation(0–20) + entropy(0–15)`. ≥100 → hint button görünür. `paceMul = 1 + playerStress × 0.4` → `--zen-pace` CSS var → animasyonlar streste yavaşlar → sakinleştirici etki.

---

## 2026-05-19 — Swipe-to-snap gesture

`snapSwipe(dx, dy)` → `atan2` ile ekran koordinatlarını pusula derecesine çevirir → chapter'a ait `dirs` içinden en yakın `Dir`'e snap. Kullanıcı doğrudan yönü çizebilir; ok tek hamlede hedef yönü gösterir.

---

## 2026-05-19 — Glassmorphism görsel kimliği benimsendi

Dark-mode ağırlıklı şeffaf cam katmanlar (backdrop-blur) ve neon ambient parlamalar ile yeni estetik oturtuldu. Arka plan: `#0B0C10`. Cam kart yüzeyleri: `rgba(255,255,255,0.035)` + `blur(18px)`. Neon glow orbs: mor `rgba(168,85,247,0.14)`, zümrüt `rgba(16,185,129,0.11)`, altın `rgba(255,215,0,0.08)`. Daisy logomarkı ince çizgisel (stroke-only) SVG + `feGaussianBlur` parlama filtresi. Yansımalı "Zihni Uyandır" butonu: `linear-gradient(160deg, #FFE566→#FFD700→#FFC200)` + `box-shadow: 0 0 28px rgba(255,215,0,0.38)`.

**Gerekçe:** Katı neubrutalist kenarlıklar (4px solid shadow) oyun içi geri bildirim diline ayrıldı; karşılama ekranı daha yumuşak, evrensel ve premium hissettirmeli.

---

## 2026-05-19 — Karşılama ekranı ve dark mode

Landing route `/` oluşturuldu; oyun `/play`'e taşındı. Dark mode: `[data-theme="dark"]` on `<html>`, `localStorage` ile kalıcı. Otomatik sistem tercihi algılama (`prefers-color-scheme: dark`).
