import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/hooks";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import CategorySection from "@/components/CategorySection";
import { CategoryData } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect if not logged in
  if (!user) {
    setLocation("/");
    return null;
  }

  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        setLoading(true);
        
        const categoriesCol = collection(db, "categories");
        const categoriesSnapshot = await getDocs(categoriesCol);
        
        const categoriesData: CategoryData[] = [];
        categoriesSnapshot.forEach((doc) => {
          const data = doc.data() as CategoryData;
          categoriesData.push({
            id: doc.id,
            name: data.name,
            apps: data.apps || []
          });
        });
        
        setCategories(categoriesData);
      } catch (error: any) {
        toast({
          title: "Error fetching categories",
          description: error.message || "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesData();
  }, [toast]);

  // Filter apps based on search term
  const filteredCategories = categories.map(category => ({
    ...category,
    apps: category.apps.filter(app => 
      app.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.apps.length > 0);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for larger screens */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600">AppHub</h1>
          <div className="flex items-center space-x-4">
            <button>
              <Search className="h-5 w-5 text-neutral-600" />
            </button>
            <div className="h-8 w-8 rounded-full bg-neutral-300 overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt="User avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary-100 text-primary-600">
                  {user.email ? user.email[0].toUpperCase() : "U"}
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Desktop Header */}
        <header className="hidden md:block bg-white border-b border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-800">Dashboard</h1>
            <div className="relative max-w-sm">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
              <Input
                type="text" 
                className="pl-10" 
                placeholder="Search apps..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="flex-1 p-4 md:p-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 h-64 animate-pulse">
                  <div className="h-8 w-1/2 bg-neutral-200 rounded mb-4"></div>
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-24 bg-neutral-100 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <CategorySection key={category.id} category={category} />
                ))
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-neutral-700">No results found</h3>
                  <p className="text-neutral-500 mt-2">Try adjusting your search terms</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
