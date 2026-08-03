/**
 * @typedef {object} HomeSettings
 * @property {boolean} ok
 * @property {string} heroEyebrow
 * @property {string} heroHeadline
 * @property {string} heroSubtitle
 * @property {string} heroImage1Url
 * @property {string} heroImage2Url
 * @property {string} brandStoryTeaser
 * @property {string} brandStoryBody
 * @property {boolean} heroVideoEnabled
 * @property {string} heroVideoUrl
 * @property {string} logoUrl
 */

/**
 * @typedef {object} CheckoutSettings
 * @property {boolean} ok
 * @property {string} instagramDirectUrl
 * @property {string} telegramUsername
 * @property {string} [bankCardNumber]
 * @property {string} [bankCardHolder]
 * @property {string} [bankName]
 */

/**
 * @typedef {object} ProductItem
 * @property {string | number} id
 * @property {string} slug
 * @property {string} name
 * @property {number} price
 * @property {string | null} imageUrl
 * @property {Array<{ size: string, color: string, stock: number, variantId?: string, price?: number }>} variants
 * @property {number} totalStock
 * @property {string} stockLabel
 */

/**
 * @typedef {object} ProductDetail
 * @property {string | number} id
 * @property {string} slug
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {string} status
 * @property {string[]} images
 * @property {Array<{ size: string, color: string, stock: number, variantId?: string, price?: number }>} variants
 * @property {number} totalStock
 * @property {string} stockLabel
 */

/**
 * @typedef {object} ProductDetailResponse
 * @property {boolean} ok
 * @property {ProductDetail} product
 */

/**
 * @typedef {object} ProductNotFoundResponse
 * @property {boolean} ok
 * @property {boolean} notFound
 */

/**
 * @typedef {object} RelatedProductsResponse
 * @property {boolean} ok
 * @property {ProductItem[]} items
 */

/**
 * @typedef {object} CategoryItem
 * @property {string | number} id
 * @property {string} name
 * @property {string} slug
 * @property {number} displayOrder
 */

/**
 * @typedef {object} CategoriesResponse
 * @property {boolean} ok
 * @property {CategoryItem[]} items
 */

/**
 * @typedef {object} SiteContextValue
 * @property {HomeSettings | null} homeSettings
 * @property {CheckoutSettings | null} checkoutSettings
 */

/**
 * @typedef {object} ProductsResponse
 * @property {boolean} ok
 * @property {ProductItem[]} items
 * @property {number} total
 * @property {number} [page]
 * @property {number} [limit]
 */

/**
 * @typedef {object} CollectionItem
 * @property {string | number} id
 * @property {string} name
 * @property {string} slug
 * @property {string} coverImageUrl
 * @property {string} description
 * @property {number} productCount
 */

/**
 * @typedef {object} CollectionsResponse
 * @property {boolean} ok
 * @property {CollectionItem[]} items
 */

/**
 * @typedef {object} CollectionDetail
 * @property {string | number} id
 * @property {string} name
 * @property {string} slug
 * @property {string} coverImageUrl
 * @property {string} description
 * @property {number} productCount
 * @property {ProductItem[]} products
 */

/**
 * @typedef {object} CollectionDetailResponse
 * @property {boolean} ok
 * @property {CollectionDetail} collection
 */

/**
 * @typedef {object} CollectionNotFoundResponse
 * @property {boolean} ok
 * @property {boolean} notFound
 */

/**
 * @typedef {object} CartLineItem
 * @property {string | number} productId
 * @property {number} quantity
 * @property {string} selectedSize
 * @property {string} selectedColor
 * @property {string} name
 * @property {number} price
 * @property {string} slug
 * @property {string | null} imageUrl
 * @property {number} [variantStock]
 * @property {string} [variantId]
 * @property {string} [lineItemId] Medusa cart line item id (required for update/remove)
 */

export {};
