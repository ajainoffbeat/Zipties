import { MapPin, X, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { usePostStore } from "@/store/usePostStore";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { getCitiesList } from "@/lib/api/user.api";
import { cn } from "@/lib/utils/utils";
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

export function CityFilter() {
    const { selectedCity, setSelectedCity } = usePostStore();
    const [open, setOpen] = useState(false);
    const [cities, setCities] = useState<any[]>([]);
    const [citySearch, setCitySearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Simple debounce implementation since lodash might not be consistently available
    const fetchCities = useCallback(async (search: string) => {
        setIsLoading(true);
        try {
            const res = await getCitiesList(search);
            setCities(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch cities", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCities(citySearch);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [citySearch, fetchCities]);

    const handleClear = () => {
        setSelectedCity("");
        setCitySearch("");
    };

    return (
        <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="secondary"
                        role="combobox"
                        aria-expanded={open}
                        className=" group w-full md:w-[240px]  text-muted-foreground hover:text-white  hover:bg-primary/90  justify-between font-normal pl-3"
                    >
                        <div className="flex items-center gap-2 ">
                            <MapPin className="h-4 w-4  text-muted-foreground   shrink-0 group-hover:text-white transition-colors" />
                            <span className="truncate text-black">
                                {selectedCity || "Filter by City"}
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 z-0"  side='bottom' avoidCollisions={false} align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Search city..."
                            onValueChange={setCitySearch}
                            value={citySearch}
                        />
                        <CommandList className="max-h-[300px] overflow-y-auto">
                            {isLoading && (
                                <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Searching...
                                </div>
                            )}
                            {!isLoading && cities.length === 0 && (
                                <CommandEmpty>No city found.</CommandEmpty>
                            )}
                            <CommandGroup>
                                {cities.map((city) => (
                                    <CommandItem
                                        key={city.id}
                                        value={city.id.toString()}
                                        onSelect={() => {
                                            setSelectedCity(city.name);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedCity === city.id ? "opacity-100" : "opacity-0"
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
            {selectedCity && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="text-muted-foreground hover:text-destructive h-9 px-2 shrink-0 transition-colors"
                    title="Clear Filter"
                >
                    <X className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
}
