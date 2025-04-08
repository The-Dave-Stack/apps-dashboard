import { useMutation, useQuery } from "@tanstack/react-query";
import { FirebaseUser, UserRole, updateUserRoleSchema, toggleUserStatusSchema, deleteUserSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export function useUserManagement() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Query para obtener la lista de usuarios
  const {
    data: users,
    isLoading,
    error
  } = useQuery<FirebaseUser[]>({
    queryKey: ['/api/users'],
    staleTime: 60 * 1000, // 1 minuto
  });
  
  // Mutación para actualizar el rol de un usuario
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: UserRole }) => {
      const validatedData = updateUserRoleSchema.parse({ userId, role });
      const res = await apiRequest("PATCH", `/api/users/${userId}/role`, { role: validatedData.role });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || t('users.roleUpdateError'));
      }
      
      return await res.json() as FirebaseUser;
    },
    onSuccess: () => {
      // Invalidar la consulta para refrescar la lista de usuarios
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      toast({
        title: t('users.roleUpdated'),
        description: t('users.roleUpdatedDesc'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('users.roleUpdateError'),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutación para deshabilitar/habilitar un usuario
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, disabled }: { userId: string, disabled: boolean }) => {
      const validatedData = toggleUserStatusSchema.parse({ userId, disabled });
      const res = await apiRequest("PATCH", `/api/users/${userId}/status`, { disabled: validatedData.disabled });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || t('users.statusUpdateError'));
      }
      
      return await res.json() as FirebaseUser;
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      const message = user.disabled 
        ? t('users.userDisabled') 
        : t('users.userEnabled');
      
      toast({
        title: t('users.statusUpdated'),
        description: message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('users.statusUpdateError'),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutación para eliminar un usuario
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const validatedData = deleteUserSchema.parse({ userId });
      const res = await apiRequest("DELETE", `/api/users/${validatedData.userId}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error;
        } catch (e) {
          errorMessage = errorText || t('users.deleteError');
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      toast({
        title: t('users.userDeleted'),
        description: t('users.userDeletedDesc'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('users.deleteError'),
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  return {
    // Datos
    users,
    isLoading,
    error,
    
    // Acciones de rol
    updateUserRole: updateUserRoleMutation.mutate,
    isUpdatingRole: updateUserRoleMutation.isPending,
    
    // Acciones de estado
    toggleUserStatus: toggleUserStatusMutation.mutate,
    isUpdatingStatus: toggleUserStatusMutation.isPending,
    
    // Acciones de eliminación
    deleteUser: deleteUserMutation.mutate,
    isDeleting: deleteUserMutation.isPending
  };
}