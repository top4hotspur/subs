"use client";

import { StaffRoleDefinition } from "@/lib/staff/staff-role-settings";
import { dangerButtonClass, outlineButtonClass, primaryButtonClass, secondaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";

type Props = {
  roles: StaffRoleDefinition[];
  onChange: (roles: StaffRoleDefinition[]) => void;
  onSeed: () => void;
  onReset: () => void;
};

function id(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `role_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function StaffRoleEditor({ roles, onChange, onSeed, onReset }: Props) {
  function addRole() {
    const now = new Date().toISOString();
    onChange([
      ...roles,
      { id: id(), label: "New role", active: true, createdAtIso: now, updatedAtIso: now },
    ]);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Staff roles</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${secondaryButtonClass} ${smallButtonClass}`} onClick={onSeed}>Seed roles</button>
          <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={onReset}>Reset roles</button>
          <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={addRole}>Add role</button>
        </div>
      </div>

      {roles.length === 0 ? (
        <p className="text-sm text-slate-600">No local roles yet.</p>
      ) : (
        <div className="space-y-2">
          {roles.map((role) => (
            <div key={role.id} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
              <input
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={role.label}
                onChange={(e) => onChange(roles.map((r) => r.id === role.id ? { ...r, label: e.target.value, updatedAtIso: new Date().toISOString() } : r))}
              />
              <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={role.active}
                  onChange={(e) => onChange(roles.map((r) => r.id === role.id ? { ...r, active: e.target.checked, updatedAtIso: new Date().toISOString() } : r))}
                />
                Active
              </label>
              <button
                type="button"
                className={`${outlineButtonClass} ${smallButtonClass}`}
                onClick={() => onChange(roles.map((r) => r.id === role.id ? { ...r, active: !r.active, updatedAtIso: new Date().toISOString() } : r))}
              >
                {role.active ? "Deactivate" : "Activate"}
              </button>
              <button
                type="button"
                className={`${dangerButtonClass} ${smallButtonClass}`}
                onClick={() => {
                  if (!window.confirm(`Delete role \"${role.label}\"?`)) return;
                  onChange(roles.filter((r) => r.id !== role.id));
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500">Local/mock role definitions per industry. No backend role permissions yet.</p>
    </section>
  );
}
