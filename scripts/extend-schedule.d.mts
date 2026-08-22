export declare const HORIZON_DAYS: number
export declare function extendSchedule(existing: string[], dataset: { id: string; category: string }[], targetLength: number): string[]
export declare function daysRemaining(scheduleLength: number, todayDayNumber: number): number
export declare function daysSinceLaunch(today: Date, launch: Date): number
