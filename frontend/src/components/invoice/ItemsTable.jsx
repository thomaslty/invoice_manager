import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, X } from 'lucide-react';

export default function ItemsTable({
  items,
  onAddCategory,
  onRemoveCategory,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onUpdateCategoryName,
  onSetCurrency,
  grandTotal,
}) {
  const categories = items.categories;
  const hasMultipleCategories = categories.length > 1;

  return (
    <div className="space-y-4">
      {/* Currency */}
      <div className="space-y-1.5">
        <Label htmlFor="currency" className="text-sm">Currency</Label>
        <Input
          id="currency"
          value={items.currency}
          onChange={(e) => onSetCurrency(e.target.value)}
          placeholder="HK$"
          className="w-32"
        />
      </div>

      {/* Categories */}
      {categories.map((category, catIndex) => (
        <div
          key={catIndex}
          className="rounded-lg border border-border bg-background p-3 space-y-3"
        >
          {/* Category header */}
          <div className="flex items-center gap-2">
            {hasMultipleCategories && (
              <>
                <Input
                  value={category.name}
                  onChange={(e) => onUpdateCategoryName(catIndex, e.target.value)}
                  placeholder={`Category ${catIndex + 1} name`}
                  className="flex-1 font-medium"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveCategory(catIndex)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {!hasMultipleCategories && (
              <Input
                value={category.name}
                onChange={(e) => onUpdateCategoryName(catIndex, e.target.value)}
                placeholder="Category name (optional)"
                className="flex-1"
              />
            )}
          </div>

          {/* Items table */}
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium w-14">No</th>
                  <th className="px-2 py-1.5 text-left font-medium">Description</th>
                  <th className="px-2 py-1.5 text-left font-medium w-16">Qty</th>
                  <th className="px-2 py-1.5 text-right font-medium w-28">
                    Total ({items.currency})
                  </th>
                  <th className="w-9"></th>
                </tr>
              </thead>
              <tbody>
                {category.items.map((item, itemIndex) => (
                  <tr key={itemIndex} className="border-b border-border last:border-b-0">
                    <td className="px-1 py-1">
                      <Input
                        value={item.no}
                        onChange={(e) =>
                          onUpdateItem(catIndex, itemIndex, 'no', Number(e.target.value) || 0)
                        }
                        className="h-7 text-sm px-1.5"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          onUpdateItem(catIndex, itemIndex, 'description', e.target.value)
                        }
                        placeholder="Item description"
                        className="h-7 text-sm px-1.5"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        value={item.qty}
                        onChange={(e) =>
                          onUpdateItem(catIndex, itemIndex, 'qty', Number(e.target.value) || 0)
                        }
                        className="h-7 text-sm px-1.5"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        value={item.total}
                        onChange={(e) =>
                          onUpdateItem(catIndex, itemIndex, 'total', Number(e.target.value) || 0)
                        }
                        className="h-7 text-sm px-1.5 text-right"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveItem(catIndex, itemIndex)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add item button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddItem(catIndex)}
            className="w-full"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Item
          </Button>

          {/* Category subtotal (only if multiple categories) */}
          {hasMultipleCategories && (
            <div className="flex items-center justify-between px-2 pt-1 text-sm">
              <span className="text-muted-foreground font-medium">
                Subtotal{category.name ? ` — ${category.name}` : ''}
              </span>
              <span className="font-semibold">
                {items.currency}{' '}
                {category.items
                  .reduce((sum, item) => sum + (Number(item.total) || 0), 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Add category button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onAddCategory}
        className="w-full"
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Category
      </Button>

      {/* Grand total */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
        <span className="font-semibold">Grand Total</span>
        <span className="text-lg font-bold">
          {items.currency}{' '}
          {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
