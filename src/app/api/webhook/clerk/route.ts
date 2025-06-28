import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import connectToDB from '~/common/lib/connect-to-db';
import devLogger from '~/common/utils/dev-logger';
import { User } from '~/common/models/schema';



export async function POST(req: Request) {
  await connectToDB();
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    devLogger.error('CLERK_WEBHOOK_SECRET is missing from environment variables')
    return NextResponse.json(
      { error: 'CLERK_WEBHOOK_SECRET missing' },
      { status: 500 }
    )
  }

  // Clerk uses svix headers for webhook verification
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id'); // Clerk uses 'svix-id' for webhook ID
  const svixTimestamp = headerPayload.get('svix-timestamp'); // Clerk uses 'svix-timestamp' for webhook timestamp
  const svixSignature = headerPayload.get('svix-signature'); // Clerk uses 'svix-signature' for webhook signature


  // Check if all required svix headers are present
  if (!svixId || !svixTimestamp || !svixSignature) {
    devLogger.error('Missing required svix headers')
    return NextResponse.json({ error: 'Svix headers missing' }, { status: 400 })
  }


  let payload
  try {
    payload = await req.json() // Parse the JSON body of the request
  } catch (err) {
    devLogger.error('Failed to parse request body:', err)
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const body = JSON.stringify(payload)
  const wh = new Webhook(WEBHOOK_SECRET) // Initialize the Webhook instance with the secret
  let evt: WebhookEvent // verified payload of the webhook event

  try {
    evt = wh.verify(body, { // Verify the payload using the svix headers
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch (err) {
    devLogger.error('Webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  devLogger.log(`Received webhook event: ${evt.type}`)

  switch (evt.type) { // Handle different event types
    case 'user.created':
    case 'user.updated':
      const { id, email_addresses, first_name, last_name, image_url } = evt.data

      if (!id) {
        devLogger.error('User ID missing in webhook data')
        return NextResponse.json({ error: 'User ID missing' }, { status: 400 })
      }

      if (!email_addresses || email_addresses.length === 0) {
        devLogger.error('No email addresses found for user:', id)
        return NextResponse.json({ error: 'No email found' }, { status: 400 })
      }

      try {
        const updatedUser = await User.findOneAndUpdate(
          { clerkId: id },
          {
            clerkId: id,
            email: email_addresses[0].email_address,
            name: `${first_name || ''} ${last_name || ''}`.trim() || 'Anonymous',
            profileImageUrl: image_url || null,
            updatedAt: new Date(),
          },
          {
            upsert: true,
            new: true,
            runValidators: true
          }
        )

        devLogger.log(`User ${evt.type} successful:`, {
          clerkId: id,
          email: email_addresses[0].email_address,
          name: updatedUser.name
        })
      } catch (err) {
        devLogger.error(`Database error during ${evt.type}:`, err)
        return NextResponse.json(
          { error: 'Database operation failed' },
          { status: 500 }
        )
      }
      break

    case 'user.deleted':
      const { id: deletedId } = evt.data

      if (!deletedId) {
        devLogger.error('User ID missing in deletion webhook data')
        return NextResponse.json({ error: 'User ID missing' }, { status: 400 })
      }

      try {
        const deleteResult = await User.deleteOne({ clerkId: deletedId })

        if (deleteResult.deletedCount > 0) {
          devLogger.log(`User deleted successfully: ${deletedId}`)
        } else {
          devLogger.warn(`User not found for deletion: ${deletedId}`)
        }
      } catch (err) {
        devLogger.error('Failed to delete user:', err)
        return NextResponse.json(
          { error: 'Failed to delete user' },
          { status: 500 }
        )
      }
      break

    default:
      devLogger.log(`Unhandled webhook event type: ${evt.type}`)
      break
  }

  return NextResponse.json({ success: true }, { status: 200 })
}



export const dynamic = 'force-dynamic' // Ensure this route is always dynamic to handle webhooks correctly
