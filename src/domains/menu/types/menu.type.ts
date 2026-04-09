export type ExternalDishItem = {
  name: string;
  orderUrl: string;
};

export type MenuOfDayItemResponse = {
  id: string;
  name: string;
  price: number;
  sideDishes: string | null;
};

export type MenuOfDayResponse = {
  id: string;
  date: string;
  isPublished: boolean;
  isLocked: boolean;
  items: MenuOfDayItemResponse[];
  externalDishes: ExternalDishItem[];
};

export type PrefillItem = {
  name: string;
  price: number;
  sideDishes: string | null;
};

export type TodayMenuResponse =
  | { status: 'exists'; menu: MenuOfDayResponse }
  | { status: 'prefill'; items: PrefillItem[] };

export type MenuSuggestion = {
  name: string;
  price: number;
};

export type TodayOrderItem = {
  id: string;
  quantity: number;
  isAutoOrder: boolean;
  employee: { id: string; name: string };
  menuOfDayItem: {
    id: string;
    name: string;
    price: number;
  };
};
