export type TreeNodeId = string;

export type TreeNodeMeta = Record<string, unknown>;

export type TreeNode = {
  id: TreeNodeId;
  label: string;
  /**
   * Optional icon key; UI can map this to icons.
   * When omitted, UI may auto-match based on label/meta.
   */
  iconKey?: string;
  meta?: TreeNodeMeta;
  children?: TreeNode[];
};

export type TreeState = TreeNode[];

export type TreeSelection = { nodeId: TreeNodeId } | null;

