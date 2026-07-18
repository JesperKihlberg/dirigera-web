import React from "react";
import { Select } from "antd";
import * as MdIcons from "react-icons/md";

interface IconPickerProps {
  value: string | undefined;
  onChange: (icon: string | undefined) => void;
}

const iconNames = Object.keys(MdIcons);

const iconOptions = iconNames.map((name) => {
  const IconComponent = (MdIcons as Record<string, React.ComponentType>)[
    name
  ];
  return {
    value: name,
    label: (
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <IconComponent />
        {name}
      </span>
    ),
  };
});

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <Select
      showSearch
      allowClear
      value={value}
      placeholder="Select an icon"
      style={{ minWidth: 220 }}
      onChange={(next) => onChange(next ?? undefined)}
      filterOption={(input, option) =>
        typeof option?.value === "string" &&
        option.value.toLowerCase().includes(input.toLowerCase())
      }
      options={iconOptions}
    />
  );
}
