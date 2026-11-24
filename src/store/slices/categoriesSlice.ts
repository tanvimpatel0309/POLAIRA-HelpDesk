import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Category } from '@/types';
import { seedCategories } from '@/data/seed';

interface CategoriesState {
  categories: Category[];
}

const initialState: CategoriesState = { categories: seedCategories };

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    addCategory(state, action: PayloadAction<{ name: string; description: string }>) {
      state.categories.push({
        id: `cat-${Date.now()}`,
        ...action.payload,
        createdAt: new Date().toISOString(),
      });
    },
    updateCategory(state, action: PayloadAction<{ id: string; name: string; description: string }>) {
      const c = state.categories.find((x) => x.id === action.payload.id);
      if (!c) return;
      c.name = action.payload.name;
      c.description = action.payload.description;
    },
    deleteCategory(state, action: PayloadAction<string>) {
      state.categories = state.categories.filter((c) => c.id !== action.payload);
    },
  },
});

export const { addCategory, updateCategory, deleteCategory } = categoriesSlice.actions;
export default categoriesSlice.reducer;
