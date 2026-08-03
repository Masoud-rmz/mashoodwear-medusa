#!/usr/bin/env python3
"""Build separate self-contained HTML pages for mobile client preview delivery."""

from __future__ import annotations

import base64
import re
import urllib.parse
import zipfile
from pathlib import Path

PREVIEW_DIR = Path(__file__).resolve().parent
FULL_SITE = PREVIEW_DIR / "full-site.html"
SHARED_CSS = PREVIEW_DIR / "shared.css"
LOGO = PREVIEW_DIR / "assets" / "logo.svg"
LOGO_PNG = PREVIEW_DIR / "assets" / "mashoodlogo.png"
CLIENT_DIR = PREVIEW_DIR / "client"
DELIVERY_DIR = PREVIEW_DIR / "mashoodwear-client-preview" / "mashoodwear-preview"
ZIP_OUTPUT = PREVIEW_DIR / "mashoodwear-client-preview.zip"

CLIENT_BANNER = "Design preview — open on your phone. Sample content only."

INSTAGRAM_URL = "https://www.instagram.com/mashood.wear"
TELEGRAM_URL = "https://t.me/lilhosseini"
INSTAGRAM_HANDLE = "@mashood.wear"
TELEGRAM_HANDLE = "@lilhosseini"

PRODUCTS = [
    {
        "name": "Street Hoodie Black",
        "price": "2,450,000",
        "category": "hoodies",
        "colors": ["Black", "Gray"],
        "sizes": ["S", "M", "L", "XL"],
        "stock": 8,
    },
    {
        "name": "Oversized Tee White",
        "price": "890,000",
        "category": "t-shirts",
        "colors": ["White"],
        "sizes": ["S", "M", "L", "XL", "2XL"],
        "stock": 2,
    },
    {
        "name": "Cargo Pants Brown",
        "price": "1,750,000",
        "category": "pants",
        "colors": ["Brown", "Black"],
        "sizes": ["M", "L", "XL"],
        "stock": 5,
    },
    {
        "name": "Crop Hoodie Cream",
        "price": "1,120,000",
        "category": "crop",
        "colors": ["Cream", "White"],
        "sizes": ["S", "M", "L"],
        "stock": 0,
    },
    {
        "name": "Graphic Tee Blue",
        "price": "980,000",
        "category": "t-shirts",
        "colors": ["Blue", "Black"],
        "sizes": ["S", "M", "L", "XL"],
        "stock": 12,
    },
    {
        "name": "Wide Leg Pants Gray",
        "price": "1,620,000",
        "category": "pants",
        "colors": ["Gray", "Black"],
        "sizes": ["M", "L", "XL", "2XL"],
        "stock": 3,
    },
    {
        "name": "Pastel Crop Top",
        "price": "760,000",
        "category": "crop",
        "colors": ["Pastel Green", "White"],
        "sizes": ["S", "M", "L"],
        "stock": 6,
    },
    {
        "name": "Logo Sticker Pack",
        "price": "120,000",
        "category": "stickers",
        "colors": ["White", "Black"],
        "sizes": ["One Size"],
        "stock": 15,
    },
    {
        "name": "Tiffany Script Hoodie",
        "price": "2,680,000",
        "category": "hoodies",
        "colors": ["Tiffany Green", "Black"],
        "sizes": ["M", "L", "XL"],
        "stock": 1,
    },
]

BRAND_COLLECTIONS = [
    {
        "name": "Drift",
        "slug": "drift",
        "description": "Late-night streets, muted tones, pieces built to move.",
        "product_indices": [0, 1, 4],
    },
    {
        "name": "Urban Night",
        "slug": "urban-night",
        "description": "City lights, heavy fabrics, limited run.",
        "product_indices": [2, 5, 8],
    },
]

CATEGORIES = [
    ("t-shirts", "T-Shirts"),
    ("hoodies", "Hoodies"),
    ("pants", "Pants"),
    ("crop", "Crop"),
    ("stickers", "Stickers"),
]

COLORS = [
    ("Black", "black"),
    ("White", "white"),
    ("Gray", "gray"),
    ("Cream", "cream"),
    ("Brown", "brown"),
    ("Blue", "blue"),
    ("Pastel Green", "pastel-green"),
    ("Tiffany Green", "tiffany-green"),
]

SIZES = ["S", "M", "L", "XL", "2XL"]

SAMPLE_CART = [
    {"name": "Street Hoodie Black", "size": "M", "color": "Black", "price": "2,450,000", "qty": 1},
    {"name": "Oversized Tee White", "size": "L", "color": "White", "price": "890,000", "qty": 1},
]

PAGES = {
    "home": "index.html",
    "collections": "collections.html",
    "collection-drift": "collection-drift.html",
    "collection-urban-night": "collection-urban-night.html",
    "products": "products.html",
    "product": "product.html",
    "cart": "cart.html",
    "checkout": "checkout.html",
    "about": "about.html",
    "contact": "contact.html",
    "lookbook": "lookbook.html",
    "how-to-buy": "how-to-buy.html",
}

