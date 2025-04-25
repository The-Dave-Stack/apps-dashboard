/**
 * @fileoverview AppCard Component - Reusable application card
 * This component renders an individual card for each application,
 * including functionality to mark as favorite and record access history.
 * @module components/AppCard
 */

import { useEffect } from "react";
import { AppData } from "@/lib/types";
import { DEFAULT_ICON } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks";
import { useState } from "react";
import { doc, setDoc, deleteDoc, serverTimestamp, collection, getDoc } from "firebase/firestore";
import { getFirebaseInstances } from "@/lib/firebase-init";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

/**
 * Props for the AppCard component
 * @interface AppCardProps
 * @property {AppData} app - Application data to display
 * @property {React.ReactNode} [badge] - Optional element to display as a badge on the card
 * @property {boolean} [compact] - Indicates if the card should be displayed in compact mode
 */
interface AppCardProps {
  app: AppData;
  badge?: React.ReactNode;
  compact?: boolean;
}

/**
 * Component that displays an application card with functionality for
 * marking as favorite and recording usage history.
 *
 * @component
 * @param {AppCardProps} props - Component properties
 * @returns {JSX.Element} Rendered AppCard component
 */
export default function AppCard({ app, badge, compact }: AppCardProps) {
  const { user } = useAuth();
  const { db } = getFirebaseInstances();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * Effect to check if the application is in the current user's favorites
   */
  useEffect(() => {
    /**
     * Query Firestore to check if this app is marked as a favorite
     * @async
     */
    const checkIfFavorite = async () => {
      if (!user || !app.id) return;
      
      try {
        const favoriteRef = doc(collection(doc(db, "users", user.uid), "favorites"), app.id);
        const favoriteDoc = await getDoc(favoriteRef);
        
        setIsFavorite(favoriteDoc.exists());
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };
    
    checkIfFavorite();
  }, [user, app.id, db]);

  /**
   * Records user access to an application in Firestore
   * @async
   */
  const handleAppClick = async () => {
    if (user && app.id) {
      try {
        // Save to user history
        const historyRef = doc(collection(doc(db, "users", user.uid), "history"), app.id);
        await setDoc(historyRef, {
          lastAccessed: serverTimestamp()
        }, { merge: true });
        
        console.log(`Application ${app.name} recorded in history`);
      } catch (error) {
        console.error("Error recording access:", error);
      }
    }
  };

  /**
   * Toggles the favorite status of an application
   * @async
   * @param {React.MouseEvent} e - Click event
   */
  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents opening the link
    e.stopPropagation(); // Prevents event propagation
    
    if (!user || !app.id) {
      toast({
        title: t('common.favorites.loginRequired'),
        description: t('common.favorites.loginMessage'),
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      const favoriteRef = doc(collection(doc(db, "users", user.uid), "favorites"), app.id);
      
      if (isFavorite) {
        // Remove from favorites
        await deleteDoc(favoriteRef);
        setIsFavorite(false);
        toast({
          title: t('common.favorites.removedFromFavorites'),
          description: t('common.favorites.removeMessage', { name: app.name }),
        });
      } else {
        // Add to favorites
        await setDoc(favoriteRef, {
          addedAt: serverTimestamp()
        });
        setIsFavorite(true);
        toast({
          title: t('common.favorites.addedToFavorites'),
          description: t('common.favorites.addMessage', { name: app.name }),
        });
      }
    } catch (error) {
      console.error("Error managing favorite:", error);
      toast({
        title: t('common.favorites.error'),
        description: t('common.favorites.errorMessage'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card rounded-lg shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow h-full relative">
      {!compact && (
        <button 
          className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-colors ${
            isFavorite 
              ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={toggleFavorite}
          disabled={loading}
          aria-label={isFavorite ? t('common.favorites.removeFromFavorites') : t('common.favorites.addToFavorites')}
        >
          <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
        </button>
      )}
      
      <a 
        href={app.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={`block ${compact ? 'p-3' : 'p-4'} h-full`}
        onClick={handleAppClick}
      >
        <div className={`flex ${compact ? 'flex-row items-center gap-3 text-left' : 'flex-col items-center text-center'} h-full`}>
          <img 
            src={app.icon || DEFAULT_ICON} 
            alt={app.name} 
            className={`${compact ? 'w-10 h-10' : 'w-16 h-16 mb-3'} object-contain`}
            onError={(e) => (e.currentTarget.src = DEFAULT_ICON)}
          />
          <div className={compact ? 'flex-1' : ''}>
            <h3 className="font-medium text-card-foreground">{app.name}</h3>
            {badge && (
              <div className={`${compact ? 'mt-1' : 'mt-2'}`}>
                {badge}
              </div>
            )}
            {(!compact || app.description) && (
              <p className="text-xs text-muted-foreground mt-1 flex-grow">{app.description || ""}</p>
            )}
          </div>
        </div>
      </a>
    </Card>
  );
}
