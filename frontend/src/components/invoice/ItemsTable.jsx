import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CURRENCIES, CURRENCY_CODES, getCurrencySymbol } from '@/lib/currencies';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Plus, Trash2, X, GripVertical } from 'lucide-react';

function SortableItemRow({ id, item, itemIndex, catIndex, onUpdateItem, onRemoveItem, currencySymbol }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-border last:border-b-0">
      <td className="px-1 py-1 w-10">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-muted-foreground w-4 text-center">{itemIndex + 1}</span>
        </div>
      </td>
      <td className="px-1 py-1">
        <Input
          value={item.description}
          onChange={(e) => onUpdateItem(catIndex, itemIndex, 'description', e.target.value)}
          placeholder="Item description"
          className="h-7 text-sm px-1.5"
        />
      </td>
      <td className="px-1 py-1">
        <Input
          value={item.qty}
          onChange={(e) => onUpdateItem(catIndex, itemIndex, 'qty', Number(e.target.value) || 0)}
          className="h-7 text-sm px-1.5"
        />
      </td>
      <td className="px-1 py-1">
        <Input
          value={item.total}
          onChange={(e) => onUpdateItem(catIndex, itemIndex, 'total', Number(e.target.value) || 0)}
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
  );
}

export default function ItemsTable({
  items,
  onAddCategory,
  onRemoveCategory,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onUpdateCategoryName,
  onReorderItem,
  onSetCurrency,
  grandTotal,
  readOnly = false,
}) {
  const categories = items.categories;
  const hasMultipleCategories = categories.length > 1;
  const currencySymbol = getCurrencySymbol(items.currency);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  return (
    <div className="space-y-4">
      {/* Currency */}
      {!readOnly && (
        <div className="space-y-1.5">
          <Label className="text-sm">Currency</Label>
          <Select value={items.currency} onValueChange={onSetCurrency}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_CODES.map((code) => (
                <SelectItem key={code} value={code}>
                  {CURRENCIES[code].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Categories */}
      {categories.map((category, catIndex) => {
        const itemIds = category.items.map((item) => item.id);

        const handleDragEnd = (event) => {
          const { active, over } = event;
          if (!over || active.id === over.id) return;
          const fromIndex = itemIds.indexOf(active.id);
          const toIndex = itemIds.indexOf(over.id);
          if (fromIndex !== -1 && toIndex !== -1) {
            onReorderItem(catIndex, fromIndex, toIndex);
          }
        };

        return (
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
                    readOnly={readOnly}
                  />
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveCategory(catIndex)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
              {!hasMultipleCategories && (
                <Input
                  value={category.name}
                  onChange={(e) => onUpdateCategoryName(catIndex, e.target.value)}
                  placeholder="Category name (optional)"
                  className="flex-1"
                  readOnly={readOnly}
                />
              )}
            </div>

            {/* Items table */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                <div className="rounded-md border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-2 py-1.5 text-left font-medium w-14">No</th>
                        <th className="px-2 py-1.5 text-left font-medium">Description</th>
                        <th className="px-2 py-1.5 text-left font-medium w-16">Qty</th>
                        <th className="px-2 py-1.5 text-right font-medium w-28">
                          Total ({currencySymbol})
                        </th>
                        {!readOnly && <th className="w-9"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {category.items.map((item, itemIndex) => readOnly ? (
                        <tr key={item.id} className="border-b border-border last:border-b-0">
                          <td className="px-2 py-1.5 text-sm text-muted-foreground w-14">{itemIndex + 1}</td>
                          <td className="px-2 py-1.5 text-sm">{item.description}</td>
                          <td className="px-2 py-1.5 text-sm">{item.qty}</td>
                          <td className="px-2 py-1.5 text-sm text-right">{Number(item.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ) : (
                        <SortableItemRow
                          key={item.id}
                          id={item.id}
                          item={item}
                          itemIndex={itemIndex}
                          catIndex={catIndex}
                          onUpdateItem={onUpdateItem}
                          onRemoveItem={onRemoveItem}
                          currencySymbol={currencySymbol}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </SortableContext>
            </DndContext>

            {/* Add item button */}
            {!readOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddItem(catIndex)}
                className="w-full"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Item
              </Button>
            )}

            {/* Category subtotal (for named categories) */}
            {category.name && (
              <div className="flex items-center justify-between px-2 pt-1 text-sm">
                <span className="text-muted-foreground font-medium">
                  Subtotal — {category.name}
                </span>
                <span className="font-semibold">
                  {currencySymbol}
                  {category.items
                    .reduce((sum, item) => sum + (Number(item.total) || 0), 0)
                    .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Add category button */}
      {!readOnly && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAddCategory}
          className="w-full"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Category
        </Button>
      )}

      {/* Grand total */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
        <span className="font-semibold">Grand Total</span>
        <span className="text-lg font-bold">
          {currencySymbol}
          {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
