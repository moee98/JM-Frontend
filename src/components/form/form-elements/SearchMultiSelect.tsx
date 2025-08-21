import type React from "react";
import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  text: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
}

const SearchMultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = [],
  onChange,
  disabled = false,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(defaultSelected);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // 👈 search state

  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery(""); // reset search when closing
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    if (!disabled) setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    const newSelectedOptions = selectedOptions.includes(optionValue)
      ? selectedOptions.filter((value) => value !== optionValue)
      : [...selectedOptions, optionValue];

    setSelectedOptions(newSelectedOptions);
    onChange?.(newSelectedOptions);
  };

  const removeOption = (value: string) => {
    const newSelectedOptions = selectedOptions.filter((opt) => opt !== value);
    setSelectedOptions(newSelectedOptions);
    onChange?.(newSelectedOptions);
  };

  const selectedValuesText = selectedOptions.map(
    (value) => options.find((option) => option.value === value)?.text || ""
  );

  // Filter options based on search
  const filteredOptions = options.filter((option) =>
    option.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full" ref={containerRef}>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        {label}
      </label>

      <div className="relative z-20 inline-block w-full">
        <div className="relative flex flex-col items-center">
          <div onClick={() => !disabled && setIsOpen(true)} className="w-full">
            <div className="mb-2 flex min-h-[44px] rounded-lg border border-gray-300 py-1.5 pl-3 pr-3 shadow-theme-xs transition focus:border-brand-300 focus:shadow-focus-ring dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-300">
              <div className="flex flex-wrap flex-auto gap-2">
                {selectedValuesText.length > 0 ? (
                  selectedValuesText.map((text, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-center rounded-full bg-gray-100 py-1 pl-2.5 pr-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-white/90"
                    >
                      <span>{text}</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOption(selectedOptions[index]);
                        }}
                        className="pl-2 cursor-pointer text-gray-500 group-hover:text-gray-400"
                      >
                        ✕
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 text-sm">
                    Select option
                  </span>
                )}
              </div>
              <div className="flex items-center pl-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown();
                  }}
                >
                  ▼
                </button>
              </div>
            </div>
          </div>

          {isOpen && (
            <div
              className="absolute left-0 top-full z-40 w-full rounded-lg bg-white shadow-sm dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
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
                  filteredOptions.map((option, index) => (
                    <div
                      key={index}
                      className={`cursor-pointer p-2  text-gray-500 dark:text-gray-400${
                        selectedOptions.includes(option.value)
                          ? "bg-primary/10"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => handleSelect(option.value)}
                    >
                      {option.text}
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500 dark:text-gray-400">
                    No results
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchMultiSelect;
