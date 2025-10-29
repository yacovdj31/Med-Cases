import React from "react";
import {
  countries,
  visas,
  serviceKinds,
  maritalStatuses,
  hebrewLevels,
} from "./IntakeSchema";

/* ---------- small UI helpers ---------- */
function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}
function Input(props) {
  return (
    <input
      {...props}
      className="rounded-xl px-3 py-2 text-sm bg-slate-900/60 text-slate-100 placeholder-slate-400/70 border border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
    />
  );
}
function Area(props) {
  return (
    <textarea
      rows={3}
      {...props}
      className="rounded-xl px-3 py-2 text-sm bg-slate-900/60 text-slate-100 placeholder-slate-400/70 border border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
    />
  );
}
function Select(props) {
  return (
    <select
      {...props}
      className="rounded-xl px-3 py-2 text-sm bg-slate-900/60 text-slate-100 border border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
    />
  );
}
function KV({ label, children }) {
  return (
    <div className="grid gap-1">
      <div className="text-xs font-medium text-slate-300">{label}</div>
      {children}
    </div>
  );
}
const YesNo = ({ name, value, onChange }) => (
  <div className="flex gap-3">
    <label className="inline-flex items-center gap-1">
      <input type="radio" name={name} checked={value === true} onChange={() => onChange(true)} />
      <span>Yes</span>
    </label>
    <label className="inline-flex items-center gap-1">
      <input type="radio" name={name} checked={value === false} onChange={() => onChange(false)} />
      <span>No</span>
    </label>
  </div>
);

