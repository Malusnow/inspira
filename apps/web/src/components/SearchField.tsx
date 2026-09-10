import { SearchIcon } from "tdesign-icons-react"

export interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  className?: string
  iconClassName?: string
  inputClassName?: string
}

export function SearchField({
  value,
  onChange,
  className = "",
  iconClassName = "",
  inputClassName = ""
}: SearchFieldProps) {
  return (
    <label className={`flex items-center text-ink-muted ${className}`}>
      <SearchIcon className={`shrink-0 ${iconClassName}`} />
      <input
        aria-label="Search notes"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search notes or tags..."
        className={`min-w-0 flex-1 border-0 bg-transparent outline-none placeholder:text-ink-muted ${inputClassName}`}
      />
    </label>
  )
}
