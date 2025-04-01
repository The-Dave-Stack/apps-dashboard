import { CategoryData } from "@/lib/types";
import AppCard from "./AppCard";
import { ChevronRight } from "lucide-react";

interface CategorySectionProps {
  category: CategoryData;
}

export default function CategorySection({ category }: CategorySectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-neutral-800">{category.name}</h2>
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
          <span>View all</span>
          <ChevronRight className="ml-1 h-4 w-4" />
        </button>
      </div>
      
      {/* Grid of Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {category.apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </section>
  );
}
