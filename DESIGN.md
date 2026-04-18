# Tandem Studio — Design System (Enterprise Sobrio)

> **Objetivo:** elevar la percepción visual de tandemstudio.cloud de "startup tech brillante"
> a **enterprise sobrio** (Stripe / Linear / HashiCorp / Kyndryl LATAM) manteniendo el logo actual.
>
> **Scope de esta sesión:** diagnóstico + tokens + guía de aplicación. No se modificó código.
>
> **Arquetipo:** 60% Stripe (disciplina espacial, whites dominantes) + 25% Linear (azul
> desaturado, "calm technology") + 15% HashiCorp (semántica de tokens + accesibilidad).
>
> **Mercado:** LATAM / Argentina. Idioma principal español.

---

## 1. Diagnóstico visual (estado actual)

| # | Finding | Severidad | Confidence |
|---|---------|-----------|------------|
| D1 | Tarjeta "Transparency" rotulada en inglés dentro de sitio en español | **P0 bug** | verificado |
| D2 | Gradient azul→cyan (`#0088FF → #00BFFF`) usado en botones, iconos, stats, CTA — satura la paleta y lee "startup tech", no "enterprise" | P1 | verificado |
| D3 | Glow accent azul (`box-shadow 0 8px 32px rgba(0,102,255,0.2)` + hover `rgba(0,102,255,0.3)`) en todos los CTAs — aesthetic gaming/hype | P1 | verificado |
| D4 | Hero datacenter con `animation: datacenterVideo 30s` (zoom/pan/brightness) + `scanlines 8s` — distrae, resta credibilidad | P1 | verificado |
| D5 | Animated hero words cycling cada 3s con gradient fill — pattern startup 2018-2022, hoy Stripe/Linear no lo usan | P1 | verificado |
| D6 | Values section con `linear-gradient(180deg, #D6E4FF 0%, #EBF2FF 50%, #FFFFFF 100%)` — celeste pastel rompe la solemnidad enterprise | P1 | verificado |
| D7 | Border-radius generosos (md=12px, lg=16px, xl=24px) — enterprise refs usan 4–8px | P2 | verificado |
| D8 | Space Grotesk como heading — es geométrico/tech, mejor Inter Display o Inter para coherencia enterprise | P2 | lógico |
| D9 | Stats con gradient text blue→cyan — el mismo problema de D2 | P2 | verificado |
| D10 | Shadows con tint azul (`rgba(10,14,39, 0.X)` y `rgba(0,102,255,...)`) — neutralizar a grises | P2 | verificado |
| D11 | `hero__datacenter-image` a 110% + blur(5px) + animación continua → peso visual innecesario, 0.5–1MB JPG cargando | P2 | verificado |
| D12 | No hay token de borde primario consistente (`#E2E8F0` aparece hardcoded en varios lugares) | P2 | verificado |
| D13 | `section-padding: 100px` es generoso pero los headers de cada sección solo tienen `margin-bottom: 60px` — ritmo vertical poco controlado | P2 | lógico |
| D14 | Logos de clientes en carousel con `filter: grayscale(100%) opacity(0.6)` — correcto, mantener | OK | verificado |

---

## 2. Tokens comparados — actual vs propuesto

### 2.1 Color

