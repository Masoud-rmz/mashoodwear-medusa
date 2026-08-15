/**
 * Catalog reads from Medusa Store API, shaped for existing Mashhoodwear pages.
 * purpose --- phase-2 storefront catalog over Medusa (list, filters, detail, related) ---
 */
import {
  getConfiguredRegionId,
  medusaDefaultCountry,
  medusaSdk,
} from "./client.js";
import {
  mapMedusaCategory,
  mapMedusaCollection,
  mapMedusaProductToDetail,
  mapMedusaProductToItem,
} from "./mappers.js";
import {
  applyClientSideProductFilters,
  productHasFeaturedTag,
} from "./catalogFilters.js";

export { applyClientSideProductFilters, productHasFeaturedTag } from "./catalogFilters.js";

// Expand option.parent so Size/Color titles resolve (not just option values).
// Use +field so Admin «ویژگی‌ها» scalars are added WITHOUT dropping title/handle.
const PRODUCT_FIELDS =
  "*variants,*variants.calculated_price,*variants.prices,*variants.options,*variants.options.option,*variants.inventory_quantity,*options,*options.values,*images,*categories,*tags,*collection,+weight,+length,+height,+width,+hs_code,+mid_code,+origin_country,+variants.weight,+variants.length,+variants.height,+variants.width,+variants.hs_code,+variants.mid_code,+variants.origin_country";

/** Max products fetched when size/color/price must be filtered client-side. */
const CLIENT_FILTER_FETCH_LIMIT = 500;
const CLIENT_FILTER_PAGE_SIZE = 100;

/** @type {string | null} */
let cachedRegionId = null;

/** @type {Map<string, string>} */
const categoryIdByHandle = new Map();

/** @type {Map<string, string>} */
const collectionIdByHandle = new Map();

/** Include metadata so cover_image_url from Medusa Admin is available on the storefront. */
const COLLECTION_LIST_FIELDS = "id,title,handle,*metadata";

/**
 * Resolve Iran (or configured) region id once per session.
 * @returns {Promise<string>}
 */
export async function resolveRegionId() {
  const configured = getConfiguredRegionId();
  if (configured) {
    cachedRegionId = configured;
    return configured;
  }
  if (cachedRegionId) {
    return cachedRegionId;
  }

  const { regions } = await medusaSdk.store.region.list({ limit: 50 });
  const match =
    regions.find((region) =>
      (region.countries || []).some(
        (country) =>
          String(country.iso_2 || "").toLowerCase() === medusaDefaultCountry
      )
    ) || regions[0];

  if (!match?.id) {
    throw new Error("No Medusa region found for storefront");
  }
  cachedRegionId = match.id;
  return cachedRegionId;
}

/**
 * @param {Record<string, unknown>} [query]
 * @returns {Promise<{ products: object[], count: number }>}
 */
async function listRawProducts(query = {}) {
  const regionId = await resolveRegionId();
  const response = await medusaSdk.store.product.list({
    region_id: regionId,
    fields: PRODUCT_FIELDS,
    ...query,
  });
  return {
    products: response.products || [],
    count: response.count ?? (response.products || []).length,
  };
}

/**
 * Page through Store API until CLIENT_FILTER_FETCH_LIMIT for option/price filters.
 * @param {Record<string, unknown>} baseQuery
 * @returns {Promise<object[]>}
 */
async function listRawProductsForClientFilter(baseQuery) {
  /** @type {object[]} */
  const all = [];
  let offset = 0;
  while (all.length < CLIENT_FILTER_FETCH_LIMIT) {
    const { products, count } = await listRawProducts({
      ...baseQuery,
      limit: CLIENT_FILTER_PAGE_SIZE,
      offset,
    });
    if (!products.length) {
      break;
    }
    all.push(...products);
    offset += products.length;
    if (offset >= (count ?? all.length) || products.length < CLIENT_FILTER_PAGE_SIZE) {
      break;
    }
  }
  return all.slice(0, CLIENT_FILTER_FETCH_LIMIT);
}

/**
 * @param {string} handle
 * @returns {Promise<string | null>}
 */
async function resolveCategoryIdByHandle(handle) {
  const key = String(handle || "").toLowerCase();
  if (!key) {
    return null;
  }
  if (categoryIdByHandle.has(key)) {
    return categoryIdByHandle.get(key) || null;
  }

  const { product_categories } = await medusaSdk.store.category.list({
    handle: key,
    limit: 1,
  });
  const categoryId = product_categories?.[0]?.id || null;
  if (categoryId) {
    categoryIdByHandle.set(key, categoryId);
  }
  return categoryId;
}

/**
 * @param {string} handle
 * @returns {Promise<string | null>}
 */
