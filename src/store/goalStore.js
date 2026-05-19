import { create } from 'zustand';
import { goalSheetService, goalService, checkInService, masterService } from '@/services/api';

const useGoalStore = create((set, get) => ({
  // State
  currentSheet: null,
  goals: [],
  sharedGoals: [],
  allSheets: [],
  thrustAreas: [],
  currentQuarter: null,
  checkins: {},       // { [goalId]: [...checkins] }
  notifications: [],
  isLoading: false,
  isSaving: false,
  error: null,

  // ============================================================
  // GOAL SHEET ACTIONS
  // ============================================================

  fetchCurrentSheet: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await goalSheetService.getCurrent();
      set({
        currentSheet: data.sheet,
        goals: data.goals || [],
        sharedGoals: data.sharedGoals || [],
        currentQuarter: data.quarter,
        isLoading: false,
      });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.error || 'Failed to fetch goal sheet' });
      return null;
    }
  },

  fetchAllSheets: async () => {
    try {
      const { data } = await goalSheetService.getAll();
      set({ allSheets: data });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch goal sheets' });
      return [];
    }
  },

  fetchSheetById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await goalSheetService.getById(id);
      set({ currentSheet: data, goals: data.goals || [], isLoading: false });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.error || 'Failed to fetch goal sheet' });
      return null;
    }
  },

  createDraftSheet: async () => {
    set({ isSaving: true, error: null });
    try {
      const { data } = await goalSheetService.create();
      // Refetch
      await get().fetchCurrentSheet();
      set({ isSaving: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create goal sheet';
      // If already exists, try to fetch current
      if (err.response?.status === 409) {
        await get().fetchCurrentSheet();
      }
      set({ isSaving: false, error: msg });
      return null;
    }
  },

  submitSheet: async (sheetId) => {
    set({ isSaving: true, error: null });
    try {
      const { data } = await goalSheetService.submit(sheetId);
      // Refetch
      await get().fetchCurrentSheet();
      set({ isSaving: false });
      return data;
    } catch (err) {
      set({ isSaving: false, error: err.response?.data?.error || 'Failed to submit' });
      return null;
    }
  },

  // ============================================================
  // GOAL CRUD
  // ============================================================

  addGoal: async (goalData) => {
    set({ isSaving: true, error: null });
    try {
      const { data } = await goalService.create(goalData);
      set((s) => ({ goals: [...s.goals, data], isSaving: false }));
      return data;
    } catch (err) {
      set({ isSaving: false, error: err.response?.data?.error || 'Failed to add goal' });
      return null;
    }
  },

  updateGoal: async (goalId, updates) => {
    set({ isSaving: true, error: null });
    try {
      const { data } = await goalService.update(goalId, updates);
      set((s) => ({
        goals: s.goals.map(g => g.id === goalId ? data : g),
        isSaving: false,
      }));
      return data;
    } catch (err) {
      set({ isSaving: false, error: err.response?.data?.error || 'Failed to update goal' });
      return null;
    }
  },

  deleteGoal: async (goalId) => {
    set({ isSaving: true, error: null });
    try {
      await goalService.delete(goalId);
      set((s) => ({
        goals: s.goals.filter(g => g.id !== goalId),
        isSaving: false,
      }));
      return true;
    } catch (err) {
      set({ isSaving: false, error: err.response?.data?.error || 'Failed to delete goal' });
      return false;
    }
  },

  // ============================================================
  // CHECK-INS
  // ============================================================

  fetchCheckins: async (goalId) => {
    try {
      const { data } = await checkInService.getByGoal(goalId);
      set((s) => ({ checkins: { ...s.checkins, [goalId]: data } }));
      return data;
    } catch (err) {
      return [];
    }
  },

  createCheckin: async (checkinData) => {
    set({ isSaving: true, error: null });
    try {
      const { data } = await checkInService.create(checkinData);
      // Refresh the goal's checkins
      await get().fetchCheckins(checkinData.goalId);
      // Also refresh the goal sheet to get updated achievement
      if (get().currentSheet) {
        await get().fetchCurrentSheet();
      }
      set({ isSaving: false });
      return data;
    } catch (err) {
      set({ isSaving: false, error: err.response?.data?.error || 'Failed to save check-in' });
      return null;
    }
  },

  updateCheckin: async (checkinId, data) => {
    set({ isSaving: true, error: null });
    try {
      await checkInService.update(checkinId, data);
      // Refresh
      if (get().currentSheet) {
        await get().fetchCurrentSheet();
      }
      set({ isSaving: false });
      return true;
    } catch (err) {
      set({ isSaving: false, error: err.response?.data?.error || 'Failed to update check-in' });
      return false;
    }
  },

  // ============================================================
  // MASTER DATA
  // ============================================================

  fetchThrustAreas: async () => {
    try {
      const { data } = await masterService.getThrustAreas();
      set({ thrustAreas: data });
      return data;
    } catch { return []; }
  },

  fetchNotifications: async () => {
    try {
      const { data } = await masterService.getNotifications();
      set({ notifications: data });
      return data;
    } catch { return []; }
  },

  // Helpers
  clearError: () => set({ error: null }),
  reset: () => set({
    currentSheet: null, goals: [], sharedGoals: [], allSheets: [],
    checkins: {}, isLoading: false, isSaving: false, error: null,
  }),
}));

export default useGoalStore;
