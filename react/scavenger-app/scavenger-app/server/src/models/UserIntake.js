import mongoose from "mongoose";

const IntakeSchema = new mongoose.Schema(
  {
    personal: {
      fullName: String,
      dob: String,
      country: String,
      citizenships: [String],
      address: String,
      phone: String,
      email: String
    },
    identity: {
      isJewish: Boolean,
      bornToJewishMother: Boolean,
      converted: Boolean,
      conversionCourt: String,
      parentsBothJewish: Boolean,
      grandparentsJewish: String
    },
    familyIsrael: {
      parentNames: String,
      parentsInIsrael: Boolean,
      relativesInIsrael: Boolean,
      relativesNotes: String,
      maritalStatus: String,
      hasChildren: Boolean,
      childrenCount: { type: Number, default: 0 }
    },
    stayStatus: {
      visitedBefore: Boolean,
      howLongInIsrael: String,
      visaType: String,
      madeAliyahBefore: Boolean,
      heldIsraeliCitizenship: Boolean,
      hasValidPassport: Boolean
    },
    legal: {
      servedOtherArmy: Boolean,
      criminalRecord: Boolean,
      pendingLegal: Boolean,
      legalNotes: String
    },
    medical: {
      medicalConditions: Boolean,
      medicalList: String,
      hospitalizedOrSurgery: Boolean,
      limitations: String,
      psychHelp: Boolean
    },
    serviceIntent: {
      whyServe: String,
      serviceKind: String,
      commitFullService: Boolean,
      hebrewLevel: String,
      // 👇 Add this:
      draftPreference: { type: String, enum: ['August', 'March', 'November'], default: null }
    }
  },
  { _id: false }
);

const UserIntakeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, index: true, required: true },
    intake: IntakeSchema
  },
  { timestamps: true }
);

const UserIntake = mongoose.model("UserIntake", UserIntakeSchema);
export default UserIntake;
