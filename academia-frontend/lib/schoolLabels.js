export const INSTITUTION_TYPE_LABELS = {
  UNIVERSITY: "University",
  POLYTECHNIC: "Polytechnic",
  COLLEGE_OF_EDUCATION: "College of Education",
};

export const OWNERSHIP_LABELS = {
  FEDERAL: "Federal",
  STATE: "State",
  PRIVATE: "Private",
};

export const INSTITUTION_TYPE_OPTIONS = Object.entries(INSTITUTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const OWNERSHIP_OPTIONS = Object.entries(OWNERSHIP_LABELS).map(([value, label]) => ({
  value,
  label,
}));