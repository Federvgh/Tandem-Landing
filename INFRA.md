# Tandem Studio — Infraestructura AWS (S3 + CloudFront)

> **Scope:** guía operativa para aplicar security headers, arreglar los 2 bugs de
> infraestructura detectados, y deploy. No se ejecuta desde este repo — son
> comandos manuales para AWS Console / AWS CLI.
>
> **Stack detectado (curl 2026-04-17):** S3 (`server: AmazonS3`) + CloudFront
> (`via: ... (CloudFront)`, POP `DUB56-P4`).
>
> **Wiki grounding:** [[security-headers-checklist]] (Next.js-oriented, adaptado
> a CloudFront en esta guía). **Gap detectado en wiki:** no hay página para
> sitios estáticos en S3+CloudFront — propuesta de nueva wiki page al final.

---

## 1. TL;DR — 4 cambios en AWS

| # | Qué | Dónde | Impacto |
|---|-----|-------|---------|
| 1 | Agregar **Response Headers Policy** con HSTS, CSP, X-Frame, etc. | CloudFront distribution de www | Security audit AA (OWASP, Mozilla Observatory) |
| 2 | **CloudFront Function** que redirect `*/index.html` → `*/` | Viewer Request behavior | Elimina duplicate content `/en/index.html` ↔ `/en/` |
| 3 | Segunda distribución **CloudFront para apex** → redirect 301 a www | Nueva distribución + Route 53 | `tandemstudio.cloud` sin www deja de tirar `ERR_CONNECTION_REFUSED` |
| 4 | Verificar con `curl -sI` los headers post-deploy | Local | Sanity check |

**Prerequisites:**
- AWS CLI configurado con perfil default (`aws configure`).
- ACM certificate existente cubriendo `www.tandemstudio.cloud` y `tandemstudio.cloud` (apex). Si no cubre ambos, emitir nuevo en **us-east-1** (CloudFront requiere N. Virginia).
- Permisos IAM: `cloudfront:*`, `route53:*` (al menos para las zones del dominio).
- Reemplazar `E1XXXXXXXXXXXX` por el **Distribution ID real** del CloudFront actual (se encuentra en AWS Console → CloudFront → ID).

---

## 2. Security Headers — CloudFront Response Headers Policy

### 2.1 Crear la policy

Guardar como `response-headers-policy.json`:

```json
{
  "ResponseHeadersPolicyConfig": {
    "Name": "TandemStudio-SecurityHeaders",
    "Comment": "HSTS + CSP + X-Frame + Referrer + Permissions for tandemstudio.cloud",
    "SecurityHeadersConfig": {
      "StrictTransportSecurity": {
        "Override": true,
        "AccessControlMaxAgeSec": 63072000,
        "IncludeSubdomains": true,
        "Preload": true
      },
      "ContentTypeOptions": { "Override": true },
      "FrameOptions": {
        "Override": true,
        "FrameOption": "SAMEORIGIN"
      },
      "ReferrerPolicy": {
        "Override": true,
        "ReferrerPolicy": "strict-origin-when-cross-origin"
      },
      "ContentSecurityPolicy": {
        "Override": true,
        "ContentSecurityPolicy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
      }
    },
    "CustomHeadersConfig": {
      "Quantity": 1,
      "Items": [
        {
          "Header": "Permissions-Policy",
          "Value": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
          "Override": true
        }
      ]
    }
  }
}
```

**Notas sobre el CSP** (adaptado al stack real del repo):
- `'unsafe-inline'` en **script-src** es necesario por el JSON-LD schema inline
  que agregamos en PR 3 (+ handlers inline como `onclick="window.location..."`
  en el lang switcher de varias páginas, verificado con grep).
- `'unsafe-inline'` en **style-src** por `style="..."` attributes inline en SVGs
  y hero datacenter (21 matches encontrados con grep).
- `fonts.googleapis.com` en style-src + `fonts.gstatic.com` en font-src por los
  `<link>` a Google Fonts en cada página.
- `frame-ancestors 'self'` permite embebido en subdominios (ej: portal
  `portal.tandemstudio.cloud`). Si nunca se va a embeber, cambiar a `'none'`.
- **Mejora futura:** reemplazar `'unsafe-inline'` por hashes/nonces cuando el
  sitio tenga un build step que los genere automáticamente.

### 2.2 Aplicar via CLI

```bash
# 1. Crear la policy
aws cloudfront create-response-headers-policy \
  --response-headers-policy-config file://response-headers-policy.json \
  --region us-east-1 \
  --query 'ResponseHeadersPolicy.Id' \
  --output text
# Guardar el ID devuelto, ej: abc12345-6789-abcd-ef01-234567890abc

# 2. Attachar a la distribución existente (ID real en AWS Console)
DIST_ID="E1XXXXXXXXXXXX"
POLICY_ID="abc12345-6789-abcd-ef01-234567890abc"

# 2a. Exportar config actual
aws cloudfront get-distribution-config --id "$DIST_ID" \
  > current-config.json

ETAG=$(jq -r '.ETag' current-config.json)

# 2b. Editar: en DefaultCacheBehavior agregar "ResponseHeadersPolicyId": "<POLICY_ID>"
jq --arg pid "$POLICY_ID" \
  '.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = $pid | .DistributionConfig' \
  current-config.json > new-config.json

# 2c. Aplicar update
aws cloudfront update-distribution \
  --id "$DIST_ID" \
  --if-match "$ETAG" \
  --distribution-config file://new-config.json
```

