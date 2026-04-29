"use client";

import * as React from "react";

import { buildMaterialsApiActor } from "@/lib/materials-api-actor";
import type { CoreApiActor } from "@/lib/core-api-shared";
import { useSessionActor } from "@/hooks/use-session-actor";
import {
  createAdminDictRow,
  deleteAdminDictRow,
  fetchAdminDictScreen,
  patchAdminDictRow,
  type AdminDictScreen,
} from "@/lib/v2/v2-admin-dict-api";
import {
  createBusinessDictRow,
  deleteBusinessDictRow,
  fetchBusinessDictScreen,
  patchBusinessDictRow,
  type BusinessDictScreen,
} from "@/lib/v2/v2-business-dict-api";

import { ADMIN_DICT_TABLE_OPTIONS } from "../admin-dict-tables";
import type { FkDisplayMaps } from "../_lib/dictionary-display-zh";

type DictKind = "admin" | "business";

type DictScreen = AdminDictScreen | BusinessDictScreen;

export function useGenericDictionaryPage(tableName: string, kind: DictKind) {
  const session = useSessionActor();
  const { role, orgId, hydrated } = session;
  const actor = React.useMemo(
    () => buildMaterialsApiActor(role, orgId, kind === "admin" ? "admin-dict" : "business-dict") as CoreApiActor,
    [kind, role, orgId],
  );

  const allowed = React.useMemo(
    () => new Set(ADMIN_DICT_TABLE_OPTIONS.map((o) => o.table)),
    [],
  );
  const tableOk = allowed.has(tableName);

  const [includeInactive, setIncludeInactive] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [screen, setScreen] = React.useState<DictScreen | null>(null);
  const [fkDisplayMaps, setFkDisplayMaps] = React.useState<FkDisplayMaps>({});
  const [patchingPk, setPatchingPk] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!tableOk || !hydrated) return;
    setLoading(true);
    setError(null);
    try {
      const data =
        kind === "admin"
          ? await fetchAdminDictScreen(actor, tableName, { includeInactive })
          : await fetchBusinessDictScreen(actor, tableName, { includeInactive });
      setScreen(data);
      if (tableName === "data_school_grade") {
        try {
          if (kind !== "admin") throw new Error("fk display only for admin dict");
          const lvl = await fetchAdminDictScreen(actor, "data_school_level", { includeInactive: true });
          const m: Record<string, string> = {};
          for (const r of lvl.rows) {
            const row = r as Record<string, unknown>;
            const id = String(row.level_id ?? "").trim();
            const nm = String(row.level_name ?? "").trim();
            if (id) m[id] = nm || id;
          }
          setFkDisplayMaps({ school_level_id: m });
        } catch {
          setFkDisplayMaps({});
        }
      } else {
        setFkDisplayMaps({});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
      setScreen(null);
      setFkDisplayMaps({});
    } finally {
      setLoading(false);
    }
  }, [actor, includeInactive, kind, hydrated, tableName, tableOk]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const refresh = React.useCallback(() => void load(), [load]);

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editorMode, setEditorMode] = React.useState<"create" | "edit">("create");
  const [draft, setDraft] = React.useState<Record<string, string>>({});

  const openCreate = React.useCallback(() => {
    if (!screen) return;
    const next: Record<string, string> = {};
    for (const c of screen.meta.columns) {
      if (c.columnKey === "PRI") next[c.name] = "";
      else next[c.name] = "";
    }
    setDraft(next);
    setEditorMode("create");
    setEditorOpen(true);
  }, [screen]);

  const openEdit = React.useCallback((row: Record<string, unknown>) => {
    if (!screen) return;
    const next: Record<string, string> = {};
    for (const c of screen.meta.columns) {
      const v = row[c.name];
      next[c.name] = v === null || v === undefined ? "" : String(v);
    }
    setDraft(next);
    setEditorMode("edit");
    setEditorOpen(true);
  }, [screen]);

  const save = React.useCallback(async () => {
    if (!screen) return;
    const pk = screen.meta.primaryKey;
    const body: Record<string, unknown> = {};
    const numericTypes = new Set([
      "int",
      "tinyint",
      "smallint",
      "mediumint",
      "bigint",
      "float",
      "double",
      "decimal",
    ]);
    for (const [k, v] of Object.entries(draft)) {
      const col = screen.meta.columns.find((c) => c.name === k);
      if (!col) continue;
      if (v === "") {
        if (editorMode === "create" && col.columnKey === "PRI") continue;
        if (col.nullable) body[k] = null;
        else continue;
      } else if (numericTypes.has(col.dataType)) {
        body[k] = Number(v);
      } else {
        body[k] = v;
      }
    }
    setLoading(true);
    setError(null);
    try {
      if (editorMode === "create") {
        if (kind === "admin") await createAdminDictRow(actor, tableName, body);
        else await createBusinessDictRow(actor, tableName, body);
      } else {
        const id = String(draft[pk] ?? "");
        if (kind === "admin") await patchAdminDictRow(actor, tableName, id, body);
        else await patchBusinessDictRow(actor, tableName, id, body);
      }
      setEditorOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setLoading(false);
    }
  }, [actor, draft, editorMode, kind, load, screen, tableName]);

  const remove = React.useCallback(
    async (pkValue: string) => {
      if (!screen) return;
      setLoading(true);
      setError(null);
      try {
        if (kind === "admin") await deleteAdminDictRow(actor, tableName, pkValue);
        else await deleteBusinessDictRow(actor, tableName, pkValue);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "删除失败");
      } finally {
        setLoading(false);
      }
    },
    [actor, kind, load, screen, tableName],
  );

  const patchRowPartial = React.useCallback(
    async (pkValue: string, patch: Record<string, unknown>) => {
      if (!screen) return;
      setError(null);
      setPatchingPk(pkValue);
      try {
        if (kind === "admin") await patchAdminDictRow(actor, tableName, pkValue, patch);
        else await patchBusinessDictRow(actor, tableName, pkValue, patch);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "更新失败");
      } finally {
        setPatchingPk(null);
      }
    },
    [actor, kind, load, screen, tableName],
  );

  const patchStatus = React.useCallback(
    async (pkValue: string, enabled: boolean) => {
      await patchRowPartial(pkValue, { status: enabled ? "y" : "n" });
    },
    [patchRowPartial],
  );

  return {
    hydrated,
    tableOk,
    actor,
    includeInactive,
    setIncludeInactive,
    loading,
    error,
    screen,
    refresh,
    editorOpen,
    setEditorOpen,
    editorMode,
    draft,
    setDraft,
    openCreate,
    openEdit,
    save,
    remove,
    fkDisplayMaps,
    patchingPk,
    patchRowPartial,
    patchStatus,
  };
}
