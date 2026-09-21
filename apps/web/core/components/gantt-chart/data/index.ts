/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// types
import type { WeekMonthDataType, ChartDataType, TGanttViews } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";

// constants
export const generateWeeks = (startOfWeek: EStartOfTheWeek = EStartOfTheWeek.SUNDAY): WeekMonthDataType[] => [
  ...weeks.slice(startOfWeek),
  ...weeks.slice(0, startOfWeek),
];

export const weeks: WeekMonthDataType[] = [
  { key: 0, shortTitle: "Sun", title: "Sunday", abbreviation: "Sun" },
  { key: 1, shortTitle: "Mon", title: "Monday", abbreviation: "Mon" },
  { key: 2, shortTitle: "Tue", title: "Tuesday", abbreviation: "Tue" },
  { key: 3, shortTitle: "Wed", title: "Wednesday", abbreviation: "Wed" },
  { key: 4, shortTitle: "Thu", title: "Thursday", abbreviation: "Thu" },
  { key: 5, shortTitle: "Fri", title: "Friday", abbreviation: "Fri" },
  { key: 6, shortTitle: "Sat", title: "Saturday", abbreviation: "Sat" },
];

export const months: WeekMonthDataType[] = [
  { key: 0, shortTitle: "Jan", title: "January", abbreviation: "Jan" },
  { key: 1, shortTitle: "Feb", title: "February", abbreviation: "Feb" },
  { key: 2, shortTitle: "Mar", title: "March", abbreviation: "Mar" },
  { key: 3, shortTitle: "Apr", title: "April", abbreviation: "Apr" },
  { key: 4, shortTitle: "May", title: "May", abbreviation: "May" },
  { key: 5, shortTitle: "Jun", title: "June", abbreviation: "Jun" },
  { key: 6, shortTitle: "Jul", title: "July", abbreviation: "Jul" },
  { key: 7, shortTitle: "Aug", title: "August", abbreviation: "Aug" },
  { key: 8, shortTitle: "Sep", title: "September", abbreviation: "Sep" },
  { key: 9, shortTitle: "Oct", title: "October", abbreviation: "Oct" },
  { key: 10, shortTitle: "Nov", title: "November", abbreviation: "Nov" },
  { key: 11, shortTitle: "Dec", title: "December", abbreviation: "Dec" },
];

export const quarters: WeekMonthDataType[] = [
  { key: 0, shortTitle: "Q1", title: "Jan - Mar", abbreviation: "Q1" },
  { key: 1, shortTitle: "Q2", title: "Apr - Jun", abbreviation: "Q2" },
  { key: 2, shortTitle: "Q3", title: "Jul - Sep", abbreviation: "Q3" },
  { key: 3, shortTitle: "Q4", title: "Oct - Dec", abbreviation: "Q4" },
];

export const charCapitalize = (word: string) => `${word.charAt(0).toUpperCase()}${word.substring(1)}`;

export const bindZero = (value: number) => (value > 9 ? `${value}` : `0${value}`);

/** Time in 24-hour format — AM/PM is not used here. */
export const timePreview = (date: Date) => `${bindZero(date.getHours())}:${bindZero(date.getMinutes())}`;

export const datePreview = (date: Date, includeTime: boolean = false) => {
  const day = date.getDate();
  let month: number | WeekMonthDataType = date.getMonth();
  month = months[month];
  const year = date.getFullYear();

  // Ordem brasileira: dia, mês, ano.
  return `${day} ${month?.shortTitle} ${year}${includeTime ? `, ${timePreview(date)}` : ``}`;
};

// context data
export const VIEWS_LIST: ChartDataType[] = [
  {
    key: "week",
    i18n_title: "common.week",
    data: {
      startDate: new Date(),
      currentDate: new Date(),
      endDate: new Date(),
      approxFilterRange: 4, // it will preview week dates with weekends highlighted with 1 week limitations ex: title (Wed 1, Thu 2, Fri 3)
      dayWidth: 60,
    },
  },
  {
    key: "month",
    i18n_title: "common.month",
    data: {
      startDate: new Date(),
      currentDate: new Date(),
      endDate: new Date(),
      approxFilterRange: 6, // it will preview monthly all dates with weekends highlighted with no limitations ex: title (1, 2, 3)
      dayWidth: 20,
    },
  },
  {
    key: "quarter",
    i18n_title: "common.quarter",
    data: {
      startDate: new Date(),
      currentDate: new Date(),
      endDate: new Date(),
      approxFilterRange: 24, // it will preview week starting dates all months data and there is 3 months limitation for preview ex: title (2, 9, 16, 23, 30)
      dayWidth: 5,
    },
  },
];

export const currentViewDataWithView = (view: TGanttViews = "month") =>
  VIEWS_LIST.find((_viewData) => _viewData.key === view);
