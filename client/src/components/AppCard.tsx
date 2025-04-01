import { AppData } from "@/lib/types";
import { Card } from "@/components/ui/card";

interface AppCardProps {
  app: AppData;
}

export default function AppCard({ app }: AppCardProps) {
  return (
    <Card className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow h-full">
      <a href={app.url} target="_blank" rel="noopener noreferrer" className="block p-4 h-full">
        <div className="flex flex-col items-center text-center h-full">
          <img 
            src={app.icon} 
            alt={app.name} 
            className="w-16 h-16 mb-3 object-contain"
            onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100?text=No+Icon")}
          />
          <h3 className="font-medium text-neutral-800">{app.name}</h3>
          <p className="text-xs text-neutral-500 mt-1 flex-grow">{app.description || ""}</p>
        </div>
      </a>
    </Card>
  );
}
