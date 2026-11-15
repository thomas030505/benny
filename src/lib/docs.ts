/**
 * Dokumentene demoen bygger på. Legg til et nytt dokument her, og kjør `npm run extract`.
 */
const BASE =
  "https://trondheim.kommune.no/globalassets/10-bilder-og-filer/10-byutvikling/byplankontoret/1c_vedtatt-plan/2025/ringvalvegen-11-og-j.o.-stavs-veg-4-6-og-8-detaljregulering---heimdal-helse--og-velferdssenter";

const HEARING_1 =
  "https://www.trondheim.kommune.no/globalassets/10-bilder-og-filer/10-byutvikling/byplankontoret/1b_offentlig-ettersyn/2024/ringvalvegen-11-og-j.o.-stavs-veg-4-6-og-8-detaljregulering---heimdal-helse--og-velferdssenter-r20220040";
const HEARING_2 =
  "https://trondheim.kommune.no/globalassets/10-bilder-og-filer/10-byutvikling/byplankontoret/1b_offentlig-ettersyn/2024/begrenset-horing----heimdal-helse--og-velferdssenter";

export const DOCS = [
  { d: "planbestemmelser", t: "Planbestemmelser", url: `${BASE}/planbestemmelser.pdf` },
  // Filnavnet har dobbel n hos kommunen. Det er riktig.
  { d: "planbeskrivelse", t: "Planbeskrivelse", url: `${BASE}/plannbeskrivelse.pdf` },
  { d: "saksfremlegg", t: "Saksfremlegg", url: `${BASE}/saksfremlegg.pdf` },
  { d: "fagnotat", t: "Fagnotat", url: `${BASE}/fagnotat.pdf` },
  { d: "vedtak", t: "Bystyrets vedtak", url: `${BASE}/vedtak-19.06.25.pdf` },
  // Fagrapportene fra høringene i 2024. De er grunnlaget for planen, ikke selve vedtaket.
  { d: "stoy", t: "Støyvurdering", url: `${HEARING_2}/stoyvurdering.pdf` },
  { d: "geoteknikk", t: "Geoteknisk notat", url: `${HEARING_1}/vedlegg-19-geoteknisk-vurderingsnotat.pdf` },
  { d: "va", t: "VA-plan", url: `${HEARING_1}/vedlegg-21-notat-overordnet-va-plan.pdf` },
  { d: "trafikk", t: "Trafikknotat", url: `${HEARING_1}/vedlegg-27-trafikale-forhold.pdf` },
  { d: "kapasitet", t: "Kapasitetsvurdering", url: `${HEARING_1}/vedlegg-28-kapasitetsvurderinger.pdf` },
  { d: "brann", t: "Brannteknisk notat", url: `${HEARING_1}/vedlegg-30-premissnotat-brannteknisk-vurdering.pdf` },
  { d: "ros", t: "ROS-analyse", url: `${HEARING_1}/vedlegg-18-ros-analyse.pdf` },
  { d: "klimagass", t: "Klimagassberegning", url: `${HEARING_1}/vedlegg-26-klimagassberegning-i-reguleringsfase.pdf` },
  // Politiske saker om selve byggeprosjektet (kommunens innsynsportal).
  { d: "investering", t: "Investeringsbeslutning", url: "https://trondheim-elements.digdem.no/file/cmu4gzjixtj7t0pysb9701kin" },
  { d: "investeringsvedtak", t: "Investeringsvedtak", url: "https://trondheim-elements.digdem.no/file/cmuq1ued11fsd0pysfdhyhksu" },
  { d: "formannskapssak", t: "Formannskapssak", url: "https://trondheim-elements.digdem.no/file/clx2jx8so1yel0o0c121s6nw3" },
  { d: "formannskapsvedtak", t: "Formannskapets vedtak", url: "https://trondheim-elements.digdem.no/file/clx2jx8so1yem0o0ccirr566e" },
  // Kommunens generelle krav. De gjelder alle helse- og velferdssentre, ikke bare dette.
  { d: "funksjonsprogram", t: "Kommunens funksjonsprogram", url: "https://trondheim.kommune.no/globalassets/10-bilder-og-filer/10-byutvikling/trondheim-eiendom/afprogram-hvs.pdf" },
  { d: "miljokrav", t: "Kommunens miljøkrav", url: "https://trondheim.kommune.no/globalassets/10-bilder-og-filer/10-byutvikling/trondheim-eiendom/filer-og-dokumenter/mal_-miljokrav-i-byggeprosjekt-v2.0.xlsx---info-og-miljokrav.pdf" },
];

