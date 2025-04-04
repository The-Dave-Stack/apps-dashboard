import { CategoryData } from "@/lib/types";
import AppCard from "./AppCard";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface CategorySectionProps {
  category: CategoryData;
}

export default function CategorySection({ category }: CategorySectionProps) {
  const { t } = useTranslation();
  
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">{category.name}</h2>
        <Link href={`/category/${category.id}`} className="text-primary hover:text-primary/90 text-sm font-medium flex items-center cursor-pointer">
          <span>{t('dashboard.viewAll')}</span>
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
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
