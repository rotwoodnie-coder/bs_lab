import { SEARCH_DEBOUNCE_MS } from "./user-management.constants";
import { useUserDraft } from "./use-user-draft";
import { useUserList } from "./use-user-list";
import { useUserOrgTree } from "./use-user-org-tree";

export type {
  UserManagementCohort,
  UserManagementStatus,
} from "./user-management.constants";

export function useUserManagement() {
  const org = useUserOrgTree();
  const list = useUserList({ orgFilterId: org.selectedOrgId });
  const draft = useUserDraft({ loadList: list.loadList, selectedOrgId: org.selectedOrgId, orgTree: org.orgTree });

  return {
    SEARCH_DEBOUNCE_MS,
    ...org,
    ...list,
    ...draft,
  };
}
