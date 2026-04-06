import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/constants/query-keys';

import { getMenuSuggestions } from '../services/menu-management.service';
import { useMenuDraftStore } from '../stores/menu-draft.store';

export function useMenuSuggestions() {
  const setSuggestions = useMenuDraftStore((s) => s.setSuggestions);

  return useQuery({
    queryKey: queryKeys.menu.suggestions,
    queryFn: async () => {
      const suggestions = await getMenuSuggestions();
      setSuggestions(suggestions);
      return suggestions;
    },
  });
}
