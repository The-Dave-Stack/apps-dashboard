import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { AppData, CategoryData } from "@/lib/types";

interface AdminAppFormProps {
  app: AppData | undefined;
  categoryId: string;
  categories: CategoryData[];
  onSave: (app: AppData, categoryId: string) => void;
  onCancel: () => void;
}

export default function AdminAppForm({ 
  app, 
  categoryId, 
  categories, 
  onSave, 
  onCancel 
}: AdminAppFormProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId);

  useEffect(() => {
    if (app) {
      setName(app.name);
      setIcon(app.icon);
      setUrl(app.url);
      setDescription(app.description || "");
    } else {
      setName("");
      setIcon("");
      setUrl("");
      setDescription("");
    }
    setSelectedCategoryId(categoryId);
  }, [app, categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !url.trim()) {
      return;
    }
    
    onSave({
      id: app?.id,
      name: name.trim(),
      icon: icon.trim(),
      url: url.trim(),
      description: description.trim()
    }, selectedCategoryId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="app-name">App Name</Label>
        <Input
          id="app-name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter app name"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="app-icon">Icon URL</Label>
        <Input
          id="app-icon" 
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="https://example.com/icon.png"
        />
        {icon && (
          <div className="mt-2 flex items-center">
            <span className="text-sm text-neutral-500 mr-2">Preview:</span>
            <img 
              src={icon} 
              alt="Icon preview" 
              className="h-8 w-8 object-contain"
              onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100?text=Invalid")}
            />
          </div>
        )}
      </div>
      
      <div>
        <Label htmlFor="app-url">App URL</Label>
        <Input
          id="app-url" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="app-description">Description (Optional)</Label>
        <Input
          id="app-description" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the app"
        />
      </div>
      
      <div>
        <Label htmlFor="app-category">Category</Label>
        <Select 
          value={selectedCategoryId} 
          onValueChange={setSelectedCategoryId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {app ? "Save Changes" : "Add App"}
        </Button>
      </div>
    </form>
  );
}
