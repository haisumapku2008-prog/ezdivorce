import type { USState } from "../types";

export interface StateInfo {
  code: USState;
  name: string;
  supported: boolean;
  counties?: { value: string; label: string }[];
}

export const US_STATES: StateInfo[] = [
  { code: "AL", name: "Alabama", supported: false },
  { code: "AK", name: "Alaska", supported: false },
  { code: "AZ", name: "Arizona", supported: false },
  { code: "AR", name: "Arkansas", supported: false },
  { code: "CA", name: "California", supported: false },
  { code: "CO", name: "Colorado", supported: false },
  { code: "CT", name: "Connecticut", supported: false },
  { code: "DE", name: "Delaware", supported: false },
  { code: "FL", name: "Florida", supported: false },
  { code: "GA", name: "Georgia", supported: false },
  { code: "HI", name: "Hawaii", supported: false },
  { code: "ID", name: "Idaho", supported: false },
  { code: "IL", name: "Illinois", supported: false },
  { code: "IN", name: "Indiana", supported: false },
  { code: "IA", name: "Iowa", supported: false },
  { code: "KS", name: "Kansas", supported: false },
  { code: "KY", name: "Kentucky", supported: false },
  { code: "LA", name: "Louisiana", supported: false },
  { code: "ME", name: "Maine", supported: false },
  { code: "MD", name: "Maryland", supported: false },
  { code: "MA", name: "Massachusetts", supported: false },
  { code: "MI", name: "Michigan", supported: false },
  { code: "MN", name: "Minnesota", supported: false },
  { code: "MS", name: "Mississippi", supported: false },
  { code: "MO", name: "Missouri", supported: false },
  { code: "MT", name: "Montana", supported: false },
  { code: "NE", name: "Nebraska", supported: false },
  { code: "NV", name: "Nevada", supported: false },
  { code: "NH", name: "New Hampshire", supported: false },
  { code: "NJ", name: "New Jersey", supported: false },
  { code: "NM", name: "New Mexico", supported: false },
  { code: "NY", name: "New York", supported: false },
  { code: "NC", name: "North Carolina", supported: false },
  { code: "ND", name: "North Dakota", supported: false },
  { code: "OH", name: "Ohio", supported: false },
  { code: "OK", name: "Oklahoma", supported: false },
  { code: "OR", name: "Oregon", supported: false },
  { code: "PA", name: "Pennsylvania", supported: false },
  { code: "RI", name: "Rhode Island", supported: false },
  { code: "SC", name: "South Carolina", supported: false },
  { code: "SD", name: "South Dakota", supported: false },
  { code: "TN", name: "Tennessee", supported: false },
  { code: "TX", name: "Texas", supported: false },
  { code: "UT", name: "Utah", supported: false },
  { code: "VT", name: "Vermont", supported: false },
  { code: "VA", name: "Virginia", supported: false },
  {
    code: "WA",
    name: "Washington",
    supported: true,
    counties: [
      { value: "king", label: "King County" },
      { value: "pierce", label: "Pierce County" },
      { value: "snohomish", label: "Snohomish County" },
      { value: "spokane", label: "Spokane County" },
      { value: "clark", label: "Clark County" },
      { value: "thurston", label: "Thurston County" },
      { value: "kitsap", label: "Kitsap County" },
      { value: "yakima", label: "Yakima County" },
      { value: "whatcom", label: "Whatcom County" },
      { value: "benton", label: "Benton County" },
    ],
  },
  { code: "WV", name: "West Virginia", supported: false },
  { code: "WI", name: "Wisconsin", supported: false },
  { code: "WY", name: "Wyoming", supported: false },
];

export function getStateInfo(code: USState): StateInfo | undefined {
  return US_STATES.find((s) => s.code === code);
}

export function getCountiesForState(code: USState): { value: string; label: string }[] {
  return getStateInfo(code)?.counties ?? [];
}
