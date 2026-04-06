export type DraftItem = {
  tempId: string;
  name: string;
  price: number;
  sideDishes: string;
};

export type PublishMenuInput = {
  items: {
    name: string;
    price: number;
    sideDishes?: string;
  }[];
};

export type SaveMenuItemsInput = {
  items: {
    name: string;
    price: number;
    sideDishes?: string;
  }[];
};

export type SaveMenuItemsBlockedError = {
  error: 'blocked';
  blockedNames: string[];
};
