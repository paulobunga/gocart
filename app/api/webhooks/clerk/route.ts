import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  // Get the Svix headers for verification
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET to your .env file');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    try {
      // Check if any admin users exist in the system
      const adminRole = await prisma.role.findUnique({
        where: { name: 'Admin' },
      });
      
      let isFirstUser = false;
      if (adminRole) {
        const adminUserCount = await prisma.userRole.count({
          where: { roleId: adminRole.id },
        });
        isFirstUser = adminUserCount === 0;
      } else {
        // If Admin role doesn't exist, check if any users exist at all
        const userCount = await prisma.user.count();
        isFirstUser = userCount === 0;
      }

      // Get the appropriate role (Admin for first user, Customer for others)
      const roleName = isFirstUser ? 'Admin' : 'Customer';
      const role = await prisma.role.findUnique({
        where: { name: roleName },
      });

      if (!role) {
        console.error(`${roleName} role not found. Please run the seed script.`);
        return new Response(`${roleName} role not found`, { status: 500 });
      }

      // Create user in database
      const user = await prisma.user.create({
        data: {
          id: id,
          email: email_addresses[0]?.email_address || '',
          name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
          image: image_url || '',
          cart: {},
        },
      });

      // Assign role to the new user
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      console.log(`User created and assigned ${roleName} role: ${user.id}`);
    } catch (error: any) {
      console.error('Error creating user:', error);
      // If user already exists, try to update
      if (error.code === 'P2002') {
        try {
          await prisma.user.update({
            where: { id },
            data: {
              email: email_addresses[0]?.email_address || '',
              name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
              image: image_url || '',
            },
          });
        } catch (updateError) {
          console.error('Error updating user:', updateError);
        }
      }
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    try {
      await prisma.user.update({
        where: { id },
        data: {
          email: email_addresses[0]?.email_address || '',
          name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
          image: image_url || '',
        },
      });

      console.log(`User updated: ${id}`);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      // Delete user and related data (cascade will handle relations)
      await prisma.user.delete({
        where: { id },
      });

      console.log(`User deleted: ${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  return new Response('', { status: 200 });
}

