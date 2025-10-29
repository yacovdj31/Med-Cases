// components/intake/IntakeSummary.jsx
import React from "react";
import { useTheme } from "../../theme/ThemeProvider.jsx";

const K = ({ children }) => <span className="text-slate-400">{children}</span>;
const V = ({ children }) => <span className="text-slate-200">{children}</span>;
const Bool = ({ v }) => <V>{v === true ? "Yes" : v === false ? "No" : "—"}</V>;
const Row = ({ label, value }) =>
  value === undefined || value === "" || value === null || (Array.isArray(value) && value.length === 0)
    ? null
    : (
      <div className="flex items-start gap-2 text-sm leading-5">
        <K className="shrink-0 w-48">{label}:</K>
        <div className="min-w-0 break-words"><V>{Array.isArray(value) ? value.join(", ") : String(value)}</V></div>
      </div>
    );

export default function IntakeSummary({ intake }) {
  const { t } = useTheme();
  if (!intake || typeof intake !== "object") return (
    <div className={t("p-4 bg-white border-t border-sky-200","p-4 bg-slate-900 border-t border-slate-800")}>
      <div className="text-sm opacity-70">No intake submitted.</div>
    </div>
  );

  const P = intake.personal || {};
  const I = intake.identity || {};
  const F = intake.familyIsrael || {};
  const S = intake.stayStatus || {};
  const L = intake.legal || {};
  const M = intake.medical || {};
  const R = intake.serviceIntent || {};

  // 👇 fallback supports old payloads that used `draftMonth`
  const draftPref = R.draftPreference ?? R.draftMonth ?? null;

  return (
    <div className={t("p-4 bg-white border-t border-sky-200 grid gap-3","p-4 bg-slate-900 border-t border-slate-800 grid gap-3")}>
      <Block title="Personal" t={t}>
        <Row label="Full name" value={P.fullName} />
        <Row label="DOB" value={P.dob} />
        <Row label="Country" value={P.country} />
        <Row label="Citizenship(s)" value={P.citizenships} />
        <Row label="Address" value={P.address} />
        <Row label="Phone" value={P.phone} />
        <Row label="Email" value={P.email} />
      </Block>

      <Block title="Identity" t={t}>
        <KV label="Jewish"><Bool v={I.isJewish} /></KV>
        {I.isJewish && (
          <>
            <KV label="Born to Jewish mother"><Bool v={I.bornToJewishMother} /></KV>
            {I.bornToJewishMother === false && (
              <>
                <KV label="Converted"><Bool v={I.converted} /></KV>
                {I.converted && <Row label="Rabbinical court" value={I.conversionCourt} />}
              </>
            )}
            <KV label="Parents both Jewish"><Bool v={I.parentsBothJewish} /></KV>
            <Row label="Grandparents (notes)" value={I.grandparentsJewish} />
          </>
        )}
      </Block>

      <Block title="Family & Israel" t={t}>
        <Row label="Parents' names" value={F.parentNames} />
        <KV label="Parents in Israel"><Bool v={F.parentsInIsrael} /></KV>
        <KV label="Relatives in Israel"><Bool v={F.relativesInIsrael} /></KV>
        {F.relativesInIsrael && <Row label="Relatives (name & city)" value={F.relativesNotes} />}
        <Row label="Marital status" value={F.maritalStatus} />
        {F.hasChildren !== undefined && (
          <KV label="Children"><V>{F.hasChildren ? (F.childrenCount ?? 0) : "No"}</V></KV>
        )}
      </Block>

      <Block title="Stay / Status" t={t}>
        <KV label="Visited before"><Bool v={S.visitedBefore} /></KV>
        {S.visitedBefore && <Row label="How long in Israel" value={S.howLongInIsrael} />}
        <Row label="Visa type" value={S.visaType} />
        <KV label="Made Aliyah before"><Bool v={S.madeAliyahBefore} /></KV>
        <KV label="Held Israeli citizenship"><Bool v={S.heldIsraeliCitizenship} /></KV>
        <KV label="Valid passport"><Bool v={S.hasValidPassport} /></KV>
      </Block>

      <Block title="Legal" t={t}>
        <KV label="Served other army"><Bool v={L.servedOtherArmy} /></KV>
        <KV label="Criminal record"><Bool v={L.criminalRecord} /></KV>
        <KV label="Pending legal cases"><Bool v={L.pendingLegal} /></KV>
        <Row label="Notes" value={L.legalNotes} />
      </Block>

      <Block title="Medical" t={t}>
        <KV label="Medical conditions"><Bool v={M.medicalConditions} /></KV>
        {M.medicalConditions && <Row label="List" value={M.medicalList} />}
        <KV label="Hospitalized / Surgery"><Bool v={M.hospitalizedOrSurgery} /></KV>
        <Row label="Limitations" value={M.limitations} />
        <KV label="Psychological help"><Bool v={M.psychHelp} /></KV>
      </Block>

      <Block title="Service Intent" t={t}>
        <Row label="Why serve" value={R.whyServe} />
        <Row label="Service interest" value={R.serviceKind} />
        <KV label="Commit full service"><Bool v={R.commitFullService} /></KV>
        <Row label="Hebrew level" value={R.hebrewLevel} />
        {/* 🔥 now visible */}
        <Row label="Draft preference" value={draftPref} />
      </Block>
    </div>
  );
}

function Block({ title, children, t }) {
  return (
    <section className={t("rounded-lg border border-slate-200 p-3","rounded-lg border border-slate-800 p-3")}>
      <div className="text-sm font-semibold mb-2">{title}</div>
      <div className="grid gap-1">{children}</div>
    </section>
  );
}
function KV({ label, children }) {
  return (
    <div className="flex gap-2 text-sm">
      <K>{label}:</K> {children}
    </div>
  );
}
