import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();

    if (action === 'deactivate') {
      // Mark account as deactivated
      await base44.auth.updateMe({
        account_status: 'deactivated',
        deactivated_at: new Date().toISOString()
      });

      // Hide creator profile if exists
      const profiles = await base44.asServiceRole.entities.CreatorProfile.filter({ 
        created_by: user.email 
      });
      if (profiles.length > 0) {
        await base44.asServiceRole.entities.CreatorProfile.update(profiles[0].id, {
          is_published: false,
          is_hidden: true
        });
      }

      return Response.json({ 
        success: true, 
        message: 'Account deactivated successfully' 
      });
    }

    if (action === 'delete') {
      // Mark account for deletion
      await base44.auth.updateMe({
        account_status: 'deleted',
        deleted_at: new Date().toISOString()
      });

      // Delete creator profile if exists
      const profiles = await base44.asServiceRole.entities.CreatorProfile.filter({ 
        created_by: user.email 
      });
      for (const profile of profiles) {
        await base44.asServiceRole.entities.CreatorProfile.delete(profile.id);
      }

      // Delete conversations
      const convosAsCreator = await base44.asServiceRole.entities.Conversation.filter({
        creator_profile_id: { $in: profiles.map(p => p.id) }
      });
      const convosAsClient = await base44.asServiceRole.entities.Conversation.filter({
        client_email: user.email
      });
      for (const convo of [...convosAsCreator, ...convosAsClient]) {
        await base44.asServiceRole.entities.Conversation.delete(convo.id);
      }

      // Delete messages
      const messages = await base44.asServiceRole.entities.Message.filter({
        sender_email: user.email
      });
      for (const msg of messages) {
        await base44.asServiceRole.entities.Message.delete(msg.id);
      }

      // Delete contact requests
      const requestsSent = await base44.asServiceRole.entities.ContactRequest.filter({
        sender_email: user.email
      });
      const requestsReceived = await base44.asServiceRole.entities.ContactRequest.filter({
        creator_profile_id: { $in: profiles.map(p => p.id) }
      });
      for (const req of [...requestsSent, ...requestsReceived]) {
        await base44.asServiceRole.entities.ContactRequest.delete(req.id);
      }

      // Delete favourites
      const favs = await base44.asServiceRole.entities.Favourite.filter({
        created_by: user.email
      });
      for (const fav of favs) {
        await base44.asServiceRole.entities.Favourite.delete(fav.id);
      }

      // Delete reviews
      const reviews = await base44.asServiceRole.entities.Review.filter({
        client_email: user.email
      });
      for (const review of reviews) {
        await base44.asServiceRole.entities.Review.delete(review.id);
      }

      // Delete notifications
      const notifications = await base44.asServiceRole.entities.Notification.filter({
        recipient_email: user.email
      });
      for (const notif of notifications) {
        await base44.asServiceRole.entities.Notification.delete(notif.id);
      }

      return Response.json({ 
        success: true, 
        message: 'Account deleted permanently' 
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});