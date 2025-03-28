import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid conversation ID' });
  }

  switch (method) {
    case 'GET':
      try {
        // Get a specific conversation with its messages
        const conversation = await prisma.conversation.findUnique({
          where: { id },
          include: {
            messages: {
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        });

        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }

        return res.status(200).json(conversation);
      } catch (error) {
        console.error('Error fetching conversation:', error);
        return res.status(500).json({ error: 'Failed to fetch conversation' });
      }

    case 'PUT':
      try {
        const { title } = req.body;

        // Update conversation title
        const updatedConversation = await prisma.conversation.update({
          where: { id },
          data: { title },
        });

        return res.status(200).json(updatedConversation);
      } catch (error) {
        console.error('Error updating conversation:', error);
        return res.status(500).json({ error: 'Failed to update conversation' });
      }

    case 'DELETE':
      try {
        // Delete conversation and all its messages (cascade delete)
        await prisma.conversation.delete({
          where: { id },
        });

        return res.status(204).end();
      } catch (error) {
        console.error('Error deleting conversation:', error);
        return res.status(500).json({ error: 'Failed to delete conversation' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}