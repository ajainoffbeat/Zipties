import { useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";
import { getCitiesList } from "@/lib/api/user.api";

export const useCitySearch = () => {
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingCities, setLoadingCities] = useState(false);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        setLoadingCities(true);

        try {
          const res = await getCitiesList(query);
          setCities(res.data.data || []);
        } catch (err) {
          console.error("City fetch failed", err);
        } finally {
          setLoadingCities(false);
        }
      }, 400),
    []
  );

  useEffect(() => {
    debouncedSearch(search);
  }, [search]);

  return {
    cities,
    search,
    setSearch,
    loadingCities,
  };
};