NAV_ITEMS = [
    ("home", "Home"),
    ("collections", "Collections"),
    ("products", "Products"),
    ("lookbook", "Lookbook"),
    ("about", "About"),
    ("contact", "Contact"),
]

MOBILE_EXTRA_CSS = """
/* Client delivery — mobile-first tweaks */
.header { top: 0; }
.mobile-menu { inset: 64px 0 0 0; }
.preview-banner {
  font-size: 11px;
  line-height: 1.45;
  padding: 8px 14px;
}
@media (max-width: 768px) {
  .hero-title { font-size: clamp(44px, 12vw, 72px); }
  .hero-subtitle { font-size: 16px; }
  .hero-images { flex-direction: column; }
  .hero-image-slot { flex: 1 1 auto; width: 100%; }
  .section-title { font-size: 26px; }
  .cart-line {
    grid-template-columns: 72px 1fr;
    gap: var(--space-4);
  }
  .cart-line > .product-price {
    grid-column: 2;
    justify-self: end;
    margin-top: -28px;
  }
  .checkout-actions .btn { width: 100%; }
  .toast {
    top: auto;
    bottom: 20px;
    left: 16px;
    right: 16px;
    transform: translateY(20px);
  }
  .toast.show { transform: translateY(0); }
  .pagination { flex-wrap: wrap; }
  .pagination .btn { flex: 1; min-width: 80px; }
}
.collection-card {
  display: block;
  text-decoration: none;
  color: inherit;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  overflow: hidden;
  transition: all 200ms ease;
}
.collection-card:hover {
  border-color: #330000;
  box-shadow: 4px 4px 0px #330000;
  transform: translateY(-3px);
}
.collection-card-image {
  aspect-ratio: 4/5;
  background: rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.collection-card-body { padding: var(--space-4); }
.collection-card-name {
  font-family: var(--font-display);
  font-size: 22px;
  text-transform: uppercase;
  margin: 0 0 4px;
}
.collection-card-count {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}
.card-stock-label {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 6px 0 0;
}
.card-stock-label.in-stock { color: var(--color-text-muted); }
.card-stock-label.low-stock { color: #c44; }
.card-stock-label.sold-out { color: #888; }
"""

MOBILE_MENU_JS = """
document.getElementById("menu-toggle")?.addEventListener("click", () => {
  const menu = document.getElementById("mobile-menu");
  const open = menu.classList.toggle("open");
  document.getElementById("menu-toggle").setAttribute("aria-expanded", String(open));
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("mobile-menu")?.classList.remove("open");
    document.getElementById("filter-sheet")?.classList.remove("open");
    document.getElementById("sheet-overlay")?.classList.remove("open");
  }
});
"""

LOGO_BG_PARALLAX_JS = """
(function initLogoBgParallax() {
  const layer = document.querySelector(".logo-bg");
  if (!layer) return;

  const marks = [...layer.querySelectorAll(".logo-bg__mark")];
  const speeds = [0.14, -0.1, 0.2, -0.16];
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function applyParallax() {
    if (motionQuery.matches) {
      marks.forEach((mark) => mark.style.removeProperty("--mark-shift-y"));
      return;
    }
    const scrollY = window.scrollY;
    marks.forEach((mark, index) => {
      mark.style.setProperty("--mark-shift-y", scrollY * speeds[index] + "px");
    });
  }

  let framePending = false;
  window.addEventListener(
    "scroll",
    () => {
      if (framePending) return;
      framePending = true;
      requestAnimationFrame(() => {
        applyParallax();
        framePending = false;
      });
    },
    { passive: true }
  );
  motionQuery.addEventListener("change", applyParallax);
  applyParallax();
})();
"""

FILTER_SHEET_JS = """
document.getElementById("filters-open")?.addEventListener("click", () => {
  syncFilterPanels(false);
  document.getElementById("filter-sheet").classList.add("open");
  document.getElementById("sheet-overlay").classList.add("open");
});
document.getElementById("sheet-overlay")?.addEventListener("click", () => {
  document.getElementById("filter-sheet").classList.remove("open");
  document.getElementById("sheet-overlay").classList.remove("open");
});
document.getElementById("filters-apply")?.addEventListener("click", () => {
  syncFilterPanels(true);
  applyCollectionFilters();
  document.getElementById("filter-sheet").classList.remove("open");
  document.getElementById("sheet-overlay").classList.remove("open");
});
"""

