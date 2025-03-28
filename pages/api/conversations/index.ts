import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // Get all conversations
        const conversations = await prisma.conversation.findMany({
          orderBy: {
            updatedAt: 'desc',
          },
        });

        return res.status(200).json(conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        return res.status(500).json({ error: 'Failed to fetch conversations' });
      }

    case 'POST':
      try {
        const { title } = req.body;

        // Create a new conversation
        const conversation = await prisma.conversation.create({
          data: {
            title: title || 'New Conversation',
          },
        });

        return res.status(201).json(conversation);
      } catch (error) {
        console.error('Error creating conversation:', error);
        return res.status(500).json({ error: 'Failed to create conversation' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}