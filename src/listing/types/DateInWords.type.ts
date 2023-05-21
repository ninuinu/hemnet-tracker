export type day =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | '13'
  | '14'
  | '15'
  | '16'
  | '17'
  | '18'
  | '19'
  | '20'
  | '21'
  | '22'
  | '23'
  | '24'
  | '25'
  | '26'
  | '27'
  | '28'
  | '29'
  | '30'
  | '31';

export type month =
  | 'januari'
  | 'februari'
  | 'mars'
  | 'april'
  | 'maj'
  | 'juni'
  | 'juli'
  | 'augusti'
  | 'september'
  | 'oktober'
  | 'november'
  | 'december';

export type year = '2022' | '2023';

export type DateInWords = {
  day: day;
  month: month;
  year: year;
};