COLLECTION_FILTER_JS = """
function getFilterState(root) {
  const categories = [...root.querySelectorAll('[data-filter="category"]:checked')].map((el) => el.value);
  const colors = [...root.querySelectorAll('[data-filter="color"].active')].map((el) => el.dataset.value);
  const sizes = [...root.querySelectorAll('[data-filter="size"].active')].map((el) => el.textContent.trim());
  return { categories, colors, sizes };
}

function setFilterState(state, root) {
  root.querySelectorAll('[data-filter="category"]').forEach((el) => {
    el.checked = state.categories.includes(el.value);
  });
  root.querySelectorAll('[data-filter="color"]').forEach((el) => {
    el.classList.toggle("active", state.colors.includes(el.dataset.value));
  });
  root.querySelectorAll('[data-filter="size"]').forEach((el) => {
    el.classList.toggle("active", state.sizes.includes(el.textContent.trim()));
  });
}

function syncFilterPanels(fromSheet) {
  const desktop = document.getElementById("filters-desktop");
  const sheet = document.getElementById("filter-sheet");
  if (!desktop || !sheet) return;
  if (fromSheet) setFilterState(getFilterState(sheet), desktop);
  else setFilterState(getFilterState(desktop), sheet);
}

function applyCollectionFilters() {
  const desktop = document.getElementById("filters-desktop");
  if (!desktop) return;
  const state = getFilterState(desktop);
  const search = (document.querySelector('[data-filter="search"]')?.value || "").trim().toLowerCase();
  let visible = 0;
  document.querySelectorAll("[data-product]").forEach((card) => {
    const cardCategory = card.dataset.category;
    const cardColors = card.dataset.colors.split(",");
    const cardSizes = card.dataset.sizes.split(",");
    const cardName = card.dataset.name.toLowerCase();
    let show = true;
    if (state.categories.length && !state.categories.includes(cardCategory)) show = false;
    if (state.colors.length && !state.colors.some((color) => cardColors.includes(color))) show = false;
    if (state.sizes.length && !state.sizes.some((size) => cardSizes.includes(size))) show = false;
    if (search && !cardName.includes(search)) show = false;
    card.hidden = !show;
    if (show) visible += 1;
  });
  const meta = document.getElementById("collection-meta");
  if (meta) meta.textContent = visible === 1 ? "Showing 1 product" : `Showing ${visible} products`;
  const empty = document.getElementById("collection-empty");
  const grid = document.getElementById("collection-grid");
  if (empty) empty.hidden = visible > 0;
  if (grid) grid.hidden = visible === 0;
}

function clearCollectionFilters() {
  const emptyState = { categories: [], colors: [], sizes: [] };
  const desktop = document.getElementById("filters-desktop");
  const sheet = document.getElementById("filter-sheet");
  if (desktop) setFilterState(emptyState, desktop);
  if (sheet) setFilterState(emptyState, sheet);
  const search = document.querySelector('[data-filter="search"]');
  if (search) search.value = "";
  applyCollectionFilters();
}

function initCollectionFilters() {
  const desktop = document.getElementById("filters-desktop");
  if (!desktop) return;
  desktop.querySelectorAll('[data-filter="category"]').forEach((el) => {
    el.addEventListener("change", () => { syncFilterPanels(false); applyCollectionFilters(); });
  });
  desktop.querySelectorAll('[data-filter="color"]').forEach((el) => {
    el.addEventListener("click", () => {
      el.classList.toggle("active");
      syncFilterPanels(false);
      applyCollectionFilters();
    });
  });
  desktop.querySelectorAll('[data-filter="size"]').forEach((el) => {
    el.addEventListener("click", () => {
      el.classList.toggle("active");
      syncFilterPanels(false);
      applyCollectionFilters();
    });
  });
  const sheet = document.getElementById("filter-sheet");
  sheet?.querySelectorAll('[data-filter="color"][data-sheet]').forEach((el) => {
    el.addEventListener("click", () => el.classList.toggle("active"));
  });
  sheet?.querySelectorAll('[data-filter="size"][data-sheet]').forEach((el) => {
    el.addEventListener("click", () => el.classList.toggle("active"));
  });
  document.querySelector('[data-filter="search"]')?.addEventListener("input", applyCollectionFilters);
  document.getElementById("clear-filters")?.addEventListener("click", clearCollectionFilters);
  document.getElementById("empty-clear-filters")?.addEventListener("click", clearCollectionFilters);
  applyCollectionFilters();
}

initCollectionFilters();
"""

