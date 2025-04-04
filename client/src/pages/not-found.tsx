import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('notFound.title')}
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t('notFound.description')}
          </p>
          
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            {t('notFound.suggestionRouteMissing')}
          </p>
          
          <div className="mt-6 text-center">
            <Link href="/">
              <Button className="inline-flex items-center gap-2">
                <Home className="h-4 w-4" />
                {t('notFound.backToHome')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
