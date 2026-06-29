import { create } from 'zustand';

import { DEFAULT_EXPORT_OPTIONS } from '@/export/exportTypes';
import type { ExportJob, ExportOptions } from '@/export/exportTypes';

interface ExportStore {
  jobs: ExportJob[];
  options: ExportOptions;
  running: boolean;
  paused: boolean;
  targetDirectoryName: string | undefined;
  completedCount: number;
  failedCount: number;
  skippedCount: number;
  setOptions(options: Partial<ExportOptions>): void;
  setJobs(jobs: ExportJob[]): void;
  updateJob(job: ExportJob): void;
  setRunning(running: boolean): void;
  setPaused(paused: boolean): void;
  setTargetDirectoryName(name: string | undefined): void;
  resetJobs(): void;
}

export const useExportStore = create<ExportStore>((set) => ({
  jobs: [],
  options: DEFAULT_EXPORT_OPTIONS,
  running: false,
  paused: false,
  targetDirectoryName: undefined,
  completedCount: 0,
  failedCount: 0,
  skippedCount: 0,
  setOptions: (options) =>
    set((state) => ({ options: { ...state.options, ...options } })),
  setJobs: (jobs) =>
    set({
      jobs,
      completedCount: jobs.filter((job) => job.status === 'success').length,
      failedCount: jobs.filter((job) => job.status === 'failed').length,
      skippedCount: jobs.filter((job) => job.status === 'skipped').length
    }),
  updateJob: (job) =>
    set((state) => {
      const jobs = state.jobs.map((item) => (item.id === job.id ? job : item));
      return {
        jobs,
        completedCount: jobs.filter((item) => item.status === 'success').length,
        failedCount: jobs.filter((item) => item.status === 'failed').length,
        skippedCount: jobs.filter((item) => item.status === 'skipped').length
      };
    }),
  setRunning: (running) => set({ running }),
  setPaused: (paused) => set({ paused }),
  setTargetDirectoryName: (targetDirectoryName) => set({ targetDirectoryName }),
  resetJobs: () =>
    set({
      jobs: [],
      running: false,
      paused: false,
      targetDirectoryName: undefined,
      completedCount: 0,
      failedCount: 0,
      skippedCount: 0
    })
}));