ABOUT_PAGE_BODY = """    <div class="container cms-page cms-page--about">
      <h1 class="page-title">About Mashood</h1>
      <div class="cms-body">
        <p class="about-tagline">Not made to follow. Made to lead.</p>
        <p>MASHOOD was born for those who refuse to stay in line.</p>
        <p>Rooted in hip-hop culture, street culture, graffiti, music, and the raw energy of the streets, we create clothing that represents individuality, confidence, and self-expression.</p>
        <p>We don't chase trends.<br>We create pieces that carry meaning.</p>
        <p>Every graphic, every fabric, and every detail is designed to remind you that your story deserves to be worn.</p>
        <hr class="cms-divider" />
        <h2>Our Values</h2>
        <div class="values-grid">
          <div class="value-card">
            <div class="value-card__fire" aria-hidden="true">
              <span class="flame flame--1"></span><span class="flame flame--2"></span><span class="flame flame--3"></span><span class="flame flame--4"></span>
              <span class="ember ember--1"></span><span class="ember ember--2"></span><span class="ember ember--3"></span>
            </div>
            <div class="value-card__inner">
              <h3>Street Culture</h3>
              <p>Streetwear is more than clothing—it's a language. Every piece we create reflects the creativity, resilience, and attitude born from the streets.</p>
            </div>
          </div>
          <div class="value-card">
            <div class="value-card__fire" aria-hidden="true">
              <span class="flame flame--1"></span><span class="flame flame--2"></span><span class="flame flame--3"></span><span class="flame flame--4"></span>
              <span class="ember ember--1"></span><span class="ember ember--2"></span><span class="ember ember--3"></span>
            </div>
            <div class="value-card__inner">
              <h3>Hip-Hop Culture</h3>
              <p>Hip-hop has always been about authenticity, expression, and turning struggle into art. That mindset shapes everything we design—from our graphics to the stories behind every collection.</p>
            </div>
          </div>
          <div class="value-card">
            <div class="value-card__fire" aria-hidden="true">
              <span class="flame flame--1"></span><span class="flame flame--2"></span><span class="flame flame--3"></span><span class="flame flame--4"></span>
              <span class="ember ember--1"></span><span class="ember ember--2"></span><span class="ember ember--3"></span>
            </div>
            <div class="value-card__inner">
              <h3>Brotherhood</h3>
              <p>Built for the people who stand beside you. For the nights you'll never forget. For the ones who were there before anyone else.</p>
            </div>
          </div>
        </div>
        <hr class="cms-divider" />
        <h2>Our Approach</h2>
        <p>Quality over quantity.</p>
        <p>Every MASHOOD drop is produced in limited numbers because clothing should feel personal—not disposable.</p>
        <p>Every collection tells a different story, inspired by the culture that raised us and the people who continue to shape who we are.</p>
        <hr class="cms-divider" />
        <h2>For My Homies in the Hood</h2>
        <p>More than a slogan.</p>
        <p>It's a tribute to where we started, the people who shaped us, and the ones who stay beside us no matter how far the road goes.</p>
        <p>Because no matter where life takes you, you never forget your homies.</p>
        <p class="about-closing">Welcome to MASHOOD</p>
      </div>
    </div>"""

PRODUCT_PAGE_JS = """
const addBtn = document.getElementById("add-to-cart");
let size = null;
let color = null;
function updateAdd() { addBtn.disabled = !(size && color); }
document.querySelectorAll("#pd-sizes .size-btn").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll("#pd-sizes .size-btn").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    size = b.textContent;
    updateAdd();
  });
});
document.querySelectorAll("#pd-colors .color-swatch").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll("#pd-colors .color-swatch").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    color = b.getAttribute("aria-label");
    updateAdd();
  });
});
addBtn?.addEventListener("click", () => {
  const t = document.getElementById("toast");
  t.textContent = "Added to cart — open Cart page to preview";
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
});
"""


def svg_data_uri(svg_text: str) -> str:
    return f"data:image/svg+xml,{urllib.parse.quote(svg_text.strip(), safe='')}"


def png_data_uri(path: Path) -> str:
    encoded = base64.standard_b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def logo_bg_html() -> str:
    return """<div class="logo-bg" aria-hidden="true">
  <span class="logo-bg__mark"></span>
  <span class="logo-bg__mark"></span>
  <span class="logo-bg__mark"></span>
  <span class="logo-bg__mark"></span>
</div>"""


def extract_page_styles() -> str:
    html = FULL_SITE.read_text(encoding="utf-8")
    match = re.search(r"<style>(.*?)</style>", html, re.DOTALL)
    if not match:
        return ""
    styles = match.group(1)
    styles = re.sub(r"/\* SPA shell \*/.*?(?=/\* Home hero \*/)", "", styles, flags=re.DOTALL)
    styles = re.sub(r"\.page \{ display: none; \}\s*", "", styles)
    styles = re.sub(r"\.page\.active \{ display: block; \}\s*", "", styles)
    styles = re.sub(r"\.header \{ top: 40px; \}\s*", "", styles)
    return styles.strip()


def build_stylesheet(logo_uri: str) -> str:
    shared = SHARED_CSS.read_text(encoding="utf-8")
    shared = shared.replace("url(assets/mashoodlogo.png)", f"url({logo_uri})")
    page_styles = extract_page_styles()
    return f"{shared}\n\n/* page styles */\n{page_styles}\n\n{MOBILE_EXTRA_CSS}"


def page_href(key: str) -> str:
    return PAGES[key]


def stock_label(total_stock: int) -> str:
    if total_stock == 0:
        return "Sold out"
    if 1 <= total_stock <= 3:
        return f"Only {total_stock} left"
    return "In stock"


def stock_label_class(total_stock: int) -> str:
    if total_stock == 0:
        return "sold-out"
    if 1 <= total_stock <= 3:
        return "low-stock"
    return "in-stock"


