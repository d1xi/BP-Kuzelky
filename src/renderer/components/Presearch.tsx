import { useState, useMemo } from "react";
import styles from "./Presearch.module.css";

type Props<T> = {
  items: T[];
  value: T | null;
  onChange: (item: T) => void;
  getLabel: (item: T) => string;
  placeholder?: string;
};

export default function Presearch<T>(
    {
    items,
    value,
    onChange,
    getLabel,
    placeholder = "",
    }: Props<T>) 
{
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return items;

    return items.filter((item) =>
      getLabel(item).toLowerCase().includes(query.toLowerCase())
    );
  }, [query, items, getLabel]);

  return (
    <div className={styles.wrapper}>
      <input
        className={styles.input}
        value={open ? query : value ? getLabel(value) : ""}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
        onBlur={() => {
          const item = items.find((item) => {
            return getLabel(item) === query;
          })
          if(item !== undefined){
            onChange(item);
          }
          else{
            alert('Neplatná hodnota!')
          }
          setTimeout(() => setOpen(false), 150);
        }}
      />

      {open && filtered.length > 0 && (
        <ul className={styles.dropdown}>
          {filtered.map((item, i) => (
            <li
              key={i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(item);
                setOpen(false);
              }}
            >
              {getLabel(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}