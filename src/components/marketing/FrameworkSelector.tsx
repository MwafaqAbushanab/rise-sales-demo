import type { Framework } from '../../data/marketingFrameworks';

interface FrameworkSelectorProps {
  frameworks: Framework[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  label?: string;
}

export default function FrameworkSelector({ frameworks, selected, onSelect, label = 'Writing Framework' }: FrameworkSelectorProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select
        value={selected ?? ''}
        onChange={(e) => onSelect(e.target.value || null)}
        className="w-full px-3 py-2 border rounded-lg text-sm"
      >
        <option value="">Auto (AI chooses best framework)</option>
        {frameworks.map(fw => (
          <option key={fw.id} value={fw.id}>
            {fw.icon} {fw.name} — {fw.shortDescription}
          </option>
        ))}
      </select>
      {selected && (
        <p className="mt-1 text-xs text-purple-600">
          Best for: {frameworks.find(f => f.id === selected)?.bestFor}
        </p>
      )}
    </div>
  );
}
