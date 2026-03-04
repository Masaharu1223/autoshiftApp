"use client";

interface NumberStepperProps {
  value: string;
  onChange: (v: string) => void;
  min?: number;
  placeholder?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  placeholder,
}: NumberStepperProps) {
  const numValue = value === "" ? null : Number(value);

  const decrement = () => {
    if (numValue == null) return;
    if (numValue > min) onChange(String(numValue - 1));
  };

  const increment = () => {
    onChange(String((numValue ?? min) + 1));
  };

  return (
    <div className="flex items-center gap-0 border border-gray-300 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={decrement}
        disabled={numValue == null || numValue <= min}
        className="px-3 py-2 text-lg font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-gray-300"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || /^\d+$/.test(v)) onChange(v);
        }}
        placeholder={placeholder}
        className="w-16 text-center py-2 text-sm focus:outline-none"
      />
      <button
        type="button"
        onClick={increment}
        className="px-3 py-2 text-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors border-l border-gray-300"
      >
        +
      </button>
    </div>
  );
}