| Token | Actual | Propuesto | Rationale |
|-------|--------|-----------|-----------|
| `--color-primary` | `#0088FF` | `#1F4FD6` | Azul desaturado, "calm tech" (Linear-inspired). Menos brillo, más autoridad. |
| `--color-primary-dark` | `#0066CC` | `#1A3FB0` | Hover / pressed. |
| `--color-primary-light` | `#3399FF` | `#EEF2FF` | Pasa de ser accent saturado a **surface tintado** (fondos sutiles tipo Stripe). |
| `--color-accent` | `#00BFFF` (cyan) | **Eliminar del gradient** | Reservar solo para iconos/illustraciones decorativas si hace falta. |
| `--color-dark` | `#0A0E27` | `#0B1220` | Navy un toque menos violáceo, más neutro institucional. |
| `--color-dark-light` | `#1E293B` | `#1E293B` | Mantener (slate-800). |
| `--color-surface` | `#FFFFFF` | `#FFFFFF` | OK, dominante. |
| `--color-surface-subtle` | — | `#FAFBFC` | **Nuevo.** Fondos de sección alternados (más sobrios que `#F8FAFC`). |
| `--color-light` | `#F8FAFC` | `#F6F8FB` | Un gris más neutro (menos azulado). |
| `--color-border` | `#E2E8F0` | `#E5E7EB` | Gris neutro (menos azulado que slate). |
| `--color-border-strong` | — | `#D1D5DB` | **Nuevo.** Para cards enterprise con 1px visible. |
| `--color-text-primary` | `#1A1A2E` | `#0F172A` | Slate-900, menos "morado nocturno". |
| `--color-text-secondary` | `#64748B` | `#475569` | Un tick más oscuro → mejor contraste (AA). |
| `--color-text-muted` | `#94A3B8` | `#64748B` | |
| `--color-success` | `#22C55E` | `#15803D` | Verde más corporativo (saturación baja, valor medio). |
| `--color-warning` | `#F59E0B` | `#B45309` | |
| `--color-error` | `#EF4444` | `#B91C1C` | |

**Regla semántica propuesta (HashiCorp-inspired):**
```
surface/default      → #FFFFFF
surface/subtle       → #FAFBFC
surface/muted        → #F6F8FB
surface/strong       → #0F172A (dark sections)
surface/primary      → #1F4FD6 (CTA primario)
surface/primary-tint → #EEF2FF (badges, highlights)

foreground/default       → #0F172A sobre #FFF
foreground/secondary     → #475569 sobre #FFF
foreground/on-primary    → #FFFFFF sobre #1F4FD6
foreground/on-dark       → #E5E7EB sobre #0F172A

border/default   → #E5E7EB
border/strong    → #D1D5DB
border/primary   → #1F4FD6
```

### 2.2 Tipografía

| Token | Actual | Propuesto | Rationale |
|-------|--------|-----------|-----------|
| `--font-heading` | Space Grotesk | **Inter** (con `opsz` variable, pesos 500/600/700) | Stripe/Linear/HashiCorp usan Inter o system sans sobria. Space Grotesk es geométrica-tech. |
| `--font-body` | Inter | Inter | OK, mantener. |
| `--font-mono` | — | `'JetBrains Mono', ui-monospace` | **Nuevo.** Para datos técnicos (uptime, IPs, versions) — común en refs enterprise. |
| H1 `hero__title` | `clamp(2.5rem, 6vw, 4rem)` weight 700 | `clamp(2.25rem, 5vw, 3.5rem)` weight **600**, `letter-spacing: -0.02em` | Enterprise usa menos peso (600, no 700) + tracking negativo sutil. |
| H2 `section__title` | `clamp(2rem, 5vw, 3rem)` weight 700 | `clamp(1.75rem, 4vw, 2.5rem)` weight 600, `letter-spacing: -0.015em` | |
| H3 `service__title` | `1.5rem` weight 600 | `1.25rem` weight 600 | |
| Body | `1rem / 1.6` | `1rem / 1.55` | Tightening sutil. |
| Small | — | `0.8125rem / 1.5` | **Nuevo** (13px). |

**Escala propuesta (modular, ratio ~1.25):**
```
--text-xs:   0.75rem    /* 12 */
--text-sm:   0.8125rem  /* 13 */
--text-base: 1rem       /* 16 */
--text-lg:   1.125rem   /* 18 */
--text-xl:   1.25rem    /* 20 */
--text-2xl:  1.5rem     /* 24 */
--text-3xl:  1.875rem   /* 30 */
--text-4xl:  2.25rem    /* 36 */
--text-5xl:  3rem       /* 48 */
--text-6xl:  3.5rem     /* 56 — hero */
```

### 2.3 Spacing (mantener base 8px)

La escala actual `--space-*` está bien. **No tocar.** Agregar solo:
```
--space-14: 3.5rem; /* 56 — gap entre secciones internas */
--space-32: 8rem;   /* 128 — padding vertical de secciones premium */
```

Reemplazar `--section-padding: 100px` → `--section-padding: var(--space-24)` (96px).

### 2.4 Border radius

| Token | Actual | Propuesto |
|-------|--------|-----------|
| `--radius-sm` | 6px | **4px** |
| `--radius-md` | 12px | **8px** |
| `--radius-lg` | 16px | **12px** |
| `--radius-xl` | 24px | **16px** |
| `--radius-full` | 9999px | 9999px |