async function resolveCollectionIdByHandle(handle) {
  const key = String(handle || "").toLowerCase();
  if (!key) {
    return null;
  }
  if (collectionIdByHandle.has(key)) {
    return collectionIdByHandle.get(key) || null;
  }

  const { collections } = await medusaSdk.store.collection.list({
    handle: key,
    limit: 1,
    fields: COLLECTION_LIST_FIELDS,
  });
  const collectionId = collections?.[0]?.id || null;
  if (collectionId) {
    collectionIdByHandle.set(key, collectionId);
  }
  return collectionId;
}

/**
 * @param {{
 *   featured?: boolean,
 *   limit?: number,
 *   page?: number,
 *   category?: string,
 *   size?: string,
 *   color?: string,
 *   minPrice?: number,
 *   maxPrice?: number,
 *   search?: string,
 *   collection?: string,
 *   signal?: AbortSignal
 * }} [params]
 * @returns {Promise<import('../../types').ProductsResponse>}
 */
export async function getProducts(params = {}) {
  const limit = params.limit || 12;
  const page = params.page || 1;
  const offset = (page - 1) * limit;

  if (params.featured) {
    const { products } = await listRawProducts({
      limit: CLIENT_FILTER_FETCH_LIMIT,
      offset: 0,
    });
    const tagged = products.filter(productHasFeaturedTag);
    const chosen = (tagged.length > 0 ? tagged : products).slice(0, limit);
    return {
      ok: true,
      items: chosen.map(mapMedusaProductToItem),
      total: chosen.length,
      page: 1,
      limit,
    };
  }

  /** @type {Record<string, unknown>} */
  const query = {};

  if (params.search) {
    query.q = params.search;
  }

  if (params.category) {
    const categoryId = await resolveCategoryIdByHandle(params.category);
    if (categoryId) {
      query.category_id = [categoryId];
    } else {
      return { ok: true, items: [], total: 0, page, limit };
    }
  }

  if (params.collection) {
    const collectionId = await resolveCollectionIdByHandle(params.collection);
    if (collectionId) {
      query.collection_id = [collectionId];
    } else {
      return { ok: true, items: [], total: 0, page, limit };
    }
  }

  const needsClientFilter = Boolean(
    params.size ||
      params.color ||
      (params.minPrice !== undefined && params.minPrice !== null) ||
      (params.maxPrice !== undefined && params.maxPrice !== null)
  );

  if (needsClientFilter) {
    const products = await listRawProductsForClientFilter(query);
    const mapped = products.map(mapMedusaProductToItem);
    const filtered = applyClientSideProductFilters(mapped, params);
    const pageItems = filtered.slice(offset, offset + limit);
    return {
      ok: true,
      items: pageItems,
      total: filtered.length,
      page,
      limit,
    };
  }

  const { products, count } = await listRawProducts({
    ...query,
    limit,
    offset,
  });

  return {
    ok: true,
    items: products.map(mapMedusaProductToItem),
    total: count,
    page,
    limit,
  };
}

/**
 * @param {string} slug
 * @returns {Promise<import('../../types').ProductDetailResponse | import('../../types').ProductNotFoundResponse>}
 */
export async function getProductBySlug(slug) {
  const regionId = await resolveRegionId();
  const { products } = await medusaSdk.store.product.list({
    handle: slug,
    region_id: regionId,
    fields: PRODUCT_FIELDS,
    limit: 1,
  });

  const product = products?.[0];
  if (!product) {
    return { ok: false, notFound: true };
  }

  return {
    ok: true,
    product: mapMedusaProductToDetail(product),
  };
}

/**
 * @param {string} slug
 * @param {{ limit?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<import('../../types').RelatedProductsResponse | import('../../types').ProductNotFoundResponse>}
 */
export async function getRelatedProducts(slug, options = {}) {
  const limit = options.limit || 4;
  const regionId = await resolveRegionId();
  const { products: matched } = await medusaSdk.store.product.list({
    handle: slug,
    region_id: regionId,
    fields: PRODUCT_FIELDS,
    limit: 1,
  });

  const product = matched?.[0];
  if (!product) {
    return { ok: false, notFound: true };
  }

  const categoryIds = (product.categories || [])
    .map((category) => category.id)
    .filter(Boolean);

  /** @type {object[]} */
  let related = [];

  if (categoryIds.length > 0) {
    const { products } = await listRawProducts({
      category_id: categoryIds,
      limit: limit + 8,
    });
    related = products.filter((item) => item.handle !== slug);
  }

  if (related.length < limit) {
    const { products } = await listRawProducts({ limit: limit + 8 });
    const extras = products.filter(
      (item) =>
        item.handle !== slug && !related.some((existing) => existing.id === item.id)
    );
    related = [...related, ...extras];
  }

  return {
    ok: true,
    items: related.slice(0, limit).map(mapMedusaProductToItem),
  };
}

