import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const payload = await req.json();

  const { event, data } = payload;

  // Only handle create events
  if (event?.type !== 'create') {
    return Response.json({ skipped: true });
  }

  const entityName = event?.entity_name;

  if (entityName === 'Message') {
    // A new message was sent in a conversation
    const message = data;
    if (!message?.conversation_id || !message?.content) {
      return Response.json({ skipped: true, reason: 'missing fields' });
    }

    // Fetch the conversation to get creator info
    const conversations = await base44.asServiceRole.entities.Conversation.filter({ id: message.conversation_id });
    const conversation = conversations?.[0];
    if (!conversation) return Response.json({ skipped: true, reason: 'conversation not found' });

    // Get creator profile to find their email
    const profiles = await base44.asServiceRole.entities.CreatorProfile.filter({ id: conversation.creator_profile_id });
    const profile = profiles?.[0];
    if (!profile) return Response.json({ skipped: true, reason: 'profile not found' });

    // Get creator user email (created_by holds the email)
    const creatorEmail = profile.created_by;
    if (!creatorEmail) return Response.json({ skipped: true, reason: 'no creator email' });

    // Don't notify creator of their own messages
    if (message.sender_email === creatorEmail) {
      return Response.json({ skipped: true, reason: 'sender is creator' });
    }

    const senderName = message.sender_name || 'A client';
    const clientName = conversation.client_name || senderName;

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Lensly',
      to: creatorEmail,
      subject: `💬 New message from ${clientName}`,
      body: `Hi ${profile.display_name || 'there'},

You have a new message on Lensly from ${clientName}:

"${message.content}"

Log in to Lensly to reply:
https://app.lensly.co.za/Messages

— The Lensly Team`,
    });

    return Response.json({ sent: true, to: creatorEmail });
  }

  if (entityName === 'ContactRequest') {
    // A new contact/booking request was submitted
    const request = data;
    if (!request?.creator_profile_id) {
      return Response.json({ skipped: true, reason: 'missing creator_profile_id' });
    }

    // Get creator profile
    const profiles = await base44.asServiceRole.entities.CreatorProfile.filter({ id: request.creator_profile_id });
    const profile = profiles?.[0];
    if (!profile) return Response.json({ skipped: true, reason: 'profile not found' });

    const creatorEmail = profile.created_by;
    if (!creatorEmail) return Response.json({ skipped: true, reason: 'no creator email' });

    const senderName = request.sender_name || 'Someone';
    const category = request.category || 'a shoot';
    const area = request.service_area || '';
    const budget = request.budget ? `R${request.budget.toLocaleString()}` : 'Not specified';
    const date = request.preferred_date || 'Not specified';
    const messageText = request.message || '';

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Lensly',
      to: creatorEmail,
      subject: `📩 New inquiry from ${senderName}`,
      body: `Hi ${profile.display_name || 'there'},

You have a new inquiry on Lensly!

From: ${senderName} (${request.sender_email})
Category: ${category}
${area ? `Area: ${area}` : ''}
Budget: ${budget}
Preferred Date: ${date}

Message:
"${messageText}"

Log in to Lensly to respond:
https://app.lensly.co.za/Messages

— The Lensly Team`,
    });

    return Response.json({ sent: true, to: creatorEmail });
  }

  return Response.json({ skipped: true, reason: 'unhandled entity' });
});