Esperar ~5-15 min a que la distribución propague (status `Deployed`).

---

## 3. CloudFront Function — redirect `*/index.html` → `*/`

Guardar como `clean-urls-redirect.js`:

```javascript
// CloudFront Function: redirect /index.html and /en/index.html to clean URLs
// Runtime: cloudfront-js-2.0
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Explicit index.html paths that should canonicalize to folder
    if (uri === '/index.html') {
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: { 'location': { value: '/' } }
        };
    }
    if (uri === '/en/index.html') {
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: { 'location': { value: '/en/' } }
        };
    }

    // Folder URLs (/, /en/) need an index.html appended for S3 origin to serve.
    // This is internal — user still sees clean URL.
    if (uri.endsWith('/')) {
        request.uri = uri + 'index.html';
    }

    return request;
}
```

### 3.1 Crear y asociar la función

```bash
# 1. Crear la función
aws cloudfront create-function \
  --name "TandemStudio-CleanUrls" \
  --function-config '{"Comment":"Redirect index.html to clean URLs","Runtime":"cloudfront-js-2.0"}' \
  --function-code fileb://clean-urls-redirect.js \
  --region us-east-1 \
  --query 'ETag' --output text

# 2. Publicar (develop → live)
aws cloudfront publish-function \
  --name "TandemStudio-CleanUrls" \
  --if-match "<ETAG-FROM-STEP-1>"

# 3. Asociar a la distribución como Viewer Request
# Repetir el patrón de export/edit/update-distribution de sección 2.2
# pero editando DefaultCacheBehavior.FunctionAssociations:
#   {
#     "Quantity": 1,
#     "Items": [
#       { "FunctionARN": "arn:aws:cloudfront::ACCOUNT:function/TandemStudio-CleanUrls",
#         "EventType": "viewer-request" }
#     ]
#   }
```

---

## 4. Redirect apex (`tandemstudio.cloud`) → www

Actualmente `tandemstudio.cloud` sin www **no resuelve** (curl exit 6 = no route).
Usuarios que escriben el dominio sin www ven `ERR_CONNECTION_REFUSED`.

**Solución:** segunda distribución CloudFront con CloudFront Function que
redirige 301 a www, con Route 53 alias apuntando a ella.

### 4.1 Function de redirect apex

Guardar como `apex-redirect.js`:

```javascript
// Redirect tandemstudio.cloud → www.tandemstudio.cloud (preserving path)
function handler(event) {
    var request = event.request;
    return {
        statusCode: 301,
        statusDescription: 'Moved Permanently',
        headers: {
            'location': {
                value: 'https://www.tandemstudio.cloud' + request.uri
            }
        }
    };
}
```

### 4.2 Crear distribución apex (via Console, más rápido que JSON)

AWS Console → CloudFront → Create distribution:

- **Origin domain:** el bucket S3 actual (cualquiera, no se usa — la función responde antes)
- **Viewer protocol policy:** Redirect HTTP to HTTPS
- **Alternate domain name (CNAME):** `tandemstudio.cloud` (apex, sin www)
- **Custom SSL certificate:** ACM que cubra apex (emitir uno nuevo en us-east-1 si hace falta)
- **Default cache behavior → Function associations:**
  - Viewer request → `TandemStudio-ApexRedirect` (creada con JS de 4.1)

### 4.3 Route 53

Crear record en la zona `tandemstudio.cloud`:

| Name | Type | Value |
|------|------|-------|
| `tandemstudio.cloud` (apex, vacío en Name) | A | Alias → CloudFront apex distribution (d2xxxxx.cloudfront.net) |
| `tandemstudio.cloud` | AAAA | Alias → misma distribución (IPv6) |

Verificar que `www.tandemstudio.cloud` ya tenga su propio A/AAAA alias → la
distribución original (esa que ya funciona).

---

## 5. Deploy del repo a S3

### 5.1 Pre-deploy: minify CSS (opcional pero recomendado)

El main.css tiene ~1900 líneas sin minificar (~60 KB raw). Gzip/brotli de
CloudFront lo lleva a ~10 KB on-the-wire, pero minificar pre-deploy saves
extra ~3-5ms de main-thread parsing en mobile low-end.

```bash
# Con Node.js + csso (o cleancss, o lightningcss)
npx csso assets/css/main.css --output assets/css/main.min.css
npx csso assets/css/design-tokens.css --output assets/css/design-tokens.min.css

# Opcionalmente minify JS (ya es chico ~12KB, impacto menor)
npx terser assets/js/main.js --compress --mangle --output assets/js/main.min.js
```

