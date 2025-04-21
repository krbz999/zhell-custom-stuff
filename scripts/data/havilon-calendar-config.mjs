const days = [
  {
    name: "ZHELL.CALENDAR.DAYS.ardere",
    abbreviation: "ZHELL.CALENDAR.DAYS.ardereAbbr",
    ordinal: 1,
  },
  {
    name: "ZHELL.CALENDAR.DAYS.claudere",
    abbreviation: "ZHELL.CALENDAR.DAYS.claudereAbbr",
    ordinal: 2,
  },
  {
    name: "ZHELL.CALENDAR.DAYS.canere",
    abbreviation: "ZHELL.CALENDAR.DAYS.canereAbbr",
    ordinal: 3,
  },
  {
    name: "ZHELL.CALENDAR.DAYS.saltare",
    abbreviation: "ZHELL.CALENDAR.DAYS.saltareAbbr",
    ordinal: 4,
  },
  {
    name: "ZHELL.CALENDAR.DAYS.congerere",
    abbreviation: "ZHELL.CALENDAR.DAYS.congerereAbbr",
    ordinal: 5,
  },
  {
    name: "ZHELL.CALENDAR.DAYS.operiere",
    abbreviation: "ZHELL.CALENDAR.DAYS.operiereAbbr",
    ordinal: 6,
  },
  {
    name: "ZHELL.CALENDAR.DAYS.glacies",
    abbreviation: "ZHELL.CALENDAR.DAYS.glaciesAbbr",
    ordinal: 7,
    isRestDay: true,
  },
  {
    name: "ZHELL.CALENDAR.DAYS.ventus",
    abbreviation: "ZHELL.CALENDAR.DAYS.ventusAbbr",
    ordinal: 8,
    isRestDay: true,
  },
  {
    name: "ZHELL.CALENDAR.DAYS.lux",
    abbreviation: "ZHELL.CALENDAR.DAYS.luxAbbr",
    ordinal: 9,
    isRestDay: true,
  },
];

const months = [
  {
    name: "ZHELL.CALENDAR.MONTHS.sationemRise",
    abbreviation: "ZHELL.CALENDAR.MONTHS.sationemRiseAbbr",
    ordinal: 1,
    days: 27,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.sationem",
    abbreviation: "ZHELL.CALENDAR.MONTHS.sationemAbbr",
    ordinal: 2,
    days: 27,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.sationemEnd",
    abbreviation: "ZHELL.CALENDAR.MONTHS.sationemEndAbbr",
    ordinal: 3,
    days: 27,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.suntideRise",
    abbreviation: "ZHELL.CALENDAR.MONTHS.suntideRiseAbbr",
    ordinal: 4,
    days: 27,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.suntide",
    abbreviation: "ZHELL.CALENDAR.MONTHS.suntideAbbr",
    ordinal: 5,
    days: 27,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.suntideEnd",
    abbreviation: "ZHELL.CALENDAR.MONTHS.suntideEndAbbr",
    ordinal: 6,
    days: 27,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.maturamRise",
    abbreviation: "ZHELL.CALENDAR.MONTHS.maturamRiseAbbr",
    ordinal: 7,
    days: 27,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.maturam",
    abbreviation: "ZHELL.CALENDAR.MONTHS.maturamAbbr",
    ordinal: 8,
    days: 27,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.maturamEnd",
    abbreviation: "ZHELL.CALENDAR.MONTHS.maturamEndAbbr",
    ordinal: 9,
    days: 27,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.withertideRise",
    abbreviation: "ZHELL.CALENDAR.MONTHS.withertideRiseAbbr",
    ordinal: 10,
    days: 27,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.withertide",
    abbreviation: "ZHELL.CALENDAR.MONTHS.withertideAbbr",
    ordinal: 11,
    days: 27,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.withertideEnd",
    abbreviation: "ZHELL.CALENDAR.MONTHS.withertideEndAbbr",
    ordinal: 12,
    days: 27,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.tenebrae",
    abbreviation: "ZHELL.CALENDAR.MONTHS.tenebraeAbbr",
    ordinal: 13,
    days: 1,
  },
];

const seasons = [
  {
    name: "ZHELL.CALENDAR.MONTHS.sationem",
    monthStart: 1,
    monthEnd: 3,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.suntide",
    monthStart: 4,
    monthEnd: 6,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.maturam",
    monthStart: 7,
    monthEnd: 9,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.withertide",
    monthStart: 10,
    monthEnd: 12,
  },
  {
    name: "ZHELL.CALENDAR.MONTHS.tenebrae",
    monthStart: 13,
    monthEnd: 13,
  },
];

export default {
  name: "ZHELL.CALENDAR.TITLE",
  description: "ZHELL.CALENDAR.TEXT",
  years: {
    yearZero: 0,
    firstWeekday: 0,
    leapYear: {
      leapStart: 0,
      leapInterval: 0,
    },
  },
  months: { values: months },
  days: {
    values: days,
    daysPerYear: months.reduce((acc, m) => acc + m.days, 0),
    hoursPerDay: 24,
    minutesPerHour: 60,
    secondsPerMinute: 60,
  },
  seasons: { values: seasons },
};
