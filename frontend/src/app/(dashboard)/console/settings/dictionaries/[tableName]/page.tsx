import Link from "next/link";

import { Button } from "@bs-lab/ui";

import { ADMIN_DICT_TABLE_OPTIONS } from "../admin-dict-tables";
import { DictionarySettingsShell } from "../_components/dictionary-settings-shell";
import { GenericDictionaryPage } from "../_components/GenericDictionaryPage";

const ALL_DICT_OPTIONS = ADMIN_DICT_TABLE_OPTIONS;

export default async function ConsoleAdminDictTablePage(props: { params: Promise<{ tableName: string }> }) {
  const { tableName } = await props.params;
  const decoded = decodeURIComponent(tableName);
  const meta = ALL_DICT_OPTIONS.find((o) => o.table === decoded);

  if (!meta) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">未识别的字典表。</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/console/settings/dictionaries">返回字典索引</Link>
        </Button>
      </div>
    );
  }

  const kind: "admin" | "business" = ADMIN_DICT_TABLE_OPTIONS.some((o) => o.table === meta.table) ? "admin" : "business";

  return (
    <DictionarySettingsShell currentTable={meta.table}>
      <GenericDictionaryPage
        tableName={meta.table}
        title={meta.title}
        dictKind={kind}
        layout="page"
        allowMutation={meta.allowMutation !== false && meta.readOnly !== true}
        readOnly={meta.readOnly}
      />
    </DictionarySettingsShell>
  );
}
