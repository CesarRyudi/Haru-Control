import { create } from 'zustand';

interface OrderDraftItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface OrderDraftStore {
  items: OrderDraftItem[];
  customerId?: string;
  addItem: (item: OrderDraftItem) => void;
  updateItem: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  setCustomer: (customerId?: string) => void;
  clear: () => void;
  getTotalPrice: () => number;
}

export const useOrderDraft = create<OrderDraftStore>((set, get) => ({
  items: [],
  customerId: undefined,
  
  addItem: (item) =>
    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.productId === item.productId);
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += item.quantity;
        return { items: newItems };
      }
      return { items: [...state.items, item] };
    }),
  
  updateItem: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      ),
    })),
  
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    })),
  
  setCustomer: (customerId) => set({ customerId }),
  
  clear: () => set({ items: [], customerId: undefined }),
  
  getTotalPrice: () => {
    const state = get();
    return state.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  },
}));
