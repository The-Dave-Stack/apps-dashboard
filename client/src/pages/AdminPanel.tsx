import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/hooks";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import AdminCategoryForm from "@/components/AdminCategoryForm";
import AdminAppForm from "@/components/AdminAppForm";
import { CategoryData, AppData } from "@/lib/types";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X } from "lucide-react";

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("categories");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showAppForm, setShowAppForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [editingApp, setEditingApp] = useState<{app: AppData, categoryId: string} | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Redirect if not logged in
  if (!user) {
    setLocation("/");
    return null;
  }

  const fetchCategories = async () => {
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
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [toast]);

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category? This will also delete all apps in this category.")) {
      try {
        await deleteDoc(doc(db, "categories", categoryId));
        toast({
          title: "Category deleted",
          description: "The category has been successfully deleted",
        });
        fetchCategories();
      } catch (error: any) {
        toast({
          title: "Error deleting category",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleEditCategory = (category: CategoryData) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async (category: { id?: string; name: string }) => {
    try {
      if (category.id) {
        // Update existing category
        await updateDoc(doc(db, "categories", category.id), {
          name: category.name
        });
        toast({
          title: "Category updated",
          description: "The category has been successfully updated",
        });
      } else {
        // Add new category
        await addDoc(collection(db, "categories"), {
          name: category.name,
          apps: []
        });
        toast({
          title: "Category added",
          description: "The new category has been successfully added",
        });
      }
      setShowCategoryForm(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error saving category",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteApp = async (categoryId: string, appId: string) => {
    if (confirm("Are you sure you want to delete this app?")) {
      try {
        const categoryRef = doc(db, "categories", categoryId);
        const category = categories.find(cat => cat.id === categoryId);
        
        if (category) {
          const updatedApps = category.apps.filter(app => app.id !== appId);
          await updateDoc(categoryRef, { apps: updatedApps });
          
          toast({
            title: "App deleted",
            description: "The app has been successfully deleted",
          });
          fetchCategories();
        }
      } catch (error: any) {
        toast({
          title: "Error deleting app",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleEditApp = (app: AppData, categoryId: string) => {
    setEditingApp({ app, categoryId });
    setSelectedCategoryId(categoryId);
    setShowAppForm(true);
  };

  const handleAddApp = (categoryId: string) => {
    setEditingApp(null);
    setSelectedCategoryId(categoryId);
    setShowAppForm(true);
  };

  const handleSaveApp = async (app: AppData, categoryId: string) => {
    try {
      const categoryRef = doc(db, "categories", categoryId);
      const category = categories.find(cat => cat.id === categoryId);
      
      if (category) {
        let updatedApps;
        
        if (app.id) {
          // Update existing app
          updatedApps = category.apps.map(a => 
            a.id === app.id ? app : a
          );
        } else {
          // Add new app with a new ID
          const newApp = {
            ...app,
            id: Date.now().toString()
          };
          updatedApps = [...category.apps, newApp];
        }
        
        await updateDoc(categoryRef, { apps: updatedApps });
        
        toast({
          title: app.id ? "App updated" : "App added",
          description: `The app has been successfully ${app.id ? "updated" : "added"}`,
        });
        
        setShowAppForm(false);
        setEditingApp(null);
        setSelectedCategoryId(null);
        fetchCategories();
      }
    } catch (error: any) {
      toast({
        title: "Error saving app",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const allApps = categories.flatMap(category => 
    category.apps.map(app => ({
      ...app,
      categoryId: category.id,
      categoryName: category.name
    }))
  );

  return (
    <Dialog open={true} onOpenChange={() => setLocation("/dashboard")}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-neutral-800">Admin Panel</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/dashboard")}
              className="text-neutral-500 hover:text-neutral-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <DialogDescription>
            Manage your categories and apps
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="apps">Apps</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="categories" className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-neutral-800">Manage Categories</h3>
                <Button
                  onClick={() => {
                    setEditingCategory(null);
                    setShowCategoryForm(true);
                  }}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  Add Category
                </Button>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-neutral-100 rounded"></div>
                  <div className="h-12 bg-neutral-100 rounded"></div>
                  <div className="h-12 bg-neutral-100 rounded"></div>
                </div>
              ) : (
                <div className="bg-white overflow-hidden border border-neutral-200 rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Apps Count</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.length > 0 ? (
                        categories.map((category) => (
                          <TableRow key={category.id}>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell className="text-neutral-500">{category.id}</TableCell>
                            <TableCell className="text-neutral-500">{category.apps.length}</TableCell>
                            <TableCell>
                              <div className="flex space-x-3">
                                <Button 
                                  variant="ghost" 
                                  className="text-primary-600 hover:text-primary-900 h-auto p-0"
                                  onClick={() => handleEditCategory(category)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  className="text-red-600 hover:text-red-800 h-auto p-0"
                                  onClick={() => handleDeleteCategory(category.id)}
                                >
                                  Delete
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  className="text-primary-600 hover:text-primary-900 h-auto p-0"
                                  onClick={() => handleAddApp(category.id)}
                                >
                                  Add App
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-neutral-500">
                            No categories found. Click "Add Category" to create one.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="apps" className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-neutral-800">Manage Apps</h3>
                <div className="flex space-x-2">
                  {categories.length > 0 && (
                    <Button
                      onClick={() => {
                        setEditingApp(null);
                        setSelectedCategoryId(categories[0].id);
                        setShowAppForm(true);
                      }}
                      className="bg-primary-600 hover:bg-primary-700"
                    >
                      Add App
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-neutral-100 rounded"></div>
                  <div className="h-12 bg-neutral-100 rounded"></div>
                  <div className="h-12 bg-neutral-100 rounded"></div>
                </div>
              ) : (
                <div className="bg-white overflow-hidden border border-neutral-200 rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>App Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allApps.length > 0 ? (
                        allApps.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={app.icon} 
                                  alt={app.name} 
                                  className="h-6 w-6 object-contain"
                                  onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100?text=No+Icon")}
                                />
                                {app.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-neutral-500">{app.categoryName}</TableCell>
                            <TableCell className="text-neutral-500 truncate max-w-[200px]">
                              <a 
                                href={app.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:underline"
                              >
                                {app.url}
                              </a>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-3">
                                <Button 
                                  variant="ghost" 
                                  className="text-primary-600 hover:text-primary-900 h-auto p-0"
                                  onClick={() => handleEditApp(app, app.categoryId)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  className="text-red-600 hover:text-red-800 h-auto p-0"
                                  onClick={() => handleDeleteApp(app.categoryId, app.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-neutral-500">
                            No apps found. Add categories first, then add apps to them.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>

      {/* Category Form Dialog */}
      <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <AdminCategoryForm 
            category={editingCategory}
            onSave={handleSaveCategory}
            onCancel={() => setShowCategoryForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* App Form Dialog */}
      <Dialog open={showAppForm} onOpenChange={setShowAppForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingApp ? "Edit App" : "Add App"}</DialogTitle>
          </DialogHeader>
          {selectedCategoryId && (
            <AdminAppForm 
              app={editingApp?.app}
              categoryId={selectedCategoryId}
              categories={categories}
              onSave={handleSaveApp}
              onCancel={() => setShowAppForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