/**
 * @returns {Promise<import('../../types').CategoriesResponse>}
 */
export async function getCategories() {
  const { product_categories } = await medusaSdk.store.category.list({
    limit: 100,
  });
  const items = (product_categories || []).map((category, index) =>
    mapMedusaCategory(category, category.rank ?? index)
  );
  items.sort((left, right) => left.displayOrder - right.displayOrder);
  return { ok: true, items };
}

/**
 * @param {string} slug
 * @returns {Promise<{
 *   ok: true,
 *   category: import('../../types').CategoryItem & { products: import('../../types').ProductItem[], productCount: number }
 * } | { ok: false, notFound: true }>}
 */
export async function getCategoryBySlug(slug) {
  const { product_categories } = await medusaSdk.store.category.list({
    handle: slug,
    limit: 1,
  });
  const category = product_categories?.[0];
  if (!category) {
    return { ok: false, notFound: true };
  }

  const productsResponse = await getProducts({
    category: slug,
    limit: 48,
    page: 1,
  });

  const mapped = mapMedusaCategory(category, category.rank ?? 0);
  return {
    ok: true,
    category: {
      ...mapped,
      productCount: productsResponse.total || productsResponse.items.length,
      products: productsResponse.items,
    },
  };
}

/**
 * Collect size/color facet values from Medusa catalog (for filter UI).
 * purpose --- replace hardcoded PRODUCT_COLORS / PRODUCT_SIZES that diverge from Admin ---
 * @returns {Promise<{ ok: true, sizes: string[], colors: Array<{ name: string, slug: string }> }>}
 */
export async function getCatalogFacets() {
  const { products } = await listRawProducts({
    limit: CLIENT_FILTER_FETCH_LIMIT,
    offset: 0,
  });
  const items = (products || []).map(mapMedusaProductToItem);
  /** @type {Set<string>} */
  const sizeSet = new Set();
  /** @type {Set<string>} */
  const colorSet = new Set();

  for (const item of items) {
    for (const variant of item.variants || []) {
      if (variant.size) {
        sizeSet.add(variant.size);
      }
      if (variant.color && variant.color !== "Default") {
        colorSet.add(variant.color);
      }
    }
    for (const color of item.colors || []) {
      if (color && color !== "Default") {
        colorSet.add(color);
      }
    }
  }

  const preferredSizes = ["S", "M", "L", "XL", "2XL"];
  const sizes = [...sizeSet].sort((left, right) => {
    const leftIndex = preferredSizes.indexOf(left);
    const rightIndex = preferredSizes.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) {
      return String(left).localeCompare(String(right));
    }
    if (leftIndex === -1) {
      return 1;
    }
    if (rightIndex === -1) {
      return -1;
    }
    return leftIndex - rightIndex;
  });

  const colors = [...colorSet]
    .sort((left, right) => String(left).localeCompare(String(right)))
    .map((name) => ({
      name,
      slug: String(name).toLowerCase().replace(/\s+/g, "-"),
    }));

  return { ok: true, sizes, colors };
}

/**
 * Count products in a Medusa collection (best-effort for list cards).
 * @param {string} collectionId
 * @returns {Promise<number>}
 */
async function countProductsInCollection(collectionId) {
  const { count, products } = await listRawProducts({
    collection_id: [collectionId],
    limit: 1,
    offset: 0,
  });
  return count ?? products.length;
}

/**
 * @returns {Promise<import('../../types').CollectionsResponse>}
 */
export async function getCollections() {
  const { collections } = await medusaSdk.store.collection.list({
    limit: 100,
    fields: COLLECTION_LIST_FIELDS,
  });

  const items = await Promise.all(
    (collections || []).map(async (collection) => {
      const productCount = await countProductsInCollection(collection.id);
      return mapMedusaCollection(collection, productCount);
    })
  );

  return { ok: true, items };
}

/**
 * @param {string} slug
 * @returns {Promise<import('../../types').CollectionDetailResponse | import('../../types').CollectionNotFoundResponse>}
 */
export async function getCollectionBySlug(slug) {
  const { collections } = await medusaSdk.store.collection.list({
    handle: slug,
    limit: 1,
    fields: COLLECTION_LIST_FIELDS,
  });
  const collection = collections?.[0];
  if (!collection) {
    return { ok: false, notFound: true };
  }

  const productsResponse = await getProducts({
    collection: slug,
    limit: 48,
    page: 1,
  });

  return {
    ok: true,
    collection: {
      ...mapMedusaCollection(collection, productsResponse.items.length),
      products: productsResponse.items,
    },
  };
}
