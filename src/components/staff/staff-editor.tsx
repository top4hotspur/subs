"use client";

import { SiteServiceItem } from "@/lib/sites/site-settings-types";
import { StaffRoleDefinition } from "@/lib/staff/staff-role-settings";
import {
  StaffAvailabilityMode,
  StaffMember,
  StaffRoleType,
} from "@/lib/staff/staff-types";
import {
  dangerButtonClass,
  outlineButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/ui/button-styles";
import { staffAvailabilityModeLabel, staffRoleLabel } from "@/lib/ui/display-labels";

type StaffEditorProps = {
  staff: StaffMember[];
  services: SiteServiceItem[];
  roleDefinitions?: StaffRoleDefinition[];
  onChange: (staff: StaffMember[]) => void;
};

const allRoles = Object.values(StaffRoleType);
const allAvailabilityModes = Object.values(StaffAvailabilityMode);

function emptyStaff(): StaffMember {
  const now = new Date().toISOString();
  return {
    id: `staff-${Date.now()}`,
    displayName: "New team member",
    role: StaffRoleType.GENERAL_STAFF,
    roleLabel: "General Staff",
    email: "",
    phone: "",
    bio: "",
    serviceIds: [],
    active: true,
    customerSelectable: false,
    availabilityMode: StaffAvailabilityMode.FLEXIBLE,
    notes: "",
    createdAtIso: now,
    updatedAtIso: now,
  };
}

export function StaffEditor({ staff, services, roleDefinitions, onChange }: StaffEditorProps) {
  const activeRoleDefs = (roleDefinitions ?? []).filter((role) => role.active);

  function updateMember(id: string, patch: Partial<StaffMember>) {
    onChange(
      staff.map((member) =>
        member.id === id
          ? { ...member, ...patch, updatedAtIso: new Date().toISOString() }
          : member,
      ),
    );
  }

  function addMember() {
    onChange([...staff, emptyStaff()]);
  }

  function duplicateMember(member: StaffMember) {
    const now = new Date().toISOString();
    onChange([
      ...staff,
      {
        ...member,
        id: `staff-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        displayName: `${member.displayName} (Copy)`,
        createdAtIso: now,
        updatedAtIso: now,
      },
    ]);
  }

  function removeMember(id: string) {
    const target = staff.find((member) => member.id === id);
    if (!target) {
      return;
    }
    if (!window.confirm(`Delete "${target.displayName}"?`)) {
      return;
    }
    onChange(staff.filter((member) => member.id !== id));
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Staff / team members</h2>
        <button type="button" className={primaryButtonClass} onClick={addMember}>
          Add team member
        </button>
      </div>

      {staff.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          No staff yet. Add your first team member.
        </p>
      ) : null}

      <div className="space-y-4">
        {staff.map((member) => (
          <article key={member.id} className="rounded-xl border border-slate-200 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Display name
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={member.displayName}
                  onChange={(event) => updateMember(member.id, { displayName: event.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Role
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={member.roleLabel ?? member.role}
                  onChange={(event) => {
                    const selected = event.target.value;
                    const platformRole = allRoles.find((role) => role === selected as StaffRoleType) ?? StaffRoleType.GENERAL_STAFF;
                    updateMember(member.id, { role: platformRole, roleLabel: selected });
                  }}
                >
                  {activeRoleDefs.map((role) => (
                    <option key={role.id} value={role.label}>{role.label}</option>
                  ))}
                  {allRoles.map((role) => (
                    <option key={role} value={role}>{staffRoleLabel(role)}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Custom role label (optional)
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={member.roleLabel ?? ""}
                  onChange={(event) => updateMember(member.id, { roleLabel: event.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Email
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={member.email ?? ""}
                  onChange={(event) => updateMember(member.id, { email: event.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Phone
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={member.phone ?? ""}
                  onChange={(event) => updateMember(member.id, { phone: event.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Availability
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={member.availabilityMode}
                  onChange={(event) =>
                    updateMember(member.id, {
                      availabilityMode: event.target.value as StaffAvailabilityMode,
                    })
                  }
                >
                  {allAvailabilityModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {staffAvailabilityModeLabel(mode)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Bio
                <textarea
                  className="mt-1 min-h-16 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={member.bio ?? ""}
                  onChange={(event) => updateMember(member.id, { bio: event.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Notes
                <textarea
                  className="mt-1 min-h-16 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={member.notes ?? ""}
                  onChange={(event) => updateMember(member.id, { notes: event.target.value })}
                />
              </label>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={member.active}
                  onChange={(event) => updateMember(member.id, { active: event.target.checked })}
                />
                Active
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={member.customerSelectable}
                  onChange={(event) =>
                    updateMember(member.id, { customerSelectable: event.target.checked })
                  }
                />
                Customer selectable
              </label>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Service links
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {services.map((service) => {
                  const isLinked = member.serviceIds.includes(service.id);
                  return (
                    <label key={service.id} className="inline-flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={isLinked}
                        onChange={(event) => {
                          const nextIds = event.target.checked
                            ? [...member.serviceIds, service.id]
                            : member.serviceIds.filter((id) => id !== service.id);
                          updateMember(member.id, { serviceIds: nextIds });
                        }}
                      />
                      {service.name}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => duplicateMember(member)}>
                Duplicate
              </button>
              <button
                type="button"
                className={outlineButtonClass}
                onClick={() => updateMember(member.id, { active: !member.active })}
              >
                {member.active ? "Deactivate" : "Reactivate"}
              </button>
              <button type="button" className={dangerButtonClass} onClick={() => removeMember(member.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
