import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";

import { PageHeader } from "@/components/layout/page-header";
import { DictionarySettingsShell } from "./_components/dictionary-settings-shell";

export default function ConsoleDictionariesIndexPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="字典设置"
        description="左侧为可维护的白名单字典表；选择后在右侧使用表格维护。区管/超管可写入；状态列支持行内开关切换（含停用条目需打开「含停用」）。"
      />
      <DictionarySettingsShell currentTable={null}>
        <Card className="border-dashed border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">请选择字典表</CardTitle>
            <CardDescription>在左侧列表中点击任意一项，即可在右侧打开对应字典的数据表。</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">右侧区域将展示标准 DataTable：序号列、业务可读列，以及「状态」列的开关控件。</p>
          </CardContent>
        </Card>
      </DictionarySettingsShell>
    </div>
  );
}