def product_cards_html(limit: int | None = None, indices: list[int] | None = None, *, show_stock: bool = True) -> str:
    if indices is not None:
        items = [PRODUCTS[i] for i in indices if 0 <= i < len(PRODUCTS)]
    else:
        items = PRODUCTS[:limit] if limit else PRODUCTS
    cards = []
    for product in items:
        colors = ",".join(product["colors"])
        sizes = ",".join(product["sizes"])
        stock = product.get("stock", 0)
        stock_html = ""
        if show_stock:
            stock_html = (
                f'<p class="card-stock-label {stock_label_class(stock)}">{stock_label(stock)}</p>'
            )
        cards.append(
            f"""<a href="{page_href('product')}" class="product-card" data-product data-name="{product['name']}" data-category="{product['category']}" data-colors="{colors}" data-sizes="{sizes}">
        <div class="product-card-image"><div class="product-card-image-inner">Product image</div></div>
        <div class="product-card-body">
          <h3 class="product-name">{product['name']}</h3>
          <p class="product-price">{product['price']}</p>
          {stock_html}
        </div>
      </a>"""
        )
    return "\n      ".join(cards)


def collection_cards_html() -> str:
    cards = []
    for collection in BRAND_COLLECTIONS:
        count = len(collection["product_indices"])
        page_key = f"collection-{collection['slug']}"
        href = page_href(page_key) if page_key in PAGES else page_href("collections")
        cards.append(
            f"""<a href="{href}" class="collection-card">
        <div class="collection-card-image">{collection['name']} cover</div>
        <div class="collection-card-body">
          <h3 class="collection-card-name">{collection['name']}</h3>
          <p class="collection-card-count">{count} pieces</p>
        </div>
      </a>"""
        )
    return "\n      ".join(cards)


def collection_detail_body(collection: dict) -> str:
    page_key = f"collection-{collection['slug']}"
    count = len(collection["product_indices"])
    return f"""    <div class="container">
      <a href="{page_href('collections')}" class="back-link">← Back to Collections</a>
      <div class="page-header">
        <h1 class="page-title">{collection['name']}</h1>
        <p style="color:var(--color-text-muted);max-width:560px;margin-top:8px">{collection['description']}</p>
      </div>
      <p style="color:var(--color-text-muted);font-size:14px;margin-bottom:var(--space-5)">{count} pieces</p>
      <div class="product-grid">
      {product_cards_html(indices=collection['product_indices'])}
      </div>
    </div>"""


def filter_controls_html(*, sheet: bool = False) -> str:
    sheet_attr = ' data-sheet' if sheet else ""
    category_lines = "\n".join(
        f'            <label><input type="checkbox" value="{slug}" data-filter="category"{sheet_attr} /> {label}</label>'
        for slug, label in CATEGORIES
    )
    size_buttons = "\n".join(
        f'            <button class="size-btn" type="button" data-filter="size"{sheet_attr}>{size}</button>'
        for size in SIZES
    )
    color_buttons = "\n".join(
        f'            <button class="color-swatch {css_class}" type="button" data-filter="color" data-value="{label}"{sheet_attr} aria-label="{label}"></button>'
        for label, css_class in COLORS
    )
    return f"""          <p class="filter-label">Category</p>
          <div class="filter-group filter-options">
{category_lines}
          </div>
          <p class="filter-label">Size</p>
          <div class="filter-group size-grid">
{size_buttons}
          </div>
          <p class="filter-label">Color</p>
          <div class="filter-group color-swatches">
{color_buttons}
          </div>"""


def cart_lines_html() -> str:
    lines = []
    for item in SAMPLE_CART:
        line_total = item["price"]
        lines.append(
            f"""<div class="cart-line">
        <div class="cart-thumb">IMG</div>
        <div>
          <strong>{item['name']}</strong>
          <div class="cart-meta">{item['size']} · {item['color']} · {item['price']}</div>
          <div class="qty-control">
            <button class="qty-btn" type="button" aria-label="Decrease">−</button>
            <span>{item['qty']}</span>
            <button class="qty-btn" type="button" aria-label="Increase">+</button>
          </div>
        </div>
        <span class="product-price" style="font-size:18px">{line_total}</span>
      </div>"""
        )
    return "\n      ".join(lines)


def checkout_summary_html() -> str:
    rows = []
    for item in SAMPLE_CART:
        rows.append(
            f'<div class="checkout-line"><span>{item["name"]} ({item["size"]}, {item["color"]}) × {item["qty"]}</span><span>{item["price"]}</span></div>'
        )
    rows.append(
        '<div class="checkout-total"><span>Total</span><span>3,340,000 Toman</span></div>'
    )
    return "\n        ".join(rows)