/* ---------- Sections ---------- */
function PersonalInfoSection({ p, set }) {
  const toggleCit = (c) => {
    const has = p.citizenships.includes(c);
    set({ ...p, citizenships: has ? p.citizenships.filter((x) => x !== c) : [...p.citizenships, c] });
  };
  return (
    <div className="grid gap-3">
      <Field label="Full Name">
        <Input value={p.fullName} onChange={(e) => set({ ...p, fullName: e.target.value })} placeholder="Full name" />
      </Field>
      <Field label="Email">
        <Input type="email" value={p.email} onChange={(e) => set({ ...p, email: e.target.value })} placeholder="you@example.com" />
      </Field>
      <Field label="Date of Birth">
        <Input type="date" value={p.dob} onChange={(e) => set({ ...p, dob: e.target.value })} />
      </Field>
      <Field label="Country">
        <Select value={p.country} onChange={(e) => set({ ...p, country: e.target.value })}>
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <Field label="Citizenship (multi)">
        <div className="flex flex-wrap gap-2">
          {countries.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCit(c)}
              className={`px-3 py-1 rounded-xl border text-sm ${
                p.citizenships.includes(c) ? "border-sky-400 bg-sky-400/10" : "border-slate-700 bg-slate-900/60"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Current Address">
        <Input value={p.address} onChange={(e) => set({ ...p, address: e.target.value })} placeholder="Address" />
      </Field>
      <Field label="Phone">
        <Input value={p.phone} onChange={(e) => set({ ...p, phone: e.target.value })} placeholder="+972..." />
      </Field>
    </div>
  );
}

function JewishBackgroundSection({ i, set }) {
  return (
    <div className="grid gap-3">
      <KV label="Are you Jewish?">
        <YesNo name="isJewish" value={i.isJewish} onChange={(v) => set({ ...i, isJewish: v })} />
      </KV>

      {i.isJewish === true && (
        <>
          <KV label="Born to a Jewish mother?">
            <YesNo
              name="bornToJewishMother"
              value={i.bornToJewishMother}
              onChange={(v) => set({ ...i, bornToJewishMother: v })}
            />
          </KV>

          {i.bornToJewishMother === false && (
            <>
              <KV label="Converted to Judaism?">
                <YesNo name="converted" value={i.converted} onChange={(v) => set({ ...i, converted: v })} />
              </KV>
              {i.converted === true && (
                <Field label="Rabbinical Court">
                  <Input
                    value={i.conversionCourt}
                    onChange={(e) => set({ ...i, conversionCourt: e.target.value })}
                    placeholder="Court name"
                  />
                </Field>
              )}
            </>
          )}

          <KV label="Both parents Jewish?">
            <YesNo
              name="parentsBothJewish"
              value={i.parentsBothJewish}
              onChange={(v) => set({ ...i, parentsBothJewish: v })}
            />
          </KV>

          <Field label="Grandparents Jewish (notes)">
            <Input
              value={i.grandparentsJewish}
              onChange={(e) => set({ ...i, grandparentsJewish: e.target.value })}
              placeholder="e.g., maternal grandfather"
            />
          </Field>
        </>
      )}
    </div>
  );
}

function FamilySection({ f, set }) {
  return (
    <div className="grid gap-3">
      <Field label="Parents' Names">
        <Area
          value={f.parentNames}
          onChange={(e) => set({ ...f, parentNames: e.target.value })}
          placeholder="Father: __, Mother: __"
        />
      </Field>

      <KV label="Parents live in Israel?">
        <YesNo name="parentsInIsrael" value={f.parentsInIsrael} onChange={(v) => set({ ...f, parentsInIsrael: v })} />
      </KV>

      <KV label="Relatives in Israel?">
        <YesNo
          name="relativesInIsrael"
          value={f.relativesInIsrael}
          onChange={(v) => set({ ...f, relativesInIsrael: v })}
        />
      </KV>

      {f.relativesInIsrael === true && (
        <Field label="Relatives (name & city)">
          <Area value={f.relativesNotes} onChange={(e) => set({ ...f, relativesNotes: e.target.value })} />
        </Field>
      )}

      <Field label="Marital Status">
        <Select value={f.maritalStatus} onChange={(e) => set({ ...f, maritalStatus: e.target.value })}>
          {maritalStatuses.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </Select>
      </Field>

      <KV label="Do you have children?">
        <YesNo name="hasChildren" value={f.hasChildren} onChange={(v) => set({ ...f, hasChildren: v })} />
      </KV>

      {f.hasChildren === true && (
        <Field label="Children Count">
          <Input
            type="number"
            min={0}
            value={f.childrenCount}
            onChange={(e) => set({ ...f, childrenCount: Number(e.target.value || 0) })}
          />
        </Field>
      )}
    </div>
  );
}

function IsraelStatusSection({ s, set }) {
  return (
    <div className="grid gap-3">
      <KV label="Visited Israel before this?">
        <YesNo name="visitedBefore" value={s.visitedBefore} onChange={(v) => set({ ...s, visitedBefore: v })} />
      </KV>

      {s.visitedBefore === true && (
        <Field label="How long in Israel">
          <Input
            value={s.howLongInIsrael}
            onChange={(e) => set({ ...s, howLongInIsrael: e.target.value })}
            placeholder="e.g., 3 months"
          />
        </Field>
      )}

      <Field label="Visa Type">
        <Select value={s.visaType} onChange={(e) => set({ ...s, visaType: e.target.value })}>
          {visas.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </Select>
      </Field>

      <KV label="Ever made Aliyah?">
        <YesNo
          name="madeAliyahBefore"
          value={s.madeAliyahBefore}
          onChange={(v) => set({ ...s, madeAliyahBefore: v })}
        />
      </KV>

      <KV label="Ever held Israeli citizenship?">
        <YesNo
          name="heldIsraeliCitizenship"
          value={s.heldIsraeliCitizenship}
          onChange={(v) => set({ ...s, heldIsraeliCitizenship: v })}
        />
      </KV>

      <KV label="Valid passport?">
        <YesNo
          name="hasValidPassport"
          value={s.hasValidPassport}
          onChange={(v) => set({ ...s, hasValidPassport: v })}
        />
      </KV>
    </div>
  );
}

function LegalMedicalSection({ l, setL, m, setM }) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-3">
        <div className="text-sm font-semibold">Legal</div>
        <KV label="Served in another army?">
          <YesNo name="servedOtherArmy" value={l.servedOtherArmy} onChange={(v) => setL({ ...l, servedOtherArmy: v })} />
        </KV>
        <KV label="Criminal record?">
          <YesNo name="criminalRecord" value={l.criminalRecord} onChange={(v) => setL({ ...l, criminalRecord: v })} />
        </KV>
        <KV label="Pending legal cases?">
          <YesNo name="pendingLegal" value={l.pendingLegal} onChange={(v) => setL({ ...l, pendingLegal: v })} />
        </KV>
        {(l.criminalRecord || l.pendingLegal) && (
          <Field label="Legal notes">
            <Area
              value={l.legalNotes}
              onChange={(e) => setL({ ...l, legalNotes: e.target.value })}
              placeholder="Brief details"
            />
          </Field>
        )}
      </section>

      <section className="grid gap-3">
        <div className="text-sm font-semibold">Medical</div>
        <KV label="Medical conditions?">
          <YesNo
            name="medicalConditions"
            value={m.medicalConditions}
            onChange={(v) => setM({ ...m, medicalConditions: v })}
          />
        </KV>
        {m.medicalConditions === true && (
          <Field label="Specify">
            <Area
              value={m.medicalList}
              onChange={(e) => setM({ ...m, medicalList: e.target.value })}
              placeholder="List conditions"
            />
          </Field>
        )}
        <KV label="Ever hospitalized / surgery?">
          <YesNo
            name="hospitalizedOrSurgery"
            value={m.hospitalizedOrSurgery}
            onChange={(v) => setM({ ...m, hospitalizedOrSurgery: v })}
          />
        </KV>
        <Field label="Limitations (if any)">
          <Input value={m.limitations} onChange={(e) => setM({ ...m, limitations: e.target.value })} placeholder="Optional" />
        </Field>
        <KV label="Psychological help?">
          <YesNo name="psychHelp" value={m.psychHelp} onChange={(v) => setM({ ...m, psychHelp: v })} />
        </KV>
      </section>
    </div>
  );
}

function MotivationSection({ r, set }) {
  return (
    <div className="grid gap-3">
      <Field label="Why do you want to serve?">
        <Area value={r.whyServe} onChange={(e) => set({ ...r, whyServe: e.target.value })} />
      </Field>
      <Field label="Service interest">
        <Select value={r.serviceKind} onChange={(e) => set({ ...r, serviceKind: e.target.value })}>
          {serviceKinds.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </Field>
      <KV label="Prepared to commit to full service?">
        <YesNo
          name="commitFullService"
          value={r.commitFullService}
          onChange={(v) => set({ ...r, commitFullService: v })}
        />
      </KV>
      <Field label="Hebrew level">
        <Select value={r.hebrewLevel} onChange={(e) => set({ ...r, hebrewLevel: e.target.value })}>
          {hebrewLevels.map((h) => (
            <option key={h}>{h}</option>
          ))}
        </Select>
      </Field>

      {/* Draft month preference (matches DB: serviceIntent.draftPreference) */}
      <Field label="When do you want to draft?">
        <Select
          value={r.draftPreference || ""}
          onChange={(e) => set({ ...r, draftPreference: e.target.value })}
        >
          <option value="">Select…</option>
          <option value="August">August</option>
          <option value="March">March</option>
          <option value="November">November</option>
        </Select>
      </Field>
    </div>
  );
}

/* ---------- Export wrapper that renders current step ---------- */
export default function SignupSections({
  step,
  p, setP,
  i, setI,
  f, setF,
  s, setS,
  l, setL,
  m, setM,
  r, setR,
}) {
  if (step === 1) return <PersonalInfoSection p={p} set={setP} />;
  if (step === 2) return <JewishBackgroundSection i={i} set={setI} />;
  if (step === 3) return <FamilySection f={f} set={setF} />;
  if (step === 4) return <IsraelStatusSection s={s} set={setS} />;
  if (step === 5) return <LegalMedicalSection l={l} setL={setL} m={m} setM={setM} />;
  if (step === 6) return <MotivationSection r={r} set={setR} />;
  return null;
}
