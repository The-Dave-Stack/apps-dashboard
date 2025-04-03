import { useState, useEffect } from "react";
import { 
  Pencil, 
  Trash, 
  Plus, 
  PlusCircle, 
  X, 
  Save, 
  FolderPlus,
  AppWindow,
  Loader,
  AlertTriangle
} from "lucide-react";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AppData, CategoryData } from "@/lib/types";
import { useAuth } from "@/lib/hooks";
import { 
  fetchCategories, 
  saveCategory, 
  deleteCategory, 
  saveApp, 
  deleteApp 
} from "@/lib/firebase";

export default function AdminPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estados para la gestión de categorías y aplicaciones
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [editingApp, setEditingApp] = useState<{app: AppData, categoryId: string} | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newAppData, setNewAppData] = useState<AppData>({
    name: "",
    icon: "",
    url: "",
    description: ""
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Dialogos
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [showNewAppDialog, setShowNewAppDialog] = useState(false);
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false);
  const [showEditAppDialog, setShowEditAppDialog] = useState(false);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [showDeleteAppDialog, setShowDeleteAppDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'app' | 'category', categoryId?: string} | null>(null);
  
  // Usuario simulado para el desarrollo (temporal)
  const mockUser = {
    uid: "mock-user-id",
    email: "usuario@ejemplo.com",
    displayName: "Usuario de Prueba",
    photoURL: null
  };

  // Durante el desarrollo, usamos el usuario simulado si no hay usuario autenticado
  const effectiveUser = user || mockUser;
  
  // Datos de ejemplo para desarrollo
  const mockCategories: CategoryData[] = [
    {
      id: "cat1",
      name: "Productividad",
      apps: [
        {
          id: "app1",
          name: "Google Workspace",
          icon: "https://www.gstatic.com/images/branding/product/2x/hh_drive_96dp.png",
          url: "https://workspace.google.com/",
          description: "Suite de herramientas de productividad: Gmail, Drive, Docs, Calendar"
        },
        {
          id: "app2",
          name: "Microsoft 365",
          icon: "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31",
          url: "https://www.microsoft.com/microsoft-365",
          description: "Aplicaciones de Office en la nube: Word, Excel, PowerPoint, Teams"
        },
        {
          id: "app3",
          name: "Slack",
          icon: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_128.png",
          url: "https://slack.com/",
          description: "Plataforma de comunicación para equipos de trabajo"
        }
      ]
    },
    {
      id: "cat2",
      name: "Diseño",
      apps: [
        {
          id: "app4",
          name: "Figma",
          icon: "https://cdn.sanity.io/images/599r6htc/localized/46a76c802176eb17b04e12108de7e7e0f3736dc6-1024x1024.png?w=804&h=804&q=75&fit=max&auto=format",
          url: "https://figma.com/",
          description: "Herramienta de diseño colaborativo en la nube"
        },
        {
          id: "app5",
          name: "Canva",
          icon: "https://static.canva.com/static/images/canva-logo-blue.svg",
          url: "https://canva.com/",
          description: "Plataforma de diseño gráfico y composición de imágenes"
        }
      ]
    },
    {
      id: "cat3",
      name: "Desarrollo",
      apps: [
        {
          id: "app6",
          name: "GitHub",
          icon: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png",
          url: "https://github.com/",
          description: "Plataforma de desarrollo colaborativo basado en Git"
        },
        {
          id: "app7",
          name: "Replit",
          icon: "https://replit.com/cdn-cgi/image/width=64,quality=80/https://storage.googleapis.com/replit/images/1664475603315_1442b3c69cc612aff6ef60cce0c69328.png",
          url: "https://replit.com/",
          description: "Entorno de desarrollo integrado en la nube"
        },
        {
          id: "app8",
          name: "CodeSandbox",
          icon: "https://codesandbox.io/favicon.ico",
          url: "https://codesandbox.io/",
          description: "Entorno de desarrollo instantáneo para aplicaciones web"
        }
      ]
    }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    // Redirigir si no hay usuario
    if (!user) {
      return;
    }
    
    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error al cargar las categorías:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías. Inténtalo de nuevo más tarde.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, [user, toast]);

  // Manejadores para categorías
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría no puede estar vacío",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Crear nueva categoría en Firebase
      const newCategory: CategoryData = {
        id: "", // Firebase asignará el ID
        name: newCategoryName,
        apps: []
      };
      
      const savedCategory = await saveCategory(newCategory);
      
      // Actualizar el estado con los datos desde Firebase
      setCategories([...categories, savedCategory]);
      
      toast({
        title: "Categoría creada",
        description: `Se ha creado la categoría ${newCategory.name}`,
      });
    } catch (error) {
      console.error("Error al crear categoría:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría. Inténtalo de nuevo más tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setNewCategoryName("");
      setShowNewCategoryDialog(false);
    }
  };
  
  const handleEditCategory = (category: CategoryData) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setShowEditCategoryDialog(true);
  };
  
  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría no puede estar vacío",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Actualizar categoría en Firebase
      const updatedCategory: CategoryData = {
        ...editingCategory,
        name: newCategoryName
      };
      
      await saveCategory(updatedCategory);
      
      // Actualizar el estado local
      const updatedCategories = categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, name: newCategoryName } 
          : cat
      );
      
      setCategories(updatedCategories);
      
      toast({
        title: "Categoría actualizada",
        description: `Se ha actualizado la categoría a ${newCategoryName}`,
      });
    } catch (error) {
      console.error("Error al actualizar categoría:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría. Inténtalo de nuevo más tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowEditCategoryDialog(false);
      setEditingCategory(null);
      setNewCategoryName("");
    }
  };
  
  const handleDeleteCategory = (category: CategoryData) => {
    setItemToDelete({
      id: category.id,
      type: 'category'
    });
    setShowDeleteCategoryDialog(true);
  };
  
  const confirmDeleteCategory = async () => {
    if (!itemToDelete) return;
    
    setLoading(true);
    
    try {
      // Eliminar categoría de Firebase
      await deleteCategory(itemToDelete.id);
      
      // Actualizar el estado local
      const updatedCategories = categories.filter(cat => cat.id !== itemToDelete.id);
      setCategories(updatedCategories);
      
      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría. Inténtalo de nuevo más tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowDeleteCategoryDialog(false);
      setItemToDelete(null);
    }
  };
  
  // Manejadores para aplicaciones
  const handleAddApp = () => {
    setNewAppData({
      name: "",
      icon: "",
      url: "",
      description: ""
    });
    setSelectedCategoryId(categories.length > 0 ? categories[0].id : null);
    setShowNewAppDialog(true);
  };
  
  const handleEditApp = (app: AppData, categoryId: string) => {
    setEditingApp({app, categoryId});
    setNewAppData({...app});
    setShowEditAppDialog(true);
  };
  
  const handleSaveNewApp = async () => {
    if (!selectedCategoryId) {
      toast({
        title: "Error",
        description: "Debes seleccionar una categoría",
        variant: "destructive"
      });
      return;
    }
    
    if (!newAppData.name || !newAppData.url) {
      toast({
        title: "Error",
        description: "El nombre y la URL son campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    
    // Validar URL
    try {
      new URL(newAppData.url);
    } catch (_) {
      toast({
        title: "Error",
        description: "La URL no es válida",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Crear nueva aplicación para la categoría seleccionada
      const newApp: AppData = {
        ...newAppData,
        id: `app${Date.now()}` // Esto se reemplazará en Firebase si es necesario
      };
      
      // Encontrar la categoría actual
      const currentCategory = categories.find(cat => cat.id === selectedCategoryId);
      
      if (!currentCategory) {
        throw new Error("La categoría seleccionada ya no existe");
      }
      
      // Actualizar la categoría con la nueva app
      const updatedCategory: CategoryData = {
        ...currentCategory,
        apps: [...currentCategory.apps, newApp]
      };
      
      // Guardar en Firebase
      await saveApp(newApp, selectedCategoryId);
      
      // Actualizar el estado local
      const updatedCategories = categories.map(cat => 
        cat.id === selectedCategoryId 
          ? updatedCategory
          : cat
      );
      
      setCategories(updatedCategories);
      
      toast({
        title: "Aplicación creada",
        description: `Se ha creado la aplicación ${newApp.name}`,
      });
    } catch (error) {
      console.error("Error al crear aplicación:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la aplicación. Inténtalo de nuevo más tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowNewAppDialog(false);
    }
  };
  
  const handleUpdateApp = async () => {
    if (!editingApp) return;
    
    if (!newAppData.name || !newAppData.url) {
      toast({
        title: "Error",
        description: "El nombre y la URL son campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    
    // Validar URL
    try {
      new URL(newAppData.url);
    } catch (_) {
      toast({
        title: "Error",
        description: "La URL no es válida",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Actualizar aplicación con los nuevos datos
      const updatedApp: AppData = { 
        ...newAppData, 
        id: editingApp.app.id 
      };
      
      // Guardar en Firebase
      await saveApp(updatedApp, editingApp.categoryId);
      
      // Actualizar el estado local
      const updatedCategories = categories.map(cat => 
        cat.id === editingApp.categoryId 
          ? { 
              ...cat, 
              apps: cat.apps.map(app => 
                app.id === editingApp.app.id 
                  ? updatedApp
                  : app
              ) 
            } 
          : cat
      );
      
      setCategories(updatedCategories);
      
      toast({
        title: "Aplicación actualizada",
        description: `Se ha actualizado la aplicación ${newAppData.name}`,
      });
    } catch (error) {
      console.error("Error al actualizar aplicación:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la aplicación. Inténtalo de nuevo más tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowEditAppDialog(false);
      setEditingApp(null);
    }
  };
  
  const handleDeleteApp = (appId: string | undefined, categoryId: string) => {
    if (!appId) return;
    
    setItemToDelete({
      id: appId,
      type: 'app',
      categoryId
    });
    setShowDeleteAppDialog(true);
  };
  
  const confirmDeleteApp = async () => {
    if (!itemToDelete || !itemToDelete.categoryId) return;
    
    setLoading(true);
    
    try {
      // Eliminar aplicación de Firebase
      await deleteApp(itemToDelete.id);
      
      // Actualizar el estado local
      const updatedCategories = categories.map(cat => 
        cat.id === itemToDelete.categoryId 
          ? { ...cat, apps: cat.apps.filter(app => app.id !== itemToDelete.id) } 
          : cat
      );
      
      setCategories(updatedCategories);
      
      toast({
        title: "Aplicación eliminada",
        description: "La aplicación ha sido eliminada correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar aplicación:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la aplicación. Inténtalo de nuevo más tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowDeleteAppDialog(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for larger screens */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600">AppHub</h1>
        </header>
        
        {/* Desktop Header */}
        <header className="bg-white border-b border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-800">Panel de Administración</h1>
            <div className="flex gap-2">
              <Button onClick={handleAddApp}>
                <AppWindow className="mr-2 h-4 w-4" />
                Nueva Aplicación
              </Button>
              <Button variant="outline" onClick={() => setShowNewCategoryDialog(true)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </div>
          </div>
        </header>
        
        {/* Admin Panel Content */}
        <main className="flex-1 p-4 md:p-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-2 text-neutral-600">Cargando datos...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {categories.length > 0 ? (
                categories.map(category => (
                  <div key={category.id} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                    <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center">
                      <h2 className="text-lg font-medium text-neutral-800">{category.name}</h2>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-neutral-600"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => handleDeleteCategory(category)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      {category.apps.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {category.apps.map(app => (
                            <div key={app.id} className="flex border rounded-lg overflow-hidden">
                              <div className="w-16 h-16 bg-neutral-100 flex items-center justify-center p-2">
                                <img 
                                  src={app.icon || "https://placehold.co/100x100?text=No+Icon"} 
                                  alt={app.name} 
                                  className="max-w-full max-h-full object-contain"
                                  onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100?text=No+Icon")}
                                />
                              </div>
                              <div className="flex-1 p-3">
                                <div className="flex justify-between">
                                  <h3 className="font-medium text-neutral-800">{app.name}</h3>
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleEditApp(app, category.id)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0 text-red-600"
                                      onClick={() => app.id && handleDeleteApp(app.id, category.id)}
                                    >
                                      <Trash className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-xs text-neutral-500 truncate">{app.url}</p>
                                <p className="text-xs text-neutral-600 mt-1 line-clamp-1">{app.description}</p>
                              </div>
                            </div>
                          ))}
                          <div 
                            className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-neutral-500 cursor-pointer hover:bg-neutral-50 transition-colors"
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setShowNewAppDialog(true);
                            }}
                          >
                            <PlusCircle className="h-8 w-8 mb-2" />
                            <p>Agregar aplicación a {category.name}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-neutral-500 mb-4">No hay aplicaciones en esta categoría</p>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setShowNewAppDialog(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar aplicación
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 mb-4 text-neutral-300">
                    <AlertTriangle className="w-full h-full" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-700">No hay categorías</h3>
                  <p className="text-neutral-500 mt-2">Crea categorías para organizar tus aplicaciones</p>
                  <Button 
                    className="mt-6"
                    onClick={() => setShowNewCategoryDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear categoría
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Dialogs */}
      {/* Nueva Categoría */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>
              Crea una nueva categoría para organizar tus aplicaciones.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nombre de la categoría</Label>
              <Input 
                id="category-name" 
                placeholder="Ej: Productividad, Diseño, Desarrollo..." 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewCategoryDialog(false);
                setNewCategoryName("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddCategory}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Editar Categoría */}
      <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>
              Modifica la información de la categoría.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Nombre de la categoría</Label>
              <Input 
                id="edit-category-name" 
                placeholder="Nombre de la categoría" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditCategoryDialog(false);
                setEditingCategory(null);
                setNewCategoryName("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateCategory}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Nueva Aplicación */}
      <Dialog open={showNewAppDialog} onOpenChange={setShowNewAppDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Aplicación</DialogTitle>
            <DialogDescription>
              Agrega una nueva aplicación a una categoría.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="app-category">Categoría</Label>
              <select 
                id="app-category"
                className="w-full border-neutral-300 rounded-md px-3 py-2"
                value={selectedCategoryId || ""}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-name">Nombre de la aplicación *</Label>
              <Input 
                id="app-name" 
                placeholder="Ej: Google Drive, Slack, Github..." 
                value={newAppData.name}
                onChange={(e) => setNewAppData({...newAppData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-url">URL de la aplicación *</Label>
              <Input 
                id="app-url" 
                placeholder="https://www.ejemplo.com" 
                value={newAppData.url}
                onChange={(e) => setNewAppData({...newAppData, url: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-icon">URL del icono</Label>
              <Input 
                id="app-icon" 
                placeholder="https://www.ejemplo.com/icon.png" 
                value={newAppData.icon}
                onChange={(e) => setNewAppData({...newAppData, icon: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-description">Descripción</Label>
              <Textarea 
                id="app-description" 
                placeholder="Breve descripción de la aplicación" 
                value={newAppData.description || ""}
                onChange={(e) => setNewAppData({...newAppData, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewAppDialog(false);
                setSelectedCategoryId(null);
                setNewAppData({
                  name: "",
                  icon: "",
                  url: "",
                  description: ""
                });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveNewApp}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Editar Aplicación */}
      <Dialog open={showEditAppDialog} onOpenChange={setShowEditAppDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Aplicación</DialogTitle>
            <DialogDescription>
              Modifica la información de la aplicación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-app-name">Nombre de la aplicación *</Label>
              <Input 
                id="edit-app-name" 
                placeholder="Nombre de la aplicación" 
                value={newAppData.name}
                onChange={(e) => setNewAppData({...newAppData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-app-url">URL de la aplicación *</Label>
              <Input 
                id="edit-app-url" 
                placeholder="https://www.ejemplo.com" 
                value={newAppData.url}
                onChange={(e) => setNewAppData({...newAppData, url: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-app-icon">URL del icono</Label>
              <Input 
                id="edit-app-icon" 
                placeholder="https://www.ejemplo.com/icon.png" 
                value={newAppData.icon}
                onChange={(e) => setNewAppData({...newAppData, icon: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-app-description">Descripción</Label>
              <Textarea 
                id="edit-app-description" 
                placeholder="Breve descripción de la aplicación" 
                value={newAppData.description || ""}
                onChange={(e) => setNewAppData({...newAppData, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditAppDialog(false);
                setEditingApp(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateApp}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmar Eliminar Categoría */}
      <Dialog open={showDeleteCategoryDialog} onOpenChange={setShowDeleteCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Categoría</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta categoría? Esta acción eliminará también todas las aplicaciones dentro de la categoría y no podrá deshacerse.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteCategoryDialog(false);
                setItemToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteCategory}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmar Eliminar Aplicación */}
      <Dialog open={showDeleteAppDialog} onOpenChange={setShowDeleteAppDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Aplicación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta aplicación? Esta acción no podrá deshacerse.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteAppDialog(false);
                setItemToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteApp}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}