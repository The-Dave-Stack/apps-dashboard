import { useMutation, useQuery } from "@tanstack/react-query";
import { FirebaseUser, UserRole, updateUserRoleSchema } from "@shared/schema";
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
  
  return {
    users,
    isLoading,
    error,
    updateUserRole: updateUserRoleMutation.mutate,
    isUpdating: updateUserRoleMutation.isPending
  };
}