/**
 * Pressemeldinger om byggingen. De er nettsider, ikke PDF-er, så teksten er et kort sammendrag
 * skrevet for hånd fra originalen (kontrollert 15.11.2026). Hver blir én side i søket.
 */
export const NOTES = [
  {
    d: "presse-februar",
    t: "Pressemelding februar",
    url: "https://www.betonmast.no/2026/02/09/betonmast-skal-bygge-helse-og-velferdssenter-pa-heimdal/",
    x: `Pressemelding fra Betonmast, 9. februar 2026: «Betonmast skal bygge helse- og velferdssenter på Heimdal».
Entreprenør: Betonmast Trøndelag har signert intensjonsavtale med Trondheim kommune (byggherre) om å bygge Heimdal helse- og velferdssenter og bibliotek. Betonmast var innstilt av kommunen.
Entrepriseform: totalentreprise med samhandling.
Verdi og kostnad: forventet verdi om lag 450 millioner kroner ekskl. mva.
Størrelse: totalt ca. 15 000 m2. 72 pasientrom, nytt sonekontor for hjemmetjenesten og et bydelsbibliotek. Tre etasjer over bakken og parkeringskjeller i to etasjer.
Miljø: skal klassifiseres Very Good etter BREEAM-NOR, tilfredsstille passivhusnivå, og det stilles krav om utslippsfri byggeplass.
Fremdrift slik den var i februar 2026: samhandlingsperiode frem til april 2026, deretter byggekontrakt basert på revidert pris, med forbehold om endelig politisk vedtak. Byggestart var ventet sommeren 2026 og ferdigstillelse planlagt til november 2028.
Uttaler seg: konsernsjef Peter Sandrup i Betonmast og daglig leder Tom Utvik i Betonmast Trøndelag.`,
  },
  {
    d: "presse-oktober",
    t: "Pressemelding oktober",
    url: "https://kommunikasjon.ntb.no/pressemelding/19112749/betonmast-starter-byggingen-av-heimdalstunet-helse-og-velferdssenter-og-trondheim-folkebibliotek-heimdal?lang=no",
    x: `Pressemelding fra AF Gruppen, 21. oktober 2026: «Betonmast starter byggingen av Heimdalstunet helse- og velferdssenter og Trondheim folkebibliotek - Heimdal». Dette er den nyeste kilden om byggingen.
Entreprenør: Betonmast Trøndelag og Trondheim kommune har signert totalentreprisekontrakt. Prosjektet går over i gjennomføringsfasen etter samhandlingen. Prosjektet heter nå Heimdalstunet.
Verdi og kostnad: kontraktsverdi om lag 450 millioner kroner ekskl. mva.
Størrelse: totalt om lag 15 000 m2. 72 pasientrom, nytt sonekontor for hjemmetjenesten og bydelsbibliotek. Tre etasjer over bakken og parkeringskjeller i to plan, hvorav ett er offentlig.
Miljø: skal sertifiseres BREEAM-NOR Very Good, tilfredsstille passivhusnivå og gjennomføres med utslippsfri byggeplass.
Beredskap: den offentlige parkeringskjelleren er planlagt som beskyttelsesrom (tilfluktsrom).
Fremdrift: byggearbeidene starter i løpet av høsten 2026, og prosjektet er planlagt ferdigstilt i 2029.
Uttaler seg: daglig leder Tom Utvik i Betonmast Trøndelag og finansbyråd Lars Magnussen (H). Illustrasjon: Eggen Arkitekter AS.`,
  },
];

export const SOURCES = [...DOCS, ...NOTES.map(({ d, t, url }) => ({ d, t, url }))];

/** Antall sider vi forventer totalt. extract-skriptet stopper hvis tallet avviker. */
export const EXPECTED_PAGES = 336; // 334 PDF-sider + 2 pressemeldinger