**Rationale:** Stripe usa 4–8px en cards, Linear 6–8px, HashiCorp 4–6px. 16–24px es aesthetic
consumer/startup. Bajar la escala ya produce un salto visual de madurez enorme.

### 2.5 Shadows (neutralizar — sacar el tint azul)

```css
/* Actual tint slate-azul */
--shadow-sm:  0 2px 8px rgba(10, 14, 39, 0.05);
--shadow-md:  0 4px 16px rgba(10, 14, 39, 0.08);

/* Propuesto — grey neutro, más sutiles */
--shadow-xs:  0 1px 2px 0   rgb(15 23 42 / 0.04);
--shadow-sm:  0 1px 3px 0   rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.04);
--shadow-md:  0 4px 8px -2px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04);
--shadow-lg:  0 12px 20px -4px rgb(15 23 42 / 0.08), 0 4px 6px -2px rgb(15 23 42 / 0.04);
--shadow-focus: 0 0 0 3px rgb(31 79 214 / 0.2); /* anillo de focus accesible */

/* REMOVER completamente */
/* --shadow-accent: 0 8px 32px rgba(0, 102, 255, 0.25); */
```

### 2.6 Gradients

**Remover:**
- `--gradient-accent: linear-gradient(90deg, #0088FF 0%, #00BFFF 100%)` (usado en buttons, icons, stats)
- Values section gradient celeste

**Mantener (refactorizado):**
- `--gradient-hero: linear-gradient(135deg, #0B1220 0%, #1E293B 100%)` — más oscuro, menos violáceo
- **Nuevo:** `--gradient-soft: linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 100%)` para fades sutiles entre secciones

### 2.7 Transitions

Actuales OK. Agregar `--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1)` para hover premium.

---

## 3. Arquetipo — por qué esta combinación

| Brand | % | Qué aporta | Evidencia |
|-------|---|-----------|-----------|
| **Stripe** | 60% | Dominio de whites, rejilla de 32px, escalera tipográfica 1:3, cards planas | Layout push-to-endpoints, spacing tokens de 32px (Perplexity research cit. [1][30]) |
| **Linear** | 25% | Azul desaturado (`#1F4FD6` vs `#0088FF`), "calm technology", tracking negativo | Brand guidelines: "subtle desaturated blue" rechaza startup energy (cit. [35]) |
| **HashiCorp Helios** | 15% | Semantic color tokens, accesibilidad baked-in, border 1px en cards | HDS semantic tokens `Surface/{color}` + `Foreground/{color on surface}` (cit. [36]) |

**Por qué NO Vercel / Supabase / Clay:** son "tech moderno" (dark-first, gradients, glow) — justo
lo que ya tiene Tandem y lo que quisiste alejarte. Descartados por el tone "enterprise sobrio" que elegiste.

**Por qué NO Intercom / Notion:** son "editorial refinado" (typography XL, mucho whitespace,
ilustraciones playful) — buenos para SaaS B2C / content-first, no para MSP B2B que vende
confianza técnica y compliance.

**Referentes LATAM para benchmark adicional** (no para copiar, para leer cómo proyectan
autoridad regional): Kyndryl LATAM, Softtek, Baufest, SEIDOR, Globant.

---

## 4. Cambios priorizados (5–10)

### P0 — Bugs visibles (30 min)

1. **`index.html:155`** — cambiar `Transparency` → `Transparencia` (sitio está en español).

### P1 — Estructurales (3–5 hs)

2. **Paleta:** reemplazar `--primary #0088FF` → `#1F4FD6` (Linear-inspired desat) en
   [assets/css/design-tokens.css](assets/css/design-tokens.css) **y** [assets/css/main.css](assets/css/main.css)
   (duplicado! los tokens están declarados dos veces). Propagar a todos los hover/focus states.
3. **Remover gradient accent** del botón primario, stats, icons. Botón primario pasa a ser sólido
   `#1F4FD6` con `--shadow-sm`. Stats pasan a tipografía sólida `#0F172A` con acento en un solo dígito
   si hace falta.
