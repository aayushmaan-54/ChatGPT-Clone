import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";



export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <Select onValueChange={(value) => setTheme(value)} value={theme}>
        <SelectTrigger>
          <SelectValue placeholder={theme ? theme.toLocaleUpperCase() : "System"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
}
