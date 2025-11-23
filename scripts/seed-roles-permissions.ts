import "dotenv/config";
import { prisma } from '../lib/prisma';

async function seedRolesAndPermissions() {
  try {
    console.log('🌱 Seeding roles and permissions...');

    // Define permissions for the ecommerce system
    const permissions = [
      // Admin permissions
      { name: 'admin.manage', resource: 'admin', action: 'manage', description: 'Full admin access' },
      { name: 'admin.users.manage', resource: 'users', action: 'manage', description: 'Manage all users' },
      { name: 'admin.users.view', resource: 'users', action: 'read', description: 'View all users' },
      { name: 'admin.stores.manage', resource: 'stores', action: 'manage', description: 'Manage all stores' },
      { name: 'admin.stores.approve', resource: 'stores', action: 'approve', description: 'Approve store applications' },
      { name: 'admin.stores.view', resource: 'stores', action: 'read', description: 'View all stores' },
      { name: 'admin.products.manage', resource: 'products', action: 'manage', description: 'Manage all products' },
      { name: 'admin.products.view', resource: 'products', action: 'read', description: 'View all products' },
      { name: 'admin.orders.manage', resource: 'orders', action: 'manage', description: 'Manage all orders' },
      { name: 'admin.orders.view', resource: 'orders', action: 'read', description: 'View all orders' },
      { name: 'admin.coupons.manage', resource: 'coupons', action: 'manage', description: 'Manage all coupons' },
      { name: 'admin.coupons.view', resource: 'coupons', action: 'read', description: 'View all coupons' },
      { name: 'admin.roles.manage', resource: 'roles', action: 'manage', description: 'Manage roles and permissions' },
      { name: 'admin.roles.view', resource: 'roles', action: 'read', description: 'View roles and permissions' },

      // Vendor permissions
      { name: 'vendor.store.manage', resource: 'store', action: 'manage', description: 'Manage own store' },
      { name: 'vendor.store.view', resource: 'store', action: 'read', description: 'View own store' },
      { name: 'vendor.products.manage', resource: 'products', action: 'manage', description: 'Manage own products' },
      { name: 'vendor.products.create', resource: 'products', action: 'create', description: 'Create products' },
      { name: 'vendor.products.update', resource: 'products', action: 'update', description: 'Update own products' },
      { name: 'vendor.products.delete', resource: 'products', action: 'delete', description: 'Delete own products' },
      { name: 'vendor.products.view', resource: 'products', action: 'read', description: 'View own products' },
      { name: 'vendor.orders.manage', resource: 'orders', action: 'manage', description: 'Manage store orders' },
      { name: 'vendor.orders.view', resource: 'orders', action: 'read', description: 'View store orders' },
      { name: 'vendor.orders.update', resource: 'orders', action: 'update', description: 'Update order status' },
      { name: 'vendor.analytics.view', resource: 'analytics', action: 'read', description: 'View store analytics' },

      // Customer permissions
      { name: 'customer.products.view', resource: 'products', action: 'read', description: 'View products' },
      { name: 'customer.orders.create', resource: 'orders', action: 'create', description: 'Place orders' },
      { name: 'customer.orders.view', resource: 'orders', action: 'read', description: 'View own orders' },
      { name: 'customer.cart.manage', resource: 'cart', action: 'manage', description: 'Manage shopping cart' },
      { name: 'customer.address.manage', resource: 'address', action: 'manage', description: 'Manage addresses' },
      { name: 'customer.ratings.create', resource: 'ratings', action: 'create', description: 'Create product ratings' },
      { name: 'customer.ratings.view', resource: 'ratings', action: 'read', description: 'View ratings' },
    ];

    // Create permissions
    console.log('📝 Creating permissions...');
    const createdPermissions = [];
    for (const perm of permissions) {
      const existing = await prisma.permission.findUnique({
        where: { name: perm.name },
      });

      if (existing) {
        console.log(`  ⏭️  Permission "${perm.name}" already exists`);
        createdPermissions.push(existing);
      } else {
        const permission = await prisma.permission.create({
          data: perm,
        });
        console.log(`  ✅ Created permission: ${perm.name}`);
        createdPermissions.push(permission);
      }
    }

    // Define roles with their permissions
    const roles = [
      {
        name: 'Admin',
        description: 'System administrator with full access',
        permissions: createdPermissions.filter((p) => p.name.startsWith('admin.')),
      },
      {
        name: 'Vendor',
        description: 'Store owner who can manage their store and products',
        permissions: createdPermissions.filter((p) => p.name.startsWith('vendor.')),
      },
      {
        name: 'Customer',
        description: 'Regular customer who can browse and purchase products',
        permissions: createdPermissions.filter((p) => p.name.startsWith('customer.')),
      },
    ];

    // Create roles
    console.log('\n👥 Creating roles...');
    for (const roleData of roles) {
      const existingRole = await prisma.role.findUnique({
        where: { name: roleData.name },
        include: { rolePermissions: true },
      });

      if (existingRole) {
        console.log(`  ⏭️  Role "${roleData.name}" already exists`);
        
        // Update permissions if needed
        const existingPermissionIds = existingRole.rolePermissions.map(
          (rp) => rp.permissionId
        );
        const newPermissionIds = roleData.permissions
          .map((p) => p.id)
          .filter((id) => !existingPermissionIds.includes(id));

        if (newPermissionIds.length > 0) {
          await prisma.rolePermission.createMany({
            data: newPermissionIds.map((permissionId) => ({
              roleId: existingRole.id,
              permissionId,
            })),
          });
          console.log(`  ✅ Updated permissions for role "${roleData.name}"`);
        }
      } else {
        const role = await prisma.role.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            rolePermissions: {
              create: roleData.permissions.map((permission) => ({
                permissionId: permission.id,
              })),
            },
          },
        });
        console.log(`  ✅ Created role: ${roleData.name} with ${roleData.permissions.length} permissions`);
      }
    }

    console.log('\n✨ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding roles and permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedRolesAndPermissions()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });

