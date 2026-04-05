'use client'

import { type MenuOfDayResponse } from '@/domains/menu'

import { useMenuItems } from '../hooks/use-menu-items'
import { useUpdateMenu } from '../hooks/use-update-menu'
import { useMenuDraftStore } from '../stores/menu-draft.store'
import { MenuItemRow } from './menu-item-row'
import { MenuItemAddForm } from './menu-item-add-form'

// ─── Pre-publish: draft list ──────────────────────────────────────────────────

export function MenuDraftItemList() {
  const { data: catalogItems = [] } = useMenuItems()
  const { items: draftItems, addItem, editItem, removeItem, publishError } = useMenuDraftStore()

  const draftAsResponse = draftItems.map((d) => ({
    id: d.tempId,
    price: d.price,
    sideDishes: d.sideDishes,
    menuItem: { id: d.tempId, name: d.menuItemName },
  }))

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[600px] text-left">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Món</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3">Món ăn kèm</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {draftAsResponse.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">
                  Chưa có món nào. Thêm món bên dưới.
                </td>
              </tr>
            ) : (
              draftAsResponse.map((item, idx) => (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  onEdit={(patch) => editItem(draftItems[idx].tempId, patch)}
                  onRemove={() => removeItem(draftItems[idx].tempId)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      {publishError && <p className="mt-2 text-sm text-red-500">{publishError}</p>}
      <MenuItemAddForm
        catalogItems={catalogItems}
        onAdd={(item) =>
          addItem({
            menuItemName: item.menuItemName,
            price: item.price,
            sideDishes: item.sideDishes,
          })
        }
      />
    </div>
  )
}

// ─── Post-publish: DB-backed list ─────────────────────────────────────────────

type PublishedListProps = {
  menu: MenuOfDayResponse
  isReadOnly?: boolean
}

export function MenuPublishedItemList({ menu, isReadOnly = false }: PublishedListProps) {
  const { data: catalogItems = [] } = useMenuItems()
  const { mutate: updateMenu, isPending } = useUpdateMenu(menu.id)

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[600px] text-left">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Món</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3">Món ăn kèm</th>
              {!isReadOnly && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {menu.items.length === 0 ? (
              <tr>
                <td colSpan={isReadOnly ? 3 : 4} className="px-4 py-6 text-center text-sm text-gray-400">
                  Chưa có món nào.
                </td>
              </tr>
            ) : (
              menu.items.map((item) => (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  isReadOnly={isReadOnly}
                  onEdit={(patch) =>
                    updateMenu({
                      action: 'edit',
                      menuOfDayItemId: item.id,
                      price: patch.price,
                      sideDishes: patch.sideDishes ?? undefined,
                    })
                  }
                  onRemove={() => updateMenu({ action: 'remove', menuOfDayItemId: item.id })}
                  isEditPending={isPending}
                  isRemovePending={isPending}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      {!isReadOnly && (
        <MenuItemAddForm
          catalogItems={catalogItems}
          isPending={isPending}
          onAdd={(item) =>
            updateMenu({
              action: 'add',
              menuItemName: item.menuItemName,
              price: item.price,
              sideDishes: item.sideDishes ?? undefined,
            })
          }
        />
      )}
    </div>
  )
}
