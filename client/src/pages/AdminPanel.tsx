import { useState, useEffect } from "react";
import { 
  Pencil,
  Trash,
  Plus,
  PlusCircle,
  Save,
  FolderPlus,
  AppWindow,
  Loader,
  AlertTriangle,
  Shield,
  AlertCircle,
  RefreshCw,
  Settings,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AppData, CategoryData } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DEFAULT_ICON } from "@/lib/utils";
import { 
  fetchCategories, 
  saveCategory, 
  deleteCategory, 
  saveApp, 
  deleteApp 
} from "@/lib/firebase";
import { checkFirebaseConnection } from "@/lib/firebase-check";
import { AppConfig, getAppConfig, updateAppConfig } from "@/lib/appConfig";
import { useTranslation } from "react-i18next";

export default function AdminPanel() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
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
  
  // Estado para la configuración de la aplicación
  const [appConfig, setAppConfig] = useState<AppConfig>({
    showRegisterTab: true
  });
  
  // Estado para la verificación de Firebase
  const [firebaseStatus, setFirebaseStatus] = useState<{
    connection: boolean;
    read: boolean;
    write: boolean;
    error?: string;
    lastChecked: Date | null;
    checking: boolean;
  }>({
    connection: false,
    read: false,
    write: false,
    lastChecked: null,
    checking: false
  });
  
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

  // Usamos el usuario simulado ya que hemos eliminado la autenticación
  const effectiveUser = mockUser;
  
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

  // Función para verificar la conexión a Firebase
  const checkFirebaseStatus = async () => {
    try {
      setFirebaseStatus(prev => ({ ...prev, checking: true }));
      
      const status = await checkFirebaseConnection();
      
      setFirebaseStatus({
        ...status,
        checking: false,
        lastChecked: new Date()
      });
      
      if (!status.connection) {
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar a Firebase. Verifique su conexión a internet.",
          variant: "destructive"
        });
        return false;
      }
      
      if (!status.write) {
        toast({
          title: "Error de permisos",
          description: status.error || "No se pudo escribir en Firebase. Verifique las reglas de seguridad.",
          variant: "destructive"
        });
        return false;
      }
      
      if (status.connection && status.read && status.write) {
        toast({
          title: "Conexión exitosa",
          description: "La conexión a Firebase está funcionando correctamente.",
        });
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error("Error al verificar Firebase:", error);
      setFirebaseStatus(prev => ({ 
        ...prev, 
        checking: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : "Error desconocido"
      }));
      
      toast({
        title: "Error",
        description: "Ocurrió un error al verificar la conexión a Firebase.",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Primero verificamos la conexión a Firebase
        await checkFirebaseStatus();
        
        // Luego intentamos cargar las categorías
        const data = await fetchCategories();
        setCategories(data);
        
        // Cargar la configuración de la aplicación
        try {
          const config = await getAppConfig();
          setAppConfig(config);
          console.log("[AdminPanel] Configuración cargada:", config);
        } catch (configError) {
          console.error("Error al cargar la configuración:", configError);
        }
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
    
    loadInitialData();
  }, [toast]);
  
  // Manejador para actualizar la configuración
  const handleToggleRegisterTab = async (show: boolean) => {
    try {
      setLoading(true);
      
      // Verificar conexión a Firebase
      const firebaseReady = await checkFirebaseStatus();
      if (!firebaseReady) {
        toast({
          title: "Error de Firebase",
          description: "No se puede actualizar la configuración porque no hay conexión a Firebase o no se tienen los permisos necesarios.",
          variant: "destructive"
        });
        return;
      }
      
      // Actualizar la configuración
      const updatedConfig = await updateAppConfig({ showRegisterTab: show });
      setAppConfig(updatedConfig);
      
      toast({
        title: "Configuración actualizada",
        description: `La pestaña de registro ha sido ${show ? 'activada' : 'desactivada'}`
      });
    } catch (error) {
      console.error("Error al actualizar la configuración:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración. Inténtalo de nuevo más tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
      // Primero verificamos la conexión a Firebase
      const firebaseReady = await checkFirebaseStatus();
      
      // Si no hay conexión a Firebase, no continuamos
      if (!firebaseReady) {
        toast({
          title: "Error de Firebase",
          description: "No se puede guardar la categoría porque no hay conexión a Firebase o no se tienen los permisos necesarios.",
          variant: "destructive"
        });
        return;
      }
      
      // Crear nueva categoría en Firebase
      const newCategory: CategoryData = {
        id: "", // Firebase asignará el ID
        name: newCategoryName,
        apps: []
      };
      
      console.log("[AdminPanel] Intentando guardar categoría:", newCategory);
      const savedCategory = await saveCategory(newCategory);
      console.log("[AdminPanel] Categoría guardada con éxito:", savedCategory);
      
      // Actualizar el estado con los datos desde Firebase
      setCategories([...categories, savedCategory]);
      
      toast({
        title: "Categoría creada",
        description: `Se ha creado la categoría ${newCategory.name}`,
      });
      
      // Cerramos el diálogo y limpiamos campos
      setNewCategoryName("");
      setShowNewCategoryDialog(false);
    } catch (error) {
      console.error("Error al crear categoría:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría. Inténtalo de nuevo más tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
      // Si no se proporciona un icono, intentar obtenerlo automáticamente
      let appIcon = newAppData.icon;
      if (!appIcon || appIcon.trim() === "") {
        toast({
          title: "Buscando icono...",
          description: "Intentando obtener el icono automáticamente, esto puede tardar unos segundos",
        });
        
        // Importamos aquí para evitar problemas circulares
        const { getIconForUrl } = await import("@/lib/utils");
        appIcon = await getIconForUrl(newAppData.url);
      }
      
      // Crear nueva app en Firebase
      const newApp: AppData = {
        id: "", // Firebase asignará el ID
        name: newAppData.name,
        icon: appIcon,
        url: newAppData.url,
        description: newAppData.description
      };
      
      const savedApp = await saveApp(newApp, selectedCategoryId);
      
      // Actualizar el estado local
      const updatedCategories = categories.map(cat => {
        if (cat.id === selectedCategoryId) {
          return {
            ...cat,
            apps: [...cat.apps, savedApp]
          };
        }
        return cat;
      });
      
      setCategories(updatedCategories);
      
      toast({
        title: "Aplicación creada",
        description: `Se ha creado la aplicación ${newApp.name}`,
      });
      
      // Cerramos el diálogo y limpiamos campos
      setNewAppData({
        name: "",
        icon: "",
        url: "",
        description: ""
      });
      setShowNewAppDialog(false);
    } catch (error) {
      console.error("Error al crear aplicación:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la aplicación. Inténtalo de nuevo más tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
      // Si el icono ha cambiado o está vacío, intentar obtenerlo automáticamente
      let appIcon = newAppData.icon;
      if (appIcon !== editingApp.app.icon && (!appIcon || appIcon.trim() === "")) {
        toast({
          title: "Buscando icono...",
          description: "Intentando obtener el icono automáticamente, esto puede tardar unos segundos",
        });
        
        // Importamos aquí para evitar problemas circulares
        const { getIconForUrl } = await import("@/lib/utils");
        appIcon = await getIconForUrl(newAppData.url);
      }
      
      // Actualizar app en Firebase
      const updatedApp: AppData = { 
        ...editingApp.app,
        name: newAppData.name,
        icon: appIcon,
        url: newAppData.url,
        description: newAppData.description
      };
      
      await saveApp(editingApp.categoryId, updatedApp);
      
      // Actualizar el estado local
      const updatedCategories = categories.map(cat => {
        if (cat.id === editingApp.categoryId) {
          return {
            ...cat,
            apps: cat.apps.map(app => 
              app.id === editingApp.app.id ? updatedApp : app
            )
          };
        }
        return cat;
      });
      
      setCategories(updatedCategories);
      
      toast({
        title: "Aplicación actualizada",
        description: `Se ha actualizado la aplicación ${updatedApp.name}`,
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
      setNewAppData({
        name: "",
        icon: "",
        url: "",
        description: ""
      });
    }
  };
  
  const handleDeleteApp = (appId: string, categoryId: string) => {
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
      // Eliminar app de Firebase
      await deleteApp(itemToDelete.categoryId, itemToDelete.id);
      
      // Actualizar el estado local
      const updatedCategories = categories.map(cat => {
        if (cat.id === itemToDelete.categoryId) {
          return {
            ...cat,
            apps: cat.apps.filter(app => app.id !== itemToDelete.id)
          };
        }
        return cat;
      });
      
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
    <div className="space-y-6">
      {/* Admin Panel Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t('admin.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('admin.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddApp}>
            <AppWindow className="mr-2 h-4 w-4" />
            {t('admin.apps.newApp')}
          </Button>
          <Button onClick={() => setShowNewCategoryDialog(true)} variant="outline">
            <FolderPlus className="mr-2 h-4 w-4" />
            {t('admin.categories.createCategory')}
          </Button>
        </div>
      </div>
      
      {/* Estado de Firebase */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold mb-4">{t('admin.statusHeader')}</h2>
          <Button 
            onClick={checkFirebaseStatus} 
            disabled={firebaseStatus.checking}
            variant="outline"
            className="flex items-center"
          >
            {firebaseStatus.checking ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('admin.verifyFirebase')}
              </>
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-lg border ${firebaseStatus.connection ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-950/30' : 'border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-950/30'}`}>
            <div className="flex items-center">
              {firebaseStatus.connection ? (
                <Shield className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
              )}
              <h3 className="font-medium text-foreground">{t('admin.firebaseConnection')}</h3>
            </div>
            <p className={`text-sm mt-1 ${firebaseStatus.connection ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {firebaseStatus.connection ? t('admin.connected') : t('admin.disconnected')}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg border ${firebaseStatus.read ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-950/30' : 'border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-950/30'}`}>
            <div className="flex items-center">
              {firebaseStatus.read ? (
                <Shield className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
              )}
              <h3 className="font-medium text-foreground">{t('admin.readPermissions')}</h3>
            </div>
            <p className={`text-sm mt-1 ${firebaseStatus.read ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {firebaseStatus.read ? t('admin.available') : t('admin.notAvailable')}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg border ${firebaseStatus.write ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-950/30' : 'border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-950/30'}`}>
            <div className="flex items-center">
              {firebaseStatus.write ? (
                <Shield className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
              )}
              <h3 className="font-medium text-foreground">{t('admin.writePermissions')}</h3>
            </div>
            <p className={`text-sm mt-1 ${firebaseStatus.write ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {firebaseStatus.write ? t('admin.available') : t('admin.notAvailable')}
            </p>
          </div>
        </div>
        
        {firebaseStatus.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('admin.firebaseError')}</AlertTitle>
            <AlertDescription>
              {firebaseStatus.error}
            </AlertDescription>
          </Alert>
        )}
        
        {!firebaseStatus.write && (
          <Alert className="mb-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 text-amber-800 dark:text-amber-400" />
            <AlertTitle>{t('admin.securityRules')}</AlertTitle>
            <AlertDescription className="dark:text-amber-300">
              {t('admin.securityRulesDescription')}
              <pre className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/50 rounded text-xs overflow-x-auto dark:text-amber-200">
                {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
              </pre>
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Configuración de la aplicación */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold mb-4">{t('admin.configHeader')}</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => window.open("/admin/users", "_self")}>
              <Users className="mr-2 h-4 w-4" />
              {t('admin.manageUsers')}
            </Button>
            <Button 
              onClick={async () => {
                try {
                  const updatedConfig = await updateAppConfig(appConfig);
                  setAppConfig(updatedConfig);
                  toast({
                    title: "Configuración actualizada",
                    description: "La configuración se ha guardado correctamente",
                    variant: "default"
                  });
                } catch (error) {
                console.error("Error al guardar la configuración:", error);
                toast({
                  title: "Error",
                  description: "No se pudo guardar la configuración. Inténtalo de nuevo más tarde.",
                  variant: "destructive"
                });
              }
            }}
            variant="outline"
            className="flex items-center"
          >
            <Save className="mr-2 h-4 w-4" />
            {t('admin.saveConfig')}
          </Button>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{t('admin.showRegisterTab')}</h3>
              <p className="text-sm text-muted-foreground">{t('admin.showRegisterTabDesc')}</p>
            </div>
            <Switch 
              checked={appConfig.showRegisterTab} 
              onCheckedChange={(checked) => setAppConfig({...appConfig, showRegisterTab: checked})}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loader className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2 text-muted-foreground">{t('admin.loadingData')}</span>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.length > 0 ? (
            categories.map(category => (
              <div key={category.id} className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 bg-muted border-b border-border flex justify-between items-center">
                  <h2 className="text-lg font-medium text-card-foreground">{category.name}</h2>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-foreground"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 dark:text-red-400"
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
                        <div key={app.id} className="flex border border-border rounded-lg overflow-hidden">
                          <div className="w-16 h-16 bg-muted flex items-center justify-center p-2">
                            <img 
                              src={app.icon || DEFAULT_ICON} 
                              alt={app.name} 
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => (e.currentTarget.src = DEFAULT_ICON)}
                            />
                          </div>
                          <div className="flex-1 p-3">
                            <div className="flex justify-between">
                              <h3 className="font-medium text-card-foreground">{app.name}</h3>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 text-foreground"
                                  onClick={() => handleEditApp(app, category.id)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 text-red-600 dark:text-red-400"
                                  onClick={() => app.id && handleDeleteApp(app.id, category.id)}
                                >
                                  <Trash className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{app.url}</p>
                            <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-1">{app.description}</p>
                          </div>
                        </div>
                      ))}
                      <div 
                        className="border border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setShowNewAppDialog(true);
                        }}
                      >
                        <PlusCircle className="h-8 w-8 mb-2" />
                        <p>{t('admin.apps.addAppTo', {category: category.name})}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">{t('admin.categories.noApps')}</p>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setShowNewAppDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('admin.apps.addApp')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 mb-4 text-muted-foreground/60">
                <AlertTriangle className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-foreground">{t('admin.noCategories')}</h3>
              <p className="text-muted-foreground mt-2">{t('admin.createCategoriesHint')}</p>
              <Button 
                className="mt-6"
                onClick={() => setShowNewCategoryDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.createCategory')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      {/* Nueva Categoría */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.categories.createCategory')}</DialogTitle>
            <DialogDescription>
              {t('admin.categories.createCategoryPrompt')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="category-name">{t('admin.categories.categoryName')}</Label>
              <Input 
                id="category-name" 
                placeholder={t('admin.categories.categoryNamePlaceholder')}
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
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddCategory}>{t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Editar Categoría */}
      <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.categories.editCategory')}</DialogTitle>
            <DialogDescription>
              {t('admin.categories.modify')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">{t('admin.categories.categoryName')}</Label>
              <Input 
                id="edit-category-name" 
                placeholder={t('admin.categories.categoryName')}
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
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdateCategory}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmar Eliminar Categoría */}
      <Dialog open={showDeleteCategoryDialog} onOpenChange={setShowDeleteCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.categories.deleteCategory')}</DialogTitle>
            <DialogDescription>
              {t('admin.categories.deleteConfirmation')}
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
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteCategory}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Nueva App */}
      <Dialog open={showNewAppDialog} onOpenChange={setShowNewAppDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('admin.apps.newApp')}</DialogTitle>
            <DialogDescription>
              {t('admin.apps.addAppDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="app-category">{t('admin.apps.selectCategory')}</Label>
              <select 
                id="app-category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedCategoryId || ""}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                <option value="" disabled>{t('admin.apps.selectCategory')}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="app-name">{t('admin.apps.appName')} *</Label>
              <Input 
                id="app-name" 
                placeholder={t('admin.apps.appNamePlaceholder')} 
                value={newAppData.name}
                onChange={(e) => setNewAppData({...newAppData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="app-url">URL *</Label>
              <Input 
                id="app-url" 
                placeholder={t('admin.apps.urlPlaceholder')} 
                value={newAppData.url}
                onChange={(e) => setNewAppData({...newAppData, url: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">{t('admin.apps.autoIconInfo')}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="app-icon">{t('admin.apps.iconUrl')} ({t('common.optional')})</Label>
              <Input 
                id="app-icon" 
                placeholder={t('admin.apps.iconUrlPlaceholder')} 
                value={newAppData.icon}
                onChange={(e) => setNewAppData({...newAppData, icon: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="app-description">{t('admin.apps.description')} ({t('common.optional')})</Label>
              <Textarea 
                id="app-description" 
                placeholder={t('admin.apps.descriptionPlaceholder')} 
                value={newAppData.description}
                onChange={(e) => setNewAppData({...newAppData, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewAppDialog(false);
                setNewAppData({
                  name: "",
                  icon: "",
                  url: "",
                  description: ""
                });
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveNewApp}>{t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Editar App */}
      <Dialog open={showEditAppDialog} onOpenChange={setShowEditAppDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('admin.apps.editApp')}</DialogTitle>
            <DialogDescription>
              {t('admin.apps.editAppDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-app-name">{t('admin.apps.appName')} *</Label>
              <Input 
                id="edit-app-name" 
                placeholder={t('admin.apps.appNamePlaceholder')} 
                value={newAppData.name}
                onChange={(e) => setNewAppData({...newAppData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-app-url">URL *</Label>
              <Input 
                id="edit-app-url" 
                placeholder={t('admin.apps.urlPlaceholder')} 
                value={newAppData.url}
                onChange={(e) => setNewAppData({...newAppData, url: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">{t('admin.apps.autoIconInfo')}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-app-icon">{t('admin.apps.iconUrl')} ({t('common.optional')})</Label>
              <Input 
                id="edit-app-icon" 
                placeholder={t('admin.apps.iconUrlPlaceholder')} 
                value={newAppData.icon}
                onChange={(e) => setNewAppData({...newAppData, icon: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-app-description">{t('admin.apps.description')} ({t('common.optional')})</Label>
              <Textarea 
                id="edit-app-description" 
                placeholder={t('admin.apps.descriptionPlaceholder')} 
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
                setNewAppData({
                  name: "",
                  icon: "",
                  url: "",
                  description: ""
                });
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdateApp}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmar Eliminar App */}
      <Dialog open={showDeleteAppDialog} onOpenChange={setShowDeleteAppDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.apps.deleteApp')}</DialogTitle>
            <DialogDescription>
              {t('admin.apps.deleteConfirmation')}
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
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteApp}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}