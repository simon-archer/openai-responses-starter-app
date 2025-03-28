import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { conversationId } = req.query;

  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  switch (method) {
    case 'GET':
      try {
        // Get all messages for a conversation
        const messages = await prisma.message.findMany({
          where: { conversationId },
          orderBy: {
            createdAt: 'asc',
          },
        });

        return res.status(200).json(messages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({ error: 'Failed to fetch messages' });
      }

    case 'POST':
      try {
        const { role, content } = req.body;

        if (!role || !content) {
          return res.status(400).json({ error: 'Role and content are required' });
        }

        // Create a new message
        const message = await prisma.message.create({
          data: {
            role,
            content: typeof content === 'string' ? content : JSON.stringify(content),
            conversationId,
          },
        });

        // Update the conversation's updatedAt timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        return res.status(201).json(message);
      } catch (error) {
        console.error('Error creating message:', error);
        return res.status(500).json({ error: 'Failed to create message' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}