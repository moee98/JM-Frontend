import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  className?: string;
}

export default function SearchSelect({
  options,
  placeholder = "Select option",
  onChange,
  defaultValue = "",
  disabled = false,
  className = "",
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedValue, setSelectedValue] = useState(defaultValue);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    onChange?.(value);
    setIsOpen(false);
    setSearchQuery("");
  };

  const selectedLabel = options.find((opt) => opt.value === selectedValue)?.label;

  // filter options
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div
        className={`flex items-center justify-between rounded-lg border border-gray-300 px-3 py-2 shadow-sm cursor-pointer dark:border-gray-700 dark:bg-gray-900 ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-brand-300"
        }`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
      >
        <span className={selectedLabel ? "text-gray-800 dark:text-white" : "text-gray-400"}>
          {selectedLabel || placeholder}
        </span>
        <span className="ml-2">▼</span>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {/* 🔎 Search input */}
          <div className="p-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`cursor-pointer px-3 py-2  text-gray-500 dark:text-gray-400 ${
                    option.value === selectedValue
                      ? "bg-primary/10 font-medium"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