Si aplicás esto, cambiá las 22 references en los HTMLs de `main.css?v=2` →
`main.min.css?v=2`. Alternativa: mantené las non-minified y dejá que
CloudFront brotli haga el trabajo (suficiente para este tamaño de proyecto).

### 5.2 Sync al bucket

```bash
# Desde /Users/feder/VScode/Tandem-Landing/
aws s3 sync . s3://<BUCKET-NAME>/ \
  --exclude ".playwright-mcp/*" \
  --exclude "*.md" \
  --exclude ".DS_Store" \
  --exclude "tandem-*-fullpage.png" \
  --exclude "tandem-*-final.png" \
  --exclude "tandem-*-verified.png" \
  --delete \
  --cache-control "public, max-age=300"

# Assets con cache inmutable (CSS, JS, imágenes — cambian poco)
aws s3 cp assets/ s3://<BUCKET-NAME>/assets/ \
  --recursive \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*" \
  --include "*.css" \
  --include "*.js" \
  --include "*.webp" \
  --include "*.png" \
  --include "*.jpeg" \
  --include "*.jpg" \
  --include "*.svg"

# Invalidate CloudFront para que los cambios salgan ya
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*"
```

**Notas importantes:**

- **NO excluir `*.png`:** los PNG siguen necesarios como fallback de `<picture>`
  para navegadores que no soportan WebP. Si los excluís, carousel de clientes
  queda roto en browsers viejos.
- **`--exclude "*.md"`** excluye DESIGN.md + INFRA.md + cualquier doc futuro.
- **`--delete`** borra del bucket lo que no esté en el repo. Cuidado con
  archivos generados en S3 fuera del repo (e.g. `og-default.jpg` pendiente
  de generar, si lo subís manual al bucket se borraría en el próximo sync).
  Opción segura: remover `--delete` hasta que esté todo versionado.

---

## 6. Verificación post-deploy

```bash
# 6.1 Security headers
curl -sI https://www.tandemstudio.cloud/ | grep -iE \
  "^(strict-transport|content-security|x-content-type|x-frame|referrer-policy|permissions-policy)"

# Esperado (6 líneas):
# strict-transport-security: max-age=63072000; includeSubDomains; preload
# x-content-type-options: nosniff
# x-frame-options: SAMEORIGIN
# referrer-policy: strict-origin-when-cross-origin
# permissions-policy: camera=(), microphone=(), ...
# content-security-policy: default-src 'self'; script-src ...

# 6.2 Redirect apex → www
curl -sI https://tandemstudio.cloud/ | head -5
# Esperado:
# HTTP/2 301
# location: https://www.tandemstudio.cloud/

# 6.3 Redirect /en/index.html → /en/
curl -sI https://www.tandemstudio.cloud/en/index.html | head -5
# Esperado:
# HTTP/2 301
# location: /en/

# 6.4 Canonical + hreflang presentes
curl -s https://www.tandemstudio.cloud/ | grep -iE "canonical|hreflang" | head -5

# 6.5 Mozilla Observatory (score A o B esperado)
open "https://observatory.mozilla.org/analyze/www.tandemstudio.cloud"

# 6.6 Google Rich Results Test (validar JSON-LD)
open "https://search.google.com/test/rich-results?url=https%3A%2F%2Fwww.tandemstudio.cloud%2F"
```

---

## 7. Post-deploy: Google Search Console + sitemap

Una vez deployado:

1. Registrar la propiedad en [Search Console](https://search.google.com/search-console) (mejor como **Domain property** para cubrir www + apex + subdomains del futuro).
2. Verificar vía DNS TXT en Route 53.
3. Ir a Sitemaps → submit `https://www.tandemstudio.cloud/sitemap.xml`.
4. Esperar 2-7 días para ver datos iniciales en Performance.

Lo mismo con Bing Webmaster Tools (Argentina aún tiene Bing share no-trivial
para buscadores integrados en edge/Windows corporativos).

---

## 8. Wiki update propuesto (detectado durante uso)

**Nueva página sugerida:** `[[security-headers-cloudfront-s3]]`

**Por qué:** la wiki page actual [[security-headers-checklist]] está 100%
orientada a Next.js + Vercel (`next.config.js` headers). El stack S3+CloudFront
es común para landing sites B2B LATAM (sin build step), y los mismos headers se
configuran de forma muy distinta (Response Headers Policy, CloudFront Functions).

**Contenido propuesto** (si Fede aprueba ingerir):
- Response Headers Policy JSON verificado contra Mozilla Observatory
- CSP adaptado para sitios estáticos con Google Fonts + JSON-LD inline
- CloudFront Functions para redirects comunes (clean URLs, apex→www)
- Deploy workflow (S3 sync + invalidation) con cache headers diferenciados

---

_Generado 2026-04-17 · basado en wiki [[security-headers-checklist]] adaptado_
_a S3+CloudFront + stack real detectado via curl._