def header_html(active: str, logo_uri: str) -> str:
    nav_links = []
    for key, label in NAV_ITEMS:
        cls = "nav-link active" if key == active else "nav-link"
        nav_links.append(f'<li><a href="{page_href(key)}" class="{cls}">{label}</a></li>')

    return f"""<header class="header">
    <div class="header-inner">
      <a href="{page_href('home')}" class="logo" aria-label="Mashoodwear home">
        <img src="{logo_uri}" alt="" class="logo-img" width="160" height="36" onerror="this.hidden=true;this.nextElementSibling.hidden=false" />
        <span class="logo-fallback" hidden>MASHOOD</span>
      </a>
      <nav class="nav" aria-label="Main navigation">
        <ul class="nav-links">
          {''.join(nav_links)}
        </ul>
      </nav>
      <div class="header-actions">
        <a href="{page_href('cart')}" class="cart-btn" aria-label="View cart">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        </a>
        <button class="hamburger" id="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>
  </header>"""


def mobile_menu_html() -> str:
    links = []
    for key, label in NAV_ITEMS:
        links.append(f'<a href="{page_href(key)}">{label}</a>')
    links.append(f'<a href="{page_href("how-to-buy")}">How to Buy</a>')
    return f"""<div class="mobile-menu" id="mobile-menu" aria-hidden="true">
    {''.join(links)}
  </div>"""


def footer_html(logo_uri: str) -> str:
    return f"""<footer class="footer">
    <div class="footer-grid">
      <div>
        <a href="{page_href('home')}" class="footer-logo" aria-label="Mashoodwear home">
          <img src="{logo_uri}" alt="" class="footer-logo-img" width="120" height="24" onerror="this.hidden=true;this.nextElementSibling.hidden=false" />
          <span class="footer-logo-fallback" hidden>MASHOOD</span>
        </a>
        <p class="footer-tagline">Independent streetwear. Clothing isn't just coverage — it's how you show who you are.</p>
      </div>
      <div>
        <p class="footer-heading">Shop</p>
        <ul class="footer-links">
          <li><a href="{page_href('collections')}">Collections</a></li>
          <li><a href="{page_href('products')}">Products</a></li>
          <li><a href="{page_href('lookbook')}">Lookbook</a></li>
          <li><a href="{page_href('how-to-buy')}">How to Buy</a></li>
        </ul>
      </div>
      <div>
        <p class="footer-heading">Info</p>
        <ul class="footer-links">
          <li><a href="{page_href('about')}">About</a></li>
          <li><a href="{page_href('contact')}">Contact</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-copy">© 2026 Mashoodwear. All rights reserved.</p>
      <div class="social-links">
        <a href="{INSTAGRAM_URL}" target="_blank" rel="noopener">Instagram</a>
        <a href="{TELEGRAM_URL}" target="_blank" rel="noopener">Telegram</a>
      </div>
    </div>
  </footer>"""


def filter_sheet_html() -> str:
    return f"""<div class="sheet-overlay" id="sheet-overlay"></div>
  <div class="filter-sheet" id="filter-sheet">
    <div class="sheet-handle"></div>
    <p class="filter-label">Filters</p>
{filter_controls_html(sheet=True)}
    <button class="btn btn-primary" id="filters-apply" type="button" style="width:100%;margin-top:16px">Apply filters</button>
  </div>"""


def render_page(
    *,
    title: str,
    active: str,
    body: str,
    logo_uri: str,
    css: str,
    extra_scripts: str = "",
    include_filter_sheet: bool = False,
) -> str:
    scripts = MOBILE_MENU_JS + LOGO_BG_PARALLAX_JS
    if include_filter_sheet:
        scripts += FILTER_SHEET_JS + COLLECTION_FILTER_JS
    if extra_scripts:
        scripts += extra_scripts

    filter_block = filter_sheet_html() if include_filter_sheet else ""
    toast = '<div class="toast" id="toast" role="status" aria-live="polite"></div>'

    return f"""<!DOCTYPE html>
<!-- Client preview — generated by build-client-preview.py -->
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <style>
{css}
  </style>
</head>
<body>

  {logo_bg_html()}

  <div class="preview-banner">{CLIENT_BANNER}</div>

  {header_html(active, logo_uri)}
  {mobile_menu_html()}

  <main>
{body}
  </main>

  {footer_html(logo_uri)}

  {filter_block}
  {toast}

  <script>
{scripts}
  </script>
</body>
</html>
"""


