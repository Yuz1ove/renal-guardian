import type { Patient } from "../types";

export const demoPatients: Patient[] = [
  {
    id: "P001",
    name: "侯冠宇",
    age: 67,
    dialysisDay: true,
    lastDialysisEndTime: "2026-06-29T18:20:00+08:00",
    baselineHeartRate: 76,
    baselineSystolicBP: 118,
    caregiverName: "陳怡君",
    room: "A-203"
  },
  {
    id: "P002",
    name: "林秀蘭",
    age: 74,
    dialysisDay: true,
    lastDialysisEndTime: "2026-06-29T13:10:00+08:00",
    baselineHeartRate: 72,
    baselineSystolicBP: 124,
    caregiverName: "張育誠",
    room: "B-118"
  },
  {
    id: "P003",
    name: "陳文德",
    age: 81,
    dialysisDay: false,
    lastDialysisEndTime: "2026-06-28T16:40:00+08:00",
    baselineHeartRate: 69,
    baselineSystolicBP: 130,
    caregiverName: "王明哲",
    room: "C-071"
  },
  {
    id: "P004",
    name: "黃美惠",
    age: 70,
    dialysisDay: true,
    lastDialysisEndTime: "2026-06-29T20:05:00+08:00",
    baselineHeartRate: 78,
    baselineSystolicBP: 116,
    caregiverName: "李佳蓉",
    room: "A-216"
  }
];
