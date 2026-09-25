import { useState } from "react";
import { AVAILABLE_ICONS, MaterialIcon } from "./MaterialIcon";

type IconPickerProps = {
  value: string;
  onChange: (icon: string) => void;
  label: string;
};

export function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIcons = AVAILABLE_ICONS.filter((icon) =>
    icon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sgd-icon-picker">
      <button
        type="button"
        className="sgd-icon-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MaterialIcon name={value} size={24} />
        <span>{label}</span>
      </button>

      {isOpen && (
        <div className="sgd-icon-picker-dropdown">
          <div className="sgd-icon-picker-search">
            <input
              type="text"
              placeholder="Icon suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sgd-icon-picker-search-input"
            />
          </div>
          <div className="sgd-icon-picker-grid">
            {filteredIcons.map((iconName) => (
              <button
                key={iconName}
                type="button"
                className={`sgd-icon-picker-item ${value === iconName ? "sgd-icon-picker-item--active" : ""}`}
                onClick={() => {
                  onChange(iconName);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                title={iconName}
              >
                <MaterialIcon name={iconName} size={24} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
