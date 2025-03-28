/**
 * Service for handling conversation-related API calls
 */

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  conversationId: string;
}

/**
 * Fetch all conversations
 */
export async function fetchConversations(): Promise<Conversation[]> {
  try {
    const response = await fetch('/api/conversations');
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

/**
 * Fetch a specific conversation with its messages
 */
export async function fetchConversation(id: string): Promise<Conversation | null> {
  try {
    const response = await fetch(`/api/conversations/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch conversation');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching conversation ${id}:`, error);
    return null;
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(title: string = 'New Conversation'): Promise<Conversation | null> {
  try {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
}

/**
 * Save a message to a conversation
 */
export async function saveMessage(conversationId: string, role: string, content: string): Promise<Message | null> {
  try {
    const response = await fetch(`/api/conversations/messages?conversationId=${conversationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role, content }),
    });
    if (!response.ok) {
      throw new Error('Failed to save message');
    }
    return await response.json();
  } catch (error) {
    console.error('Error saving message:', error);
    return null;
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error(`Error deleting conversation ${id}:`, error);
    return false;
  }
}