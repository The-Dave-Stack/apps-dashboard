import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryData } from "@/lib/types";

interface AdminCategoryFormProps {
  category: CategoryData | null;
  onSave: (category: { id?: string; name: string }) => void;
  onCancel: () => void;
}

export default function AdminCategoryForm({ category, onSave, onCancel }: AdminCategoryFormProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name);
    } else {
      setName("");
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }
    
    onSave({
      id: category?.id,
      name: name.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="category-name">Category Name</Label>
        <Input
          id="category-name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter category name"
          required
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {category ? "Save Changes" : "Add Category"}
        </Button>
      </div>
    </form>
  );
}