def page_bodies() -> dict[str, tuple[str, str, str, bool]]:
    """Return title, active key, body html, include_filter_sheet per page key."""
    return {
        "home": (
            "Mashoodwear — Home",
            "home",
            f"""    <section class="hero">
      <div class="hero-text">
        <p class="hero-eyebrow">Independent streetwear</p>
        <h1 class="hero-title">
          <span class="hero-title-line">FROM THE <span class="accent">STREETS</span>,</span>
          <span class="hero-title-line hero-title-line--bottom">FOR THE <span class="accent">FEW</span></span>
        </h1>
        <p class="hero-subtitle">Designed by hand. Inspired by the streets. Every piece tells a story — yours to wear.</p>
        <div class="hero-ctas">
          <a href="{page_href('products')}" class="btn btn-primary">View Products</a>
          <a href="{INSTAGRAM_URL}" target="_blank" rel="noopener" class="btn btn-secondary">Order on Instagram</a>
        </div>
      </div>
      <div class="hero-images">
        <div class="hero-image-slot">Model image 1</div>
        <div class="hero-image-slot">Model image 2</div>
      </div>
    </section>
    <section class="section container">
      <div class="section-header">
        <h2 class="section-title">New Arrivals</h2>
        <a href="{page_href('products')}" class="section-link">View all →</a>
      </div>
      <div class="product-grid">
      {product_cards_html(limit=6, show_stock=False)}
      </div>
    </section>
    <section class="container">
      <div class="brand-story">
        <h2 class="brand-story-title">BUILT DIFFERENT.</h2>
        <p class="brand-story-text">Born from the streets — where identity, taste, and path differ for everyone. We don't design for the masses or chase fleeting trends.</p>
        <a href="{page_href('about')}" class="btn btn-secondary">Read more</a>
      </div>
    </section>""",
            False,
        ),
        "collections": (
            "Collections — Mashoodwear",
            "collections",
            f"""    <div class="container">
      <h1 class="page-title">Collections</h1>
      <p style="color:var(--color-text-muted);margin-bottom:var(--space-6)">Brand drops — tap a collection to see the pieces.</p>
      <div class="product-grid">
      {collection_cards_html()}
      </div>
    </div>""",
            False,
        ),
        "products": (
            "Products — Mashoodwear",
            "products",
            f"""    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Products</h1>
        <form class="search-bar" action="#" onsubmit="return false">
          <input class="search-input" type="search" placeholder="Search products…" data-filter="search" />
          <button class="btn btn-primary" type="button" style="padding:12px 16px">Search</button>
        </form>
      </div>
      <button class="btn btn-secondary filters-mobile-btn" id="filters-open" type="button">Filters</button>
      <div class="collection-layout">
        <aside class="filters" id="filters-desktop">
{filter_controls_html()}
          <button class="clear-filters" type="button" id="clear-filters">Clear filters</button>
        </aside>
        <section>
          <p style="color:var(--color-text-muted);font-size:14px;margin-bottom:var(--space-5)" id="collection-meta">Showing {len(PRODUCTS)} products</p>
          <div class="product-grid" id="collection-grid">
          {product_cards_html()}
          </div>
          <div class="empty-results" id="collection-empty" hidden>
            <p>No products match these filters — try changing them</p>
            <button class="btn btn-primary" type="button" id="empty-clear-filters" style="margin-top:24px">Clear filters</button>
          </div>
          <nav class="pagination" aria-label="Pagination">
            <button class="btn btn-secondary" disabled style="padding:10px 16px">Previous</button>
            <button class="btn btn-primary" style="padding:10px 16px">1</button>
            <button class="btn btn-secondary" style="padding:10px 16px">Next</button>
          </nav>
        </section>
      </div>
    </div>""",
            True,
        ),
        "product": (
            "Street Hoodie Black — Mashoodwear",
            "products",
            f"""    <div class="container">
      <a href="{page_href('products')}" class="back-link">← Back to Products</a>
      <div class="product-detail">
        <div class="product-gallery">Product image</div>
        <div class="product-info">
          <h1>Street Hoodie Black</h1>
          <p class="product-price">2,450,000</p>
          <div class="variant-group">
            <p class="variant-label">Size</p>
            <div class="size-grid" id="pd-sizes">
              <button class="size-btn" type="button">S</button>
              <button class="size-btn" type="button">M</button>
              <button class="size-btn" type="button">L</button>
              <button class="size-btn" type="button">XL</button>
            </div>
          </div>
          <div class="variant-group">
            <p class="variant-label">Color</p>
            <div class="color-swatches" id="pd-colors">
              <button class="color-swatch black" type="button" aria-label="Black"></button>
              <button class="color-swatch white" type="button" aria-label="White"></button>
              <button class="color-swatch gray" type="button" aria-label="Gray"></button>
              <button class="color-swatch cream" type="button" aria-label="Cream"></button>
              <button class="color-swatch brown" type="button" aria-label="Brown"></button>
              <button class="color-swatch blue" type="button" aria-label="Blue"></button>
              <button class="color-swatch pastel-green" type="button" aria-label="Pastel Green"></button>
              <button class="color-swatch tiffany-green" type="button" aria-label="Tiffany Green"></button>
            </div>
          </div>
          <p class="stock-badge">In stock</p>
          <button class="btn btn-primary" id="add-to-cart" disabled type="button">Add to Cart</button>
          <p class="product-desc">Heavyweight cotton hoodie with embroidered logo. Handmade finish. Street-ready fit.</p>
        </div>
      </div>
    </div>""",
            False,
        ),
        "cart": (
            "Cart — Mashoodwear",
            "products",
            f"""    <div class="container cart-layout">
      <h1 class="page-title">Cart</h1>
      {cart_lines_html()}
      <div class="cart-total">
        <span>Total</span>
        <span>3,340,000 Toman</span>
      </div>
      <a href="{page_href('checkout')}" class="btn btn-primary">Continue to Checkout</a>
    </div>""",
            False,
        ),
        "checkout": (
            "Checkout — Mashoodwear",
            "products",
            f"""    <div class="container">
      <a href="{page_href('cart')}" class="back-link">← Back to cart</a>
      <h1 class="page-title">Complete Order</h1>
      <div class="checkout-layout">
        <div class="checkout-summary">
          {checkout_summary_html()}
        </div>
        <div>
          <div class="info-box">Finalize your order through Instagram Direct. Payment and delivery details are on the <a href="{page_href('how-to-buy')}" class="text-link">How to Buy</a> page.</div>
          <div class="checkout-actions">
            <a href="{INSTAGRAM_URL}" target="_blank" rel="noopener" class="btn btn-primary">Complete Order on Instagram</a>
            <button class="btn btn-secondary" type="button">Copy order details for DM</button>
            <a href="{TELEGRAM_URL}" target="_blank" rel="noopener" class="text-link">Or order via Telegram</a>
          </div>
        </div>
      </div>
    </div>""",
            False,
        ),
        "about": (
            "About — Mashoodwear",
            "about",
            ABOUT_PAGE_BODY,
            False,
        ),
        "contact": (
            "Contact — Mashoodwear",
            "contact",
            """    <div class="container cms-page">
      <h1 class="page-title">Contact</h1>
      <div class="cms-body">
        <p>Questions? Reach us on Instagram Direct or Telegram.</p>
        <p><strong>Instagram:</strong> {INSTAGRAM_HANDLE}</p>
        <p><strong>Telegram:</strong> {TELEGRAM_HANDLE}</p>
      </div>
    </div>""",
            False,
        ),
        "lookbook": (
            "Lookbook — Mashoodwear",
            "lookbook",
            """    <div class="container cms-page">
      <h1 class="page-title">Lookbook</h1>
      <div class="cms-body">
        <p>Editorial styling — street culture, raw energy, real people.</p>
        <div class="product-grid" style="margin-top:var(--space-5)">
          <div class="hero-image-slot" style="aspect-ratio:4/5">Look 1</div>
          <div class="hero-image-slot" style="aspect-ratio:4/5">Look 2</div>
          <div class="hero-image-slot" style="aspect-ratio:4/5">Look 3</div>
        </div>
      </div>
    </div>""",
            False,
        ),
        "how-to-buy": (
            "How to Buy — Mashoodwear",
            "products",
            """    <div class="container cms-page">
      <h1 class="page-title">How to Buy</h1>
      <div class="cms-body">
        <p><strong>1.</strong> Add items to cart and go to checkout.</p>
        <p><strong>2.</strong> Tap Complete Order on Instagram or copy order details into DM.</p>
        <p><strong>3.</strong> Payment: bank transfer after order confirmation.</p>
        <p><strong>4.</strong> Delivery: 3–7 business days within Iran.</p>
      </div>
    </div>""",
            False,
        ),
    }


