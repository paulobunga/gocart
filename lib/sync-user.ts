import { prisma } from './prisma'

/**
 * Syncs a Clerk user to the local database
 * This is a fallback for when webhooks aren't available (e.g., local development)
 */
export async function syncUserToDatabase(
  userId: string,
  email: string,
  firstName?: string | null,
  lastName?: string | null,
  imageUrl?: string | null
) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (existingUser) {
      // Update user if data has changed
      const name = `${firstName || ''} ${lastName || ''}`.trim() || 'User'
      if (
        existingUser.email !== email ||
        existingUser.name !== name ||
        existingUser.image !== (imageUrl || '')
      ) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            email,
            name,
            image: imageUrl || '',
          },
        })
      }
      return existingUser
    }

    // Check if any admin users exist in the system
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Admin' },
    })
    
    let isFirstUser = false
    if (adminRole) {
      const adminUserCount = await prisma.userRole.count({
        where: { roleId: adminRole.id },
      })
      isFirstUser = adminUserCount === 0
    } else {
      // If Admin role doesn't exist, check if any users exist at all
      const userCount = await prisma.user.count()
      isFirstUser = userCount === 0
    }

    // Get the appropriate role (Admin for first user, Customer for others)
    const roleName = isFirstUser ? 'Admin' : 'Customer'
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    })

    if (!role) {
      console.error(`${roleName} role not found. Please run the seed script.`)
      throw new Error(`${roleName} role not found`)
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email || '',
        name: `${firstName || ''} ${lastName || ''}`.trim() || 'User',
        image: imageUrl || '',
        cart: {},
      },
    })

    // Assign role to the new user
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    })

    console.log(`User synced to database and assigned ${roleName} role: ${user.id}`)
    return user
  } catch (error: any) {
    console.error('Error syncing user to database:', error)
    // If user already exists (race condition), return existing user
    if (error.code === 'P2002') {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      })
      if (existingUser) {
        return existingUser
      }
    }
    throw error
  }
}

