import React, { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import SignupSections from "../../components/intake/SignupSections.jsx";

export default function SignupPage() {
  const { signup } = useAuth();

  // Wizard steps:
  // 0 = Account (email/password)
  // 1 Personal, 2 Jewish background, 3 Family, 4 Israel status, 5 Legal+Medical, 6 Motivation, 7 Review
  const stepsTotal = 8;
  const [step, setStep] = useState(0);

  // Account fields (only in step 0)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Intake state
  const [p, setP] = useState({
    fullName: "",
    dob: "",
    country: "USA",
    citizenships: [],
    address: "",
    phone: "",
    email: "" // mirrors account email
  });

  const [i, setI] = useState({
    isJewish: null,
    bornToJewishMother: null,
    converted: null,
    conversionCourt: "",
    parentsBothJewish: null,
    grandparentsJewish: ""
  });

  const [f, setF] = useState({
    parentNames: "",
    parentsInIsrael: null,
    relativesInIsrael: null,
    relativesNotes: "",
    maritalStatus: "Single",
    hasChildren: null,
    childrenCount: 0
  });

  const [s, setS] = useState({
    visitedBefore: null,
    howLongInIsrael: "",
    visaType: "Tourist (B/2)",
    madeAliyahBefore: null,
    heldIsraeliCitizenship: null,
    hasValidPassport: null
  });

  const [l, setL] = useState({
    servedOtherArmy: null,
    criminalRecord: null,
    pendingLegal: null,
    legalNotes: ""
  });

  const [m, setM] = useState({
    medicalConditions: null,
    medicalList: "",
    hospitalizedOrSurgery: null,
    limitations: "",
    psychHelp: null
  });

  const [r, setR] = useState({
    whyServe: "",
    serviceKind: "Combat",
    commitFullService: null,
    hebrewLevel: "None",
    draftPreference: "" // "August" | "March" | "November"
  });

  // keep p.email mirrored with account email
  const syncPersonalEmail = useCallback((val) => {
    setEmail(val);
    setP((old) => ({ ...old, email: val }));
  }, []);

  // UI state
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Prevent Enter from submitting early (except inside textarea)
  const preventEarlyEnter = (e) => {
    if (e.key === "Enter" && step < stepsTotal - 1 && e.target?.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  };

  // Per-step validation
  const canGoNext = useMemo(() => {
    if (step === 0) {
      return email.trim().length > 3 && password.trim().length >= 6;
    }
    if (step === 1) {
      return p.fullName.trim() && p.dob && p.country && p.phone.trim() && (p.email || email).trim();
    }
    if (step === 2) {
      if (i.isJewish === null) return false;
      if (i.isJewish) {
        if (i.bornToJewishMother === null) return false;
        if (i.bornToJewishMother === false) {
          if (i.converted === null) return false;
          if (i.converted && !i.conversionCourt.trim()) return false;
        }
      }
      return true;
    }
    if (step === 3) {
      if (!f.maritalStatus) return false;
      if (f.hasChildren && (typeof f.childrenCount !== "number" || f.childrenCount < 0)) return false;
      if (f.relativesInIsrael && !f.relativesNotes.trim()) return false;
      return true;
    }
    if (step === 4) {
      if (!s.visaType) return false;
      if (s.visitedBefore && !s.howLongInIsrael.trim()) return false;
      if (s.hasValidPassport === null) return false;
      return true;
    }
    if (step === 5) {
      if ((l.criminalRecord || l.pendingLegal) && !l.legalNotes.trim()) return false;
      if (m.medicalConditions && !m.medicalList.trim()) return false;
      return true;
    }
    if (step === 6) {
      if (!r.whyServe.trim()) return false;
      if (r.commitFullService === null) return false;
      if (!["August", "March", "November"].includes(r.draftPreference)) return false;
      return true;
    }
    // Review step
    return true;
  }, [step, email, password, p, i, f, s, l, m, r]);

  // Final submit (only at last step)
  const onSubmit = async (e) => {
    e.preventDefault();
    if (step < stepsTotal - 1) return;

    setErr("");
    setBusy(true);
    try {
      const intake = {
        personal: { ...p, email: (p.email || email).trim() },
        identity: { ...i },
        familyIsrael: { ...f },
        stayStatus: { ...s },
        legal: { ...l },
        medical: { ...m },
        serviceIntent: { ...r }, // includes draftPreference
      };

      const name = p.fullName || "";
      const country = p.country || "USA";

      await signup((p.email || email).trim(), password, name.trim(), country, intake);
      // AuthContext handles navigation
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  const StepTitle = [
    "Account",
    "Personal",
    "Jewish Background",
    "Family",
    "Israel Status",
    "Legal & Medical",
    "Motivation",
    "Review",
  ][step];

  return (
    <div className="min-h-screen grid place-items-center bg-sky-900 text-slate-100 px-3">
      <div className="w-full max-w-2xl rounded-2xl border border-sky-800 bg-slate-900/60 backdrop-blur-sm shadow-[0_8px_30px_rgba(2,132,199,0.15)] overflow-hidden">
        <div className="px-4 py-3 border-b border-sky-800 bg-sky-900">
          <h1 className="text-base font-semibold">Create account</h1>
          <div className="text-xs text-slate-300 mt-1">
            Step {step + 1} of {stepsTotal} — {StepTitle}
          </div>
        </div>

        <form onSubmit={onSubmit} onKeyDown={preventEarlyEnter} noValidate autoComplete="off" className="p-4 grid gap-4">
          {err && (
            <div className="p-2 rounded-lg border border-red-400/40 bg-red-500/10 text-red-300 text-sm">
              {err}
            </div>
          )}

          {/* Step 0: Account */}
          {step === 0 && (
            <div className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-300">Email</span>
                <input
                  className="rounded-xl px-3 py-2 text-sm bg-slate-900/60 text-slate-100 placeholder-slate-400/70 border border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => syncPersonalEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-300">Password</span>
                <input
                  className="rounded-xl px-3 py-2 text-sm bg-slate-900/60 text-slate-100 placeholder-slate-400/70 border border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </label>
            </div>
          )}

          {/* Steps 1..6: intake sections */}
          {step >= 1 && step <= 6 && (
            <SignupSections
              step={step}
              p={p} setP={setP}
              i={i} setI={setI}
              f={f} setF={setF}
              s={s} setS={setS}
              l={l} setL={setL}
              m={m} setM={setM}
              r={r} setR={setR}
            />
          )}

          {/* Step 7: Review */}
          {step === 7 && (
            <div className="grid gap-3 text-sm">
              <div className="text-slate-300">
                Review your details. When you click <span className="font-semibold text-white">Create account</span>,
                we’ll save your intake and create your user.
              </div>

              <div className="rounded-xl border border-slate-700 p-3 bg-slate-900/50 grid gap-2">
                <Row k="Email" v={(p.email || email) || "—"} />
                <Row k="Full Name" v={p.fullName || "—"} />
                <Row k="DOB" v={p.dob || "—"} />
                <Row k="Country" v={p.country || "—"} />
                <Row k="Citizenships" v={(p.citizenships || []).join(", ") || "—"} />
                <Row k="Phone" v={p.phone || "—"} />
                <Row k="Address" v={p.address || "—"} />

                <Rule />
                <Row k="Jewish" v={yesno(i.isJewish)} />
                {i.isJewish === true && (
                  <>
                    <Row k="Mother Jewish" v={yesno(i.bornToJewishMother)} />
                    {i.bornToJewishMother === false && (
                      <>
                        <Row k="Converted" v={yesno(i.converted)} />
                        {i.converted === true && <Row k="Conversion Court" v={i.conversionCourt || "—"} />}
                      </>
                    )}
                    <Row k="Parents both Jewish" v={yesno(i.parentsBothJewish)} />
                    <Row k="Grandparents Jewish (notes)" v={i.grandparentsJewish || "—"} />
                  </>
                )}

                <Rule />
                <Row k="Parents' Names" v={f.parentNames || "—"} />
                <Row k="Parents in Israel" v={yesno(f.parentsInIsrael)} />
                <Row k="Relatives in Israel" v={yesno(f.relativesInIsrael)} />
                {f.relativesInIsrael === true && <Row k="Relatives (name & city)" v={f.relativesNotes || "—"} />}
                <Row k="Marital Status" v={f.maritalStatus || "—"} />
                <Row k="Has Children" v={yesno(f.hasChildren)} />
                {f.hasChildren === true && <Row k="Children Count" v={String(f.childrenCount ?? 0)} />}

                <Rule />
                <Row k="Visited before" v={yesno(s.visitedBefore)} />
                {s.visitedBefore === true && <Row k="How long in Israel" v={s.howLongInIsrael || "—"} />}
                <Row k="Visa Type" v={s.visaType || "—"} />
                <Row k="Made Aliyah before" v={yesno(s.madeAliyahBefore)} />
                <Row k="Held Israeli citizenship" v={yesno(s.heldIsraeliCitizenship)} />
                <Row k="Valid passport" v={yesno(s.hasValidPassport)} />

                <Rule />
                <Row k="Served other army" v={yesno(l.servedOtherArmy)} />
                <Row k="Criminal record" v={yesno(l.criminalRecord)} />
                <Row k="Pending legal" v={yesno(l.pendingLegal)} />
                {(l.criminalRecord || l.pendingLegal) && <Row k="Legal notes" v={l.legalNotes || "—"} />}

                <Rule />
                <Row k="Medical conditions" v={yesno(m.medicalConditions)} />
                {m.medicalConditions === true && <Row k="Medical list" v={m.medicalList || "—"} />}
                <Row k="Hospitalized / surgery" v={yesno(m.hospitalizedOrSurgery)} />
                <Row k="Limitations" v={m.limitations || "—"} />
                <Row k="Psychological help" v={yesno(m.psychHelp)} />

                <Rule />
                <Row k="Why serve" v={r.whyServe || "—"} />
                <Row k="Service kind" v={r.serviceKind || "—"} />
                <Row k="Commit full service" v={yesno(r.commitFullService)} />
                <Row k="Hebrew level" v={r.hebrewLevel || "—"} />
                <Row k="Draft month preference" v={r.draftPreference || "—"} />
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-1 grid grid-cols-2 gap-2">
            {step > 0 ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="rounded-xl px-4 py-2 text-sm font-medium border border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < stepsTotal - 1 ? (
              <button
                type="button" // IMPORTANT: not submit
                disabled={!canGoNext || busy}
                onClick={() => setStep((s) => Math.min(stepsTotal - 1, s + 1))}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-medium text-white border border-sky-700",
                  "bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600",
                  "shadow-[0_6px_20px_rgba(2,132,199,0.25)]",
                  "transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_12px_30px_rgba(2,132,199,0.35)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                  (!canGoNext || busy) ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={busy}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-medium text-white border border-emerald-700",
                  "bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600",
                  "shadow-[0_6px_20px_rgba(16,185,129,0.25)]",
                  "transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_12px_30px_rgba(16,185,129,0.35)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300",
                  busy ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                {busy ? "Creating…" : "Create account"}
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 mt-1">
            Already have an account?{" "}
            <Link className="text-sky-300 hover:underline" to="/login">
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Review helpers */
function Row({ k, v }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-3">
      <div className="text-slate-400">{k}</div>
      <div className="text-slate-100">{String(v)}</div>
    </div>
  );
}
function Rule() {
  return <div className="h-px bg-slate-700 my-1" />;
}
function yesno(v) {
  return v === null ? "—" : v ? "Yes" : "No";
}
