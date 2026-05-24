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

---

## 2026-05-24 — Sprint 1: Organik Prototip tamamlandı

Üç yeni prototip dosyası oluşturuldu (proje kökünde, TanStack Router'dan bağımsız):

**`daisy-flower.jsx`** (647 satır) — Sprint 1 organik Bezier petal motoru:
- 5 petal şekli: oval · leaf · diamond · spike · clover (24 sayılık flat dizi, `lerpNums()` ile morph)
- Knuth LCG `organicNums(base, factor, seed)` → tohum bazlı asimetri, her `(petalIdx × 1000 + level × 17)` için benzersiz
- 5 durum duygu motoru: `anxious → seeking → calming → meditative → harmonized`
- `deriveEmotion(alignedFrac, recentMisaligns, hintReady)` — saf fonksiyon
- `--breath-period` CSS değişkeni duygu durumuna göre 2.5s–9.0s arasında değişir
- Yarım küre yönlü döndürme glifleri: `angle > 180° → ↺ (CCW)`, `≤ 180° → ↻ (CW)`
- `useOrganicPath` rAF morph hook — şekil değişimi 800ms, duygu geçişi 600ms
- SMIL-animasyonlu `ParticleField` — JS'siz per-frame, `round6` SSR güvenli

**`daisy-app.jsx`** (417 satır) — Tam oyun shell:
- 5 bölüm: The Garden · The Forest · The Mountain · The Storm · The Void
- LCG tohum-bazlı deterministik bulmaca üretimi (`makeLCG(level * 137 + 42)`)
- `handleTap(idx, angleDeg)` → `spinDir` → CW/CCW rotasyon
- `handleSwipe(idx, dx, dy)` → `atan2` → 45° snap yönü
- 8 saniyelik kayan pencere misalign sayacı → duygu türetimi
- Win → 700ms → auto-advance (veya "Next level" butonu)
- Hint timer 45 saniye

**`daisy-styles.css`** (352 satır) — Neubrutalist tasarım sistemi:
- Sıfır gradient, sıfır blur — tam flat/solid
- `--spring: cubic-bezier(0.34, 1.56, 0.64, 1)` fizik dili
- `petal-group` / `petal-pressed` / `petal-shake` / `petal-align-flash` CSS sınıfları
- `daisy-breathing` → `--breath-period` CSS var ile bağlı

**Canlı test sonuçları (2026-05-24):**
- ✅ Landing sayfa: dark/light mod geçişi, glassmorphism, Türkçe kopya
- ✅ /play: Organik Bezier yapraklar, parçacık alanı, nefes animasyonu
- ✅ Tap → hemisferik rotasyon (CW sağ yarım küre / CCW sol yarım küre)
- ✅ Hizalama tespiti → skor güncelleme → kazanma ekranı
- ✅ "Next level →" → Level 2'ye geçiş, birikimli skor (0100→0200)
- ✅ Duygu durumu: misalign → anxious (pembe yapraklar, hızlı nefes)
- ✅ İpucu halkası: 45s ipucu timer → altın SMIL animasyonu

**Git commit:** `3dd2b86` — `feat(sprint1): organic prototype — daisy-flower, daisy-app, daisy-styles`
