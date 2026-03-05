import { useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { useCitySearch } from "@/hooks/useCitySearch";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type City = {
  id: string;
  name: string;
  state: string;
};

type Props = {
  value?: string | null | number;
  placeholder?: string;
  width?: string;
  onSelect: (city: City) => void;
  defaultValue?: string;
};

 export function CityFilter({
  value,
  onSelect,
  placeholder = "Select city...",
  width = "w-[300px]",
  defaultValue,
}: Props) {
  const [open, setOpen] = useState(false);
  console.log(defaultValue);
  const { cities, search, setSearch, loadingCities } = useCitySearch();

  const selectedCity = cities.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between font-normal", width)}
        >
          {selectedCity
            ? `${selectedCity.name}, ${selectedCity.state}`
            : placeholder}

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search city..."
            onValueChange={setSearch}
            value={search}
          />

          <CommandList className="max-h-[300px] overflow-y-auto">
            {loadingCities && (
              <div className="p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            )}

            {!loadingCities && cities.length === 0 && (
              <CommandEmpty>No city found.</CommandEmpty>
            )}

            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city.id}
                  
                  value={city.id}
                  onSelect={() => {
                    onSelect(city);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === city.id ? "opacity-100" : "opacity-0"
                    )}
                  />

                  {city.name}, {city.state}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}