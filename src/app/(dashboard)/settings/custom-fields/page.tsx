"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  getCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
} from "@/actions/custom-fields";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  ListFilter,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  Link2,
  Mail,
  Phone,
  X,
  Users,
  ContactRound,
} from "lucide-react";

const FIELD_TYPE_OPTIONS = [
  { value: "TEXT", label: "Text", icon: Type },
  { value: "NUMBER", label: "Number", icon: Hash },
  { value: "DATE", label: "Date", icon: Calendar },
  { value: "BOOLEAN", label: "Yes / No", icon: ToggleLeft },
  { value: "SELECT", label: "Single Select", icon: List },
  { value: "MULTI_SELECT", label: "Multi Select", icon: ListFilter },
  { value: "URL", label: "URL", icon: Link2 },
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "PHONE", label: "Phone", icon: Phone },
] as const;

type FieldType = (typeof FIELD_TYPE_OPTIONS)[number]["value"];
type EntityType = "MEMBER" | "CONTACT";

interface CustomField {
  id: string;
  name: string;
  key: string;
  type: FieldType;
  entity: EntityType;
  description: string | null;
  required: boolean;
  options: string[];
  sortOrder: number;
  isActive: boolean;
}

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<FieldType>("TEXT");
  const [entity, setEntity] = useState<EntityType>("MEMBER");
  const [description, setDescription] = useState("");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");

  useEffect(() => {
    loadFields();
  }, []);

  async function loadFields() {
    setLoading(true);
    const data = await getCustomFields();
    setFields(data as CustomField[]);
    setLoading(false);
  }

  function openCreateDialog() {
    setEditingField(null);
    setName("");
    setType("TEXT");
    setEntity("MEMBER");
    setDescription("");
    setRequired(false);
    setOptions([]);
    setNewOption("");
    setDialogOpen(true);
  }

  function openEditDialog(field: CustomField) {
    setEditingField(field);
    setName(field.name);
    setType(field.type);
    setEntity(field.entity);
    setDescription(field.description || "");
    setRequired(field.required);
    setOptions(field.options);
    setNewOption("");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    if (editingField) {
      await updateCustomField(editingField.id, {
        name: name.trim(),
        description: description.trim(),
        required,
        options,
      });
    } else {
      await createCustomField({
        name: name.trim(),
        type,
        entity,
        description: description.trim() || undefined,
        required,
        options: (type === "SELECT" || type === "MULTI_SELECT") ? options : undefined,
      });
    }

    setSaving(false);
    setDialogOpen(false);
    await loadFields();
  }

  async function handleDelete(fieldId: string) {
    await deleteCustomField(fieldId);
    setDeleteConfirmId(null);
    await loadFields();
  }

  async function handleToggleActive(field: CustomField) {
    await updateCustomField(field.id, { isActive: !field.isActive });
    await loadFields();
  }

  function addOption() {
    const val = newOption.trim();
    if (val && !options.includes(val)) {
      setOptions([...options, val]);
      setNewOption("");
    }
  }

  function removeOption(index: number) {
    setOptions(options.filter((_, i) => i !== index));
  }

  const memberFields = fields.filter((f) => f.entity === "MEMBER");
  const contactFields = fields.filter((f) => f.entity === "CONTACT");
  const showOptions = type === "SELECT" || type === "MULTI_SELECT";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Fields</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Define custom fields to collect additional information from your members
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : fields.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ListFilter className="mx-auto mb-4 h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="mb-2 text-lg font-medium">No custom fields yet</p>
            <p className="mb-6 text-sm text-[var(--muted-foreground)]">
              Custom fields let you collect organization-specific data like committees,
              volunteer roles, certifications, or any other info unique to your members.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Create Your First Field
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {memberFields.length > 0 && (
            <FieldSection
              title="Member Fields"
              icon={<Users className="h-5 w-5" />}
              description="Fields attached to member/organization records"
              fields={memberFields}
              onEdit={openEditDialog}
              onDelete={setDeleteConfirmId}
              onToggleActive={handleToggleActive}
            />
          )}
          {contactFields.length > 0 && (
            <FieldSection
              title="Contact Fields"
              icon={<ContactRound className="h-5 w-5" />}
              description="Fields attached to individual contact records"
              fields={contactFields}
              onEdit={openEditDialog}
              onDelete={setDeleteConfirmId}
              onToggleActive={handleToggleActive}
            />
          )}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogHeader>
          <DialogTitle>{editingField ? "Edit Field" : "New Custom Field"}</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field-name">Field Name</Label>
            <Input
              id="field-name"
              placeholder="e.g. Street Captain, Certification Level"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {!editingField && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field-type">Field Type</Label>
                <Select
                  id="field-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as FieldType)}
                >
                  {FIELD_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="field-entity">Applies To</Label>
                <Select
                  id="field-entity"
                  value={entity}
                  onChange={(e) => setEntity(e.target.value as EntityType)}
                >
                  <option value="MEMBER">Members</option>
                  <option value="CONTACT">Contacts</option>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="field-desc">Description (optional)</Label>
            <Input
              id="field-desc"
              placeholder="Help text shown to users"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="field-required"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--input)]"
            />
            <Label htmlFor="field-required" className="text-sm font-normal">
              Required field
            </Label>
          </div>

          {/* Options for SELECT / MULTI_SELECT */}
          {showOptions && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-1.5">
                {options.map((opt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm"
                  >
                    <span className="flex-1">{opt}</span>
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="text-[var(--muted-foreground)] hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add an option..."
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                />
                <Button variant="outline" size="sm" onClick={addOption} disabled={!newOption.trim()}>
                  Add
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? <Spinner className="h-4 w-4" /> : editingField ? "Save Changes" : "Create Field"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <DialogHeader>
          <DialogTitle>Delete Custom Field</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-[var(--muted-foreground)]">
            This will permanently delete this field and all its stored values across all members.
            This action cannot be undone.
          </p>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
            Cancel
          </Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          >
            Delete Field
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

// ─── Field Section Component ───────────────────────────

function FieldSection({
  title,
  icon,
  description,
  fields,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  fields: CustomField[];
  onEdit: (field: CustomField) => void;
  onDelete: (id: string) => void;
  onToggleActive: (field: CustomField) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {fields.map((field) => {
            const typeInfo = FIELD_TYPE_OPTIONS.find((t) => t.value === field.type);
            const Icon = typeInfo?.icon || Type;

            return (
              <div
                key={field.id}
                className={`flex items-center gap-3 rounded-md border border-[var(--border)] px-3 py-2.5 ${
                  !field.isActive ? "opacity-50" : ""
                }`}
              >
                <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-[var(--muted-foreground)]" />

                <div className="flex items-center gap-2 rounded-md bg-[var(--muted)] p-1.5">
                  <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{field.name}</span>
                    {field.required && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                        required
                      </Badge>
                    )}
                    {!field.isActive && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                        disabled
                      </Badge>
                    )}
                  </div>
                  {field.description && (
                    <p className="truncate text-xs text-[var(--muted-foreground)]">{field.description}</p>
                  )}
                  {field.options.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {field.options.slice(0, 5).map((opt, i) => (
                        <span
                          key={i}
                          className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]"
                        >
                          {opt}
                        </span>
                      ))}
                      {field.options.length > 5 && (
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          +{field.options.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <Badge variant="secondary" className="flex-shrink-0 text-xs">
                  {typeInfo?.label || field.type}
                </Badge>

                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    onClick={() => onToggleActive(field)}
                    className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    title={field.isActive ? "Disable field" : "Enable field"}
                  >
                    <ToggleLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(field)}
                    className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    title="Edit field"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(field.id)}
                    className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-500"
                    title="Delete field"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
