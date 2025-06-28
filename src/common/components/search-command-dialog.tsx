import React, { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";

export interface CommandItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

export interface CommandGroup {
  heading?: string;
  items: CommandItem[];
}

interface SearchCommandDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  groups: CommandGroup[];
  placeholder?: string;
  emptyMessage?: string;
  search?: string;
  onSearch?: (search: string) => void;
}



export default function SearchCommandDialog({
  open,
  setOpen,
  groups,
  placeholder = "Type a command or search...",
  emptyMessage = "No results found.",
  search,
  onSearch,
}: SearchCommandDialogProps) {
  // Handle keyboard shortcut for opening search dialog
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={placeholder}
        value={search}
        onValueChange={onSearch}
      />
      <CommandList>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        {groups.map((group, groupIndex) => (
          <React.Fragment key={`group-${groupIndex}`}>
            {group.heading && ( // Render CommandGroup with heading if present
              <CommandGroup heading={group.heading}>
                {group.items.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <CommandItem key={item.id} onSelect={item.onSelect}>
                      {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
                      <span>{item.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {!group.heading && ( // Render CommandGroup without heading if not present
              <CommandGroup>
                {group.items.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <CommandItem key={item.id} onSelect={item.onSelect}>
                      {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
                      <span>{item.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {groupIndex < groups.length - 1 && <CommandSeparator />} {/* Add separator between groups */}
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