def build() -> None:
    logo_uri = png_data_uri(LOGO_PNG)
    css = build_stylesheet(logo_uri)
    CLIENT_DIR.mkdir(exist_ok=True)
    DELIVERY_DIR.mkdir(parents=True, exist_ok=True)

    bodies = page_bodies()
    for collection in BRAND_COLLECTIONS:
        page_key = f"collection-{collection['slug']}"
        bodies[page_key] = (
            f"{collection['name']} — Mashoodwear",
            "collections",
            collection_detail_body(collection),
            False,
        )

    written: list[Path] = []

    for key, filename in PAGES.items():
        if key not in bodies:
            continue
        title, active, body, filter_sheet = bodies[key]
        extra_js = PRODUCT_PAGE_JS if key == "product" else ""
        html = render_page(
            title=title,
            active=active,
            body=body,
            logo_uri=logo_uri,
            css=css,
            extra_scripts=extra_js,
            include_filter_sheet=filter_sheet,
        )
        path = CLIENT_DIR / filename
        path.write_text(html, encoding="utf-8")
        delivery_path = DELIVERY_DIR / filename
        delivery_path.write_text(html, encoding="utf-8")
        written.append(path)
        print(f"  {filename} ({path.stat().st_size / 1024:.1f} KB)")

    with zipfile.ZipFile(ZIP_OUTPUT, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in written:
            archive.write(path, f"mashoodwear-preview/{path.name}")

    zip_kb = ZIP_OUTPUT.stat().st_size / 1024
    print(f"\nWrote {len(written)} pages in {CLIENT_DIR.name}/")
    print(f"Wrote {ZIP_OUTPUT.name} ({zip_kb:.1f} KB) — send this zip to your client")


if __name__ == "__main__":
    build()
