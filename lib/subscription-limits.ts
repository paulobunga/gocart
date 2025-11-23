import { prisma } from './prisma'

export async function getStoreSubscriptionLimits(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { subscription: true }
  })

  if (!store || !store.subscription) {
    // Default to free plan limits
    return {
      maxProducts: 10,
      maxImagesPerProduct: 3,
      plan: 'FREE'
    }
  }

  return {
    maxProducts: store.subscription.maxProducts,
    maxImagesPerProduct: store.subscription.maxImagesPerProduct,
    plan: store.subscription.planType
  }
}

export async function canAddProduct(storeId: string): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getStoreSubscriptionLimits(storeId)
  
  if (limits.maxProducts === -1) {
    // Unlimited
    return { allowed: true }
  }

  const productCount = await prisma.product.count({
    where: { storeId }
  })

  if (productCount >= limits.maxProducts) {
    return {
      allowed: false,
      reason: `You have reached the maximum number of products (${limits.maxProducts}) for your ${limits.plan} plan. Please upgrade to add more products.`
    }
  }

  return { allowed: true }
}

export async function canAddImages(storeId: string, productId: string, newImageCount: number): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getStoreSubscriptionLimits(storeId)
  
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { images: true }
  })

  if (!product) {
    return { allowed: false, reason: 'Product not found' }
  }

  const currentImageCount = product.images.length
  const totalImages = currentImageCount + newImageCount

  if (totalImages > limits.maxImagesPerProduct) {
    return {
      allowed: false,
      reason: `You can only have ${limits.maxImagesPerProduct} images per product on your ${limits.plan} plan. This product currently has ${currentImageCount} images.`
    }
  }

  return { allowed: true }
}