4. **Remover glow** `--shadow-accent`. Reemplazar por `--shadow-md` estándar.
5. **Hero datacenter:** eliminar animación `datacenterVideo` + `scanlines`. Dejar imagen estática
   con overlay radial. Considera reemplazar el JPG datacenter por un still fotográfico profesional
   (sala de servidores real, no stock CGI genérico) o un pattern sutil de grid. Peso actual ~500KB
   se puede bajar a <150KB.
6. **Animated hero words:** cambiar a estático — hero queda "Gestión integral de plataformas IT"
   y en línea 2 una tag neutral tipo "Servicios gestionados · Monitoreo 24×7 · Migraciones". Sin
   ciclo. Enterprise refs (Stripe/Linear/HashiCorp) no usan cycling headlines.
7. **Values section background:** cambiar `linear-gradient(#D6E4FF → #FFFFFF)` por `#FAFBFC`
   plano. Elimina el efecto "pastel boda".

### P2 — Polish (2–3 hs)

8. **Tipografía heading:** cambiar `Space Grotesk` → `Inter` en Google Fonts preconnect
   ([index.html:14](index.html#L14)). Aplicar `letter-spacing: -0.015em` a H1/H2 y `font-weight: 600`.
9. **Border radius:** bajar la escala `--radius-md 12→8`, `--radius-lg 16→12`, `--radius-xl 24→16`.
   Afecta cards, buttons, badges — el efecto acumulado es "más serio" sin tocar layout.
10. **Consolidar duplicación de tokens:** hay dos bloques `:root` con variables que se pisan
    ([main.css:9-52](assets/css/main.css#L9-L52) y [design-tokens.css](assets/css/design-tokens.css)).
    Dejar solo `design-tokens.css` como fuente de verdad e importarlo en `main.css`.

---

## 5. Confidence map

| Finding / propuesta | Evidencia |
|---------------------|-----------|
| Palette desaturada vs saturada | **Verificado** — Perplexity research cit. Linear Brand [35], palette trends 2025 [28] |
| Inter como heading vs Space Grotesk | **Lógico** — Stripe/Linear/HashiCorp usan Inter o system sans, Space Grotesk es más "tech moderno" |
| Remover glow accent | **Verificado** — no aparece en ninguno de los tier-1 refs analizados |
| Remover animated hero words | **Opinión** basada en: (a) patrón usado mayormente en landings 2018-2022, (b) ninguno de los 3 arquetipos lo usa hoy |
| Radius 8–12 vs 16–24 | **Verificado** por inspección de Stripe/Linear/HashiCorp sites |
| Kyndryl/Softtek/Baufest como benchmark LATAM | **Verificado** — Perplexity research [23][20][19] |
| Inter sobre Space Grotesk es mejor | **Opinión** defendible — Space Grotesk está bien diseñada pero su carácter geométrico no alinea con "enterprise sobrio" |

---

## 6. Conflictos research ↔ wiki

- **Wiki library (`~/.claude/design-md-library/design-md/`) solo tiene stubs** que apuntan a
  `getdesign.md/{brand}/design-md` (URLs externas). No hay tokens locales detallados.
  Este DESIGN.md se construye con Perplexity research + conocimiento de los sistemas públicos
  (Stripe, Linear brand guidelines, HashiCorp Helios), no con datos del wiki local.
- **Trend 2025 "Mocha Mousse / nature-inspired" (Pantone)** → NO aplicado deliberadamente.
  Para MSP LATAM vendiendo compliance/cloud/infra, warmth excesiva resta autoridad técnica.
  Paleta azul desaturada + neutros fríos es mejor fit que browns/greens.

---

## 7. Próximos pasos sugeridos (post-aprobación)

1. Ejecutar P0 + P1 (items 1–7) en una PR → commit por item.
2. Antes de tocar P2 (items 8–10), sacar screenshots comparativos desktop+mobile de las 3 páginas
   más vistas (home, servicios, contacto) con Playwright.
3. Validar contraste AA de toda la paleta nueva (Stark / axe).
4. Si presupuesto lo permite: sesión de fotografía propia (equipo, oficina, datacenter partner)
   para reemplazar stock CGI del hero.

---
_Generado: 2026-04-17 · Versión 1.0 · Basado en screenshot fullpage actual + Perplexity deep
research + wiki design-md library + código fuente local._
