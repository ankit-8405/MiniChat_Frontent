import { useState, useCallback } from 'react';
import { messageService } from '../services/authService';

export const usePagination = (channelId) => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return [];

    setLoading(true);
    try {
      const data = await messageService.getMessages(channelId, page + 1);
      setPage(page + 1);
      setHasMore(page + 1 < data.totalPages);
      return data.messages;
    } catch (error) {
      console.error('Failed to load more messages:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [channelId, page, hasMore, loading]);

  const reset = useCallback(() => {
    setPage(1);
    setHasMore(true);
  }, []);

  return { loadMore, hasMore, loading, reset };
};
