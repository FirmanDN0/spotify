import { SearchBar } from "@/components/SearchBar";

export default function SearchPage() {
  return (
    <div className="flex flex-col gap-10 pb-20">
      <header className="flex flex-col gap-2 mb-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          Search
        </h1>
      </header>
      
      <SearchBar />
    </div>
  );
}
