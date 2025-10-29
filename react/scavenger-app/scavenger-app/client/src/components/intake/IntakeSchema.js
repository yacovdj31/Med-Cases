// components/intake/IntakeSchema.js
export const emptyIntake = () => ({
  personal: {
    fullName: "",
    dob: "",
    country: "USA",
    citizenships: [],
    address: "",
    phone: "",
    email: "",
  },
  identity: {
    isJewish: undefined,
    bornToJewishMother: undefined,
    converted: undefined,
    conversionCourt: "",
    parentsBothJewish: undefined,
    grandparentsJewish: "",
  },
  familyIsrael: {
    parentNames: "",
    parentsInIsrael: undefined,
    relativesInIsrael: undefined,
    relativesNotes: "",
    maritalStatus: "Single",
    hasChildren: undefined,
    childrenCount: 0,
  },
  stayStatus: {
    visitedBefore: undefined,
    howLongInIsrael: "",
    visaType: "Tourist",
    madeAliyahBefore: undefined,
    heldIsraeliCitizenship: undefined,
    hasValidPassport: undefined,
  },
  legal: {
    servedOtherArmy: undefined,
    criminalRecord: undefined,
    pendingLegal: undefined,
    legalNotes: "",
  },
  medical: {
    medicalConditions: undefined,
    medicalList: "",
    hospitalizedOrSurgery: undefined,
    limitations: "",
    psychHelp: undefined,
  },
  serviceIntent: {
    whyServe: "",
    serviceKind: "Combat",
    commitFullService: undefined,
    hebrewLevel: "Basic",
    // 🔥 add this so the client state actually has the field
    draftPreference: null, // "August" | "March" | "November"
  },
});

export const countries = ["USA", "Canada", "Russia", "Israel", "UK", "Australia", "Other"];
export const visas = ["Tourist", "Student", "Work", "A/1 (Eligible Immigrant)", "Other"];
export const serviceKinds = ["Combat", "Combat Support", "Non-Combat", "Undecided"];
export const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];
export const hebrewLevels = ["Basic", "Intermediate", "Advanced", "Fluent"];

// (optional) reuse this in the form's <select>
export const draftMonths = ["August", "March", "November"];
