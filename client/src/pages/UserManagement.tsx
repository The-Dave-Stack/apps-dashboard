import { useState } from "react";
import { 
  UserCog, 
  Users, 
  Shield, 
  AlertTriangle, 
  ChevronLeft,
  Loader2 
} from "lucide-react";
import { useUserManagement } from "@/hooks/use-user-management";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { UserRole, FirebaseUser } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";

export default function UserManagement() {
  const { users, isLoading, error, updateUserRole, isUpdating } = useUserManagement();
  const { t } = useTranslation();
  const [_, setLocation] = useLocation();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  
  // Función para manejar la actualización de rol
  const handleRoleUpdate = ({ userId, role }: { userId: string; role: UserRole }) => {
    setUpdatingUserId(userId);
    updateUserRole({ userId, role });
  };
  
  // Mostrar la interfaz de carga mientras se obtienen los usuarios
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">{t('users.management')}</h1>
            <p className="text-muted-foreground mt-1">{t('users.managementDesc')}</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
        
        <UserTableSkeleton />
      </div>
    );
  }
  
  // Mostrar mensaje de error si falla la carga
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">{t('users.management')}</h1>
            <p className="text-muted-foreground mt-1">{t('users.managementDesc')}</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('users.fetchError')}</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : t('common.unknownError')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t('users.management')}</h1>
          <p className="text-muted-foreground mt-1">{t('users.managementDesc')}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
      
      {users && users.length > 0 ? (
        <UserTable 
          users={users} 
          onUpdateRole={handleRoleUpdate} 
          isUpdating={isUpdating}
          updatingUserId={updatingUserId}
        />
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 mb-4 text-muted-foreground/60">
            <Users className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium text-foreground">{t('users.noUsers')}</h3>
          <p className="text-muted-foreground mt-2">{t('users.noUsersDesc')}</p>
        </div>
      )}
    </div>
  );
}

function UserTable({ 
  users, 
  onUpdateRole,
  isUpdating,
  updatingUserId
}: { 
  users: FirebaseUser[];
  onUpdateRole: (data: { userId: string; role: UserRole }) => void;
  isUpdating: boolean;
  updatingUserId: string | null;
}) {
  const { t } = useTranslation();
  
  // Función para obtener el avatar fallback (iniciales del usuario)
  const getInitials = (username: string, email: string): string => {
    if (username && username.length > 0) {
      return username.charAt(0).toUpperCase();
    }
    if (email && email.length > 0) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };
  
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-muted p-4 border-b border-border">
        <div className="grid grid-cols-10 gap-4 font-medium text-sm">
          <div className="col-span-1"></div>
          <div className="col-span-3">{t('users.username')}</div>
          <div className="col-span-3">{t('users.email')}</div>
          <div className="col-span-2">{t('users.role')}</div>
          <div className="col-span-1 text-right">{t('users.actions')}</div>
        </div>
      </div>
      
      <div className="divide-y divide-border">
        {users.map(user => (
          <div key={user.id} className="p-4 hover:bg-muted/40 transition-colors">
            <div className="grid grid-cols-10 gap-4 items-center">
              <div className="col-span-1">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user.username, user.email)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="col-span-3 truncate">
                <span className="font-medium">{user.username}</span>
              </div>
              
              <div className="col-span-3 truncate text-muted-foreground">
                {user.email}
              </div>
              
              <div className="col-span-2">
                <Badge variant={user.role === UserRole.ADMIN ? "default" : "secondary"} className="flex items-center w-fit">
                  {user.role === UserRole.ADMIN && <Shield className="h-3 w-3 mr-1" />}
                  {user.role === UserRole.ADMIN ? t('users.admin') : t('users.user')}
                </Badge>
              </div>
              
              <div className="col-span-1 text-right">
                <Select 
                  defaultValue={user.role}
                  onValueChange={(value) => onUpdateRole({ 
                    userId: user.id, 
                    role: value as UserRole 
                  })}
                  disabled={isUpdating && updatingUserId === user.id}
                >
                  <SelectTrigger className="w-28 h-8">
                    {isUpdating && updatingUserId === user.id ? (
                      <div className="flex items-center">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        <span className="text-xs">{t('common.updating')}</span>
                      </div>
                    ) : (
                      <SelectValue placeholder={t('users.selectRole')} />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.ADMIN}>{t('users.admin')}</SelectItem>
                    <SelectItem value={UserRole.USER}>{t('users.user')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserTableSkeleton() {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-muted p-4 border-b border-border">
        <div className="grid grid-cols-10 gap-4">
          <div className="col-span-1">
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="col-span-3">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="col-span-3">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="p-4">
            <div className="grid grid-cols-10 gap-4 items-center">
              <div className="col-span-1">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="col-span-3">
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="col-span-3">
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="col-span-1 text-right">
                <Skeleton className="h-8 w-24 ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}