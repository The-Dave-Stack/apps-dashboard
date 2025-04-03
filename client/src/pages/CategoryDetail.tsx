import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { CategoryData } from "@/lib/types";
import { fetchCategories } from "@/lib/firebase";
import AppCard from "@/components/AppCard";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CategoryDetail() {
  const { toast } = useToast();
  const params = useParams();
  const categoryId = params.id;
  const [category, setCategory] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        
        // Cargar todas las categorías y filtrar la que coincide con el ID
        const categories = await fetchCategories();
        const foundCategory = categories.find(cat => cat.id === categoryId);
        
        if (foundCategory) {
          setCategory(foundCategory);
        } else {
          toast({
            title: "Categoría no encontrada",
            description: "La categoría que buscas no existe",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error fetching category:", error);
        toast({
          title: "Error al cargar la categoría",
          description: "No se pudo cargar la información. Por favor, intente más tarde.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchCategoryData();
    }
  }, [categoryId, toast]);

  return (
    <>
      <div className="mb-6 flex items-center">
        <Link href="/" className="mr-4 p-2 rounded-full hover:bg-neutral-100">
          <ArrowLeft className="h-5 w-5 text-neutral-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary-600">
            {loading ? "Cargando..." : category ? category.name : "Categoría no encontrada"}
          </h1>
          <p className="text-neutral-500 mt-1">
            {category ? `${category.apps.length} aplicaciones` : ""}
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-neutral-200 h-40 animate-pulse"></div>
          ))}
        </div>
      ) : category ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {category.apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-700">Categoría no encontrada</h3>
          <p className="text-neutral-500 mt-2">La categoría que buscas no existe o ha sido eliminada</p>
          <Link href="/" className="mt-4 inline-block text-primary-600 font-medium hover:underline">
            Volver al dashboard
          </Link>
        </div>
      )}
    </>
  